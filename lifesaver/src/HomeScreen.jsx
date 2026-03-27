import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IMPACT, inferMeatType, HEADERS, FLAVOR_LINES, randomFrom,
  saveMeal, calculateImpactFromItems, getApiKey, resizeImage
} from './data'
import { analyzeMealImage, analyzeMealText } from './api/claude'
import AnimalReveal from './AnimalReveal'

export default function HomeScreen({ onSettingsOpen }) {
  const [meal, setMeal] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const dataUrl = await resizeImage(file)
    setPreview(dataUrl)
    setResult(null)
    setError(null)
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
    setError(null)
    setResult(null)

    const apiKey = getApiKey() || undefined

    setAnalyzing(true)
    try {
      let aiResult
      if (photo && preview) {
        aiResult = await analyzeMealImage(preview, apiKey)
      } else {
        aiResult = await analyzeMealText(meal.trim(), apiKey)
      }

      const items = aiResult.items || []
      if (items.length === 0) throw new Error('No food items identified')

      doLog(items, aiResult.description)
    } catch (err) {
      console.error('AI analysis failed, using fallback:', err)
      // Always fall back to keyword matching — never block the user
      const text = meal.trim() || 'plant-based meal'
      const type = inferMeatType(text)
      const items = [{ name: text, meatEquivalent: type, portionGrams: 200 }]
      doLog(items, null)
    } finally {
      setAnalyzing(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLog()
  }

  const hasInput = photo || meal.trim()

  return (
    <div className="home">
      <h1 className="home-title">Lifesaver</h1>
      <p className="home-subtitle">Log a plant-based meal. See what you saved.</p>

      {/* Photo capture zone */}
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="capture"
            className="photo-zone glass"
            onClick={() => fileRef.current?.click()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="photo-zone-inner">
              <div className="camera-icon">📸</div>
              <p className="photo-zone-text">Snap or upload your meal</p>
              <p className="photo-zone-hint">Tap to take a photo or choose from gallery</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />
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

      {/* Text input fallback */}
      <div className="input-section">
        <p className="or-divider">or type it</p>
        <input
          className="meal-input"
          type="text"
          placeholder="What did you eat?"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        className="log-btn"
        onClick={handleLog}
        disabled={!hasInput || analyzing}
      >
        {analyzing ? 'Analyzing...' : photo ? 'Analyze meal' : 'Log it'}
      </button>

      {/* Analyzing state */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            className="analyzing glass"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="analyzing-spinner" />
            <p className="analyzing-text">AI is analyzing your meal...</p>
            <p className="analyzing-subtext">Identifying items and calculating impact</p>
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
            <motion.p
              className="result-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {result.header}
            </motion.p>

            {result.description && (
              <motion.p
                className="result-subheader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {result.description}
              </motion.p>
            )}

            {/* AI-identified items */}
            {result.items.length > 0 && (
              <motion.div
                className="ai-items"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {result.items.map((item, i) => (
                  <span className="ai-item-chip" key={i}>
                    {item.name}
                    <span className="ai-item-arrow">→</span>
                    <span className="ai-item-meat">{item.meatEquivalent}</span>
                  </span>
                ))}
              </motion.div>
            )}

            {/* Animal reveal cards */}
            {Object.entries(result.impact.byAnimal).map(([type, data], i) => (
              <AnimalReveal
                key={type}
                animalType={data.image}
                count={data.count}
                label={data.label}
              />
            ))}

            {/* CO2 card */}
            <motion.div
              className="stat-card glass"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="stat-card-header">
                <span className="stat-card-icon">☁️</span>
                <span className="stat-card-label">CO₂ Avoided</span>
              </div>
              <p className="stat-card-value">{result.impact.co2.toFixed(1)} kg</p>
              <p className="stat-card-desc">of carbon dioxide didn't get dumped into the air</p>
              <div className="stat-bar">
                <motion.div
                  className="stat-bar-fill co2"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((result.impact.co2 / 10) * 100, 100)}%` }}
                  transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* Water card */}
            <motion.div
              className="stat-card glass"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="stat-card-header">
                <span className="stat-card-icon">💧</span>
                <span className="stat-card-label">Water Saved</span>
              </div>
              <p className="stat-card-value">{result.impact.water.toFixed(0)} gal</p>
              <p className="stat-card-desc">of water didn't get wasted raising livestock</p>
              <div className="stat-bar">
                <motion.div
                  className="stat-bar-fill water"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((result.impact.water / 1000) * 100, 100)}%` }}
                  transition={{ delay: 1, duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            <motion.p
              className="flavor"
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
