import { useState, useRef } from 'react'
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

  // Water comparison: average shower = 17 gallons
  const showers = result ? (result.impact.water / 17).toFixed(1) : 0
  // CO2 comparison: driving 1 mile = ~0.41 kg CO2
  const miles = result ? (result.impact.co2 / 0.41).toFixed(1) : 0

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

      {/* Camera circle or photo preview */}
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

      {/* Text input */}
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

      {/* Analyzing */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            className="analyzing glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="analyzing-spinner" />
            <p className="analyzing-text">Reading your meal...</p>
            <p className="analyzing-subtext">Identifying ingredients & calculating impact</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="results"
            key={result.header + result.flavor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p className="result-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {result.header}
            </motion.p>

            {result.description && (
              <motion.p className="result-subheader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {result.description}
              </motion.p>
            )}

            {/* AI item breakdown */}
            <motion.div className="ai-breakdown glass"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="ai-breakdown-title">What we found</p>
              {result.items.map((item, i) => (
                <div className="ai-breakdown-item" key={i}>
                  <span className="ai-breakdown-name">{item.name}</span>
                  <span className="ai-breakdown-equiv">replaces {item.meatEquivalent}</span>
                </div>
              ))}
            </motion.div>

            {/* Animal reveal */}
            {Object.entries(result.impact.byAnimal).map(([type, data]) => (
              <AnimalReveal
                key={type}
                animalType={data.image}
                count={data.count}
                label={data.label}
              />
            ))}

            {/* CO2 — visual comparison */}
            <motion.div className="visual-stat glass"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">☁️ CO₂ Avoided</span>
                <span className="visual-stat-value">{result.impact.co2.toFixed(1)} kg</span>
              </div>
              <p className="visual-stat-desc">
                That's like <strong>not driving {miles} miles</strong>. This much pollution stayed out of the atmosphere:
              </p>
              <div className="co2-visual">
                {Array.from({ length: 8 }).map((_, i) => {
                  const threshold = (i / 8) * 10
                  const isAvoided = result.impact.co2 > threshold
                  return (
                    <motion.div
                      key={i}
                      className={`co2-stack ${isAvoided ? 'avoided' : 'normal'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${20 + Math.random() * 60}%` }}
                      transition={{ delay: 0.8 + i * 0.05, duration: 0.6 }}
                    />
                  )
                })}
              </div>
              <div className="co2-labels">
                <span>Your meal</span>
                <span>Meat equivalent</span>
              </div>
            </motion.div>

            {/* Water — tank visual */}
            <motion.div className="visual-stat glass"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">💧 Water Saved</span>
                <span className="visual-stat-value">{result.impact.water.toFixed(0)} gal</span>
              </div>
              <p className="visual-stat-desc">
                That's <strong>{showers} showers</strong> worth of water that didn't get used raising livestock.
              </p>
              <div className="water-visual">
                <motion.div
                  className="water-fill"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min((result.impact.water / 700) * 100, 95)}%` }}
                  transition={{ delay: 1, duration: 1.2, ease: 'easeOut' }}
                />
                <div className="water-equivalent">
                  <span className="water-equiv-number">🚿 {showers}</span>
                  <span className="water-equiv-text">showers worth</span>
                </div>
              </div>
            </motion.div>

            <motion.p className="flavor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {result.flavor}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
