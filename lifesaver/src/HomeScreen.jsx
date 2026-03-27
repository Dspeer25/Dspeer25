import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IMPACT, inferMeatType, HEADERS, FLAVOR_LINES, randomFrom,
  saveMeal, calculateImpactFromItems, getApiKey, resizeImage
} from './data'
import { analyzeMealImage, analyzeMealText } from './api/claude'
import AnimalReveal from './AnimalReveal'

export default function HomeScreen() {
  const [meal, setMeal] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const dataUrl = await resizeImage(file)
    setPreview(dataUrl)
    setResult(null)
  }

  function removePhoto() {
    setPhoto(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function doLog(items, description) {
    const impact = calculateImpactFromItems(items)
    const totalAnimals = Object.values(impact.byAnimal).reduce((s, a) => s + a.count, 0)

    saveMeal({
      timestamp: Date.now(),
      animals: totalAnimals,
      co2: impact.co2,
      water: impact.water,
      meal: description || meal.trim() || 'Meal',
      items,
    })

    setResult({
      items,
      description,
      impact,
      totalAnimals,
      header: randomFrom(HEADERS),
      flavor: randomFrom(FLAVOR_LINES),
    })

    setMeal('')
    setPhoto(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    if (navigator.vibrate) navigator.vibrate(10)
  }

  async function handleLog() {
    if (!photo && !meal.trim()) return
    setResult(null)
    setAnalyzing(true)

    const apiKey = getApiKey() || undefined

    try {
      let aiResult
      if (photo && preview) {
        aiResult = await analyzeMealImage(preview, apiKey)
      } else {
        aiResult = await analyzeMealText(meal.trim(), apiKey)
      }
      const items = aiResult.items || []
      if (items.length === 0) throw new Error('empty')
      doLog(items, aiResult.description)
    } catch (err) {
      console.error('AI fallback:', err)
      const text = meal.trim() || 'plant-based meal'
      const type = inferMeatType(text)
      doLog([{ name: text, meatEquivalent: type, portionGrams: 200 }], null)
    } finally {
      setAnalyzing(false)
    }
  }

  const hasInput = photo || meal.trim()
  const co2Lbs = result ? (result.impact.co2 * 2.205).toFixed(1) : 0
  const miles = result ? (result.impact.co2 / 0.41).toFixed(1) : 0
  const showers = result ? (result.impact.water / 17).toFixed(1) : 0
  const plants = result ? Math.round(result.impact.water / 3) : 0

  return (
    <div className="home">
      <h1 className="home-title">Lifesaver</h1>
      <p className="home-subtitle">Snap your plant-based meal. See what you saved.</p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        style={{ display: 'none' }}
      />

      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="camera"
            className="camera-circle"
            onClick={() => fileRef.current?.click()}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileTap={{ scale: 0.93 }}
          >
            <span className="camera-circle-icon">📷</span>
            <span className="camera-circle-text">Take photo<br/>or upload</span>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            className="photo-preview-card glass"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <img src={preview} alt="Your meal" className="photo-preview-img" />
            <button className="photo-remove" onClick={removePhoto}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="input-section">
        <p className="or-divider">or type it</p>
        <input
          className="meal-input"
          type="text"
          placeholder="What did you eat?"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLog()}
        />
      </div>

      <button className="log-btn" onClick={handleLog} disabled={!hasInput || analyzing}>
        {analyzing ? 'Analyzing...' : photo ? 'Analyze meal' : 'Log it'}
      </button>

      <AnimatePresence>
        {analyzing && (
          <motion.div className="analyzing glass"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <div className="analyzing-spinner" />
            <p className="analyzing-text">Reading your meal...</p>
            <p className="analyzing-subtext">Identifying ingredients & calculating impact</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div className="results" key={result.header + result.flavor}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
          >
            <motion.p className="result-header"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            >
              {result.header}
            </motion.p>

            {result.description && (
              <motion.p className="result-subheader"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              >
                {result.description}
              </motion.p>
            )}

            {/* AI spotted these items */}
            <motion.div className="ai-breakdown glass"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            >
              <p className="ai-breakdown-title">🔍 What we spotted</p>
              {result.items.map((item, i) => (
                <div className="ai-breakdown-item" key={i}>
                  <span className="ai-breakdown-bullet">•</span>
                  <span className="ai-breakdown-name">{item.name}</span>
                  <span className="ai-breakdown-equiv">→ replaces {item.meatEquivalent} (~{item.portionGrams}g)</span>
                </div>
              ))}
            </motion.div>

            {/* Animal reveal */}
            {Object.entries(result.impact.byAnimal).map(([type, data]) => (
              <AnimalReveal key={type} animalType={data.image} count={data.count} label={data.label} />
            ))}

            {/* CO2 — animated cloud leaving earth */}
            <motion.div className="visual-stat glass co2-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">☁️ CO₂ Kept Out</span>
                <span className="visual-stat-value">{co2Lbs} lbs</span>
              </div>
              <p className="visual-stat-desc">
                That's like <strong>not driving {miles} miles</strong>.
              </p>

              <div className="co2-animation-scene">
                <div className="co2-earth">🌍</div>
                <motion.div className="co2-cloud-group"
                  initial={{ x: 0, opacity: 0.9 }}
                  animate={{ x: 200, opacity: 0, scale: 0.3 }}
                  transition={{ delay: 1, duration: 2, ease: 'easeIn' }}
                >
                  <div className="co2-dirty-cloud">
                    <span>💨</span><span>💨</span><span>💨</span>
                  </div>
                  <span className="co2-cloud-label">{co2Lbs} lbs</span>
                </motion.div>
                <div className="co2-vortex">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  >🌀</motion.div>
                </div>
                <p className="co2-caption">This pollution didn't enter the atmosphere</p>
              </div>
            </motion.div>

            {/* Water — bathtub fill + plants */}
            <motion.div className="visual-stat glass water-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">💧 Water Saved</span>
                <span className="visual-stat-value">{result.impact.water.toFixed(0)} gal</span>
              </div>
              <p className="visual-stat-desc">
                That's <strong>{showers} showers</strong> worth of water.
              </p>

              <div className="water-scene">
                <div className="bathtub-container">
                  <div className="bathtub-outline">
                    <motion.div className="bathtub-water"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.min((result.impact.water / 700) * 100, 90)}%` }}
                      transition={{ delay: 1.2, duration: 1.5, ease: 'easeOut' }}
                    />
                    <div className="bathtub-label">
                      <span className="bathtub-icon">🛁</span>
                      <span>{result.impact.water.toFixed(0)} gal</span>
                    </div>
                  </div>
                </div>
                <div className="plants-grown">
                  <p className="plants-title">That water could grow:</p>
                  <div className="plants-row">
                    {Array.from({ length: Math.min(plants, 30) }).map((_, i) => (
                      <motion.span key={i} className="plant-icon"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 + i * 0.04 }}
                      >🌱</motion.span>
                    ))}
                  </div>
                  <p className="plants-count"><strong>{plants}</strong> edible plants</p>
                </div>
              </div>
            </motion.div>

            <motion.p className="flavor"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            >
              {result.flavor}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
