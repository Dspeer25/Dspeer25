import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IMPACT, inferMeatType, HEADERS, FLAVOR_LINES, randomFrom,
  saveMeal, calculateImpactFromItems, getApiKey, resizeImage
} from './data'
import { analyzeMealImage, analyzeMealText } from './api/claude'
import AnimalReveal from './AnimalReveal'

function SmokeCloud({ delay = 0, size = 1, y = 0 }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: 48,
        top: `calc(50% + ${y}px)`,
        transform: 'translateY(-50%)',
      }}
      initial={{ x: 0, opacity: 0.85, scale: size }}
      animate={{ x: 220, opacity: 0, scale: size * 0.2 }}
      transition={{ delay: 0.8 + delay, duration: 1.5, ease: 'easeIn' }}
    >
      <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
        <ellipse cx="20" cy="16" rx="18" ry="11" fill="rgba(60,60,60,0.7)" />
        <ellipse cx="14" cy="12" rx="12" ry="9" fill="rgba(80,80,80,0.6)" />
        <ellipse cx="26" cy="10" rx="10" ry="8" fill="rgba(50,50,50,0.65)" />
        <ellipse cx="20" cy="8" rx="8" ry="6" fill="rgba(70,70,70,0.5)" />
      </svg>
    </motion.div>
  )
}

function EarthIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r="20" fill="#1a6b4a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <ellipse cx="16" cy="14" rx="8" ry="6" fill="#2d8a5e" />
      <ellipse cx="28" cy="24" rx="7" ry="8" fill="#2d8a5e" />
      <ellipse cx="12" cy="28" rx="5" ry="4" fill="#2d8a5e" />
      <circle cx="22" cy="22" r="20" fill="url(#earthShine)" />
      <defs>
        <radialGradient id="earthShine" cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="rgba(100,180,255,0.2)" />
          <stop offset="100%" stopColor="rgba(0,50,100,0.3)" />
        </radialGradient>
      </defs>
    </svg>
  )
}

function NalgeneBottle({ delay = 0 }) {
  return (
    <motion.svg
      width="18" height="36" viewBox="0 0 18 36" fill="none"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{ flexShrink: 0 }}
    >
      <rect x="5" y="0" width="8" height="4" rx="1" fill="rgba(255,255,255,0.3)" />
      <rect x="3" y="4" width="12" height="30" rx="3" fill="rgba(80,170,255,0.15)" stroke="rgba(80,170,255,0.4)" strokeWidth="1" />
      <motion.rect
        x="4" y="34" width="10" height="0" rx="2"
        fill="rgba(80,170,255,0.5)"
        initial={{ height: 0, y: 34 }}
        animate={{ height: 26, y: 8 }}
        transition={{ delay: delay + 0.3, duration: 0.8, ease: 'easeOut' }}
      />
    </motion.svg>
  )
}

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

  // Water: Nalgene bottles (1 Nalgene = 32oz = 0.25 gal)
  const nalgeneCount = result ? Math.round(result.impact.water / 0.25) : 0
  // Real crop equivalents
  const lettuceHeads = result ? Math.round(result.impact.water / 4) : 0
  const tomatoPlants = result ? Math.round(result.impact.water / 3.5) : 0
  const potatoLbs = result ? Math.round(result.impact.water / 25) : 0

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
              <p className="ai-breakdown-title">What we spotted</p>
              {result.items.map((item, i) => (
                <div className="ai-breakdown-item" key={i}>
                  <span className="ai-breakdown-bullet">•</span>
                  <span className="ai-breakdown-name">{item.name}</span>
                  <span className="ai-breakdown-equiv">replaces {item.meatEquivalent} (~{item.portionGrams}g)</span>
                </div>
              ))}
            </motion.div>

            {/* Animal reveal */}
            {Object.entries(result.impact.byAnimal).map(([type, data]) => (
              <AnimalReveal key={type} animalType={data.image} count={data.count} label={data.label} />
            ))}

            {/* CO2 — SVG smoke cloud leaving earth */}
            <motion.div className="visual-stat glass co2-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">CO2 Kept Out</span>
                <span className="visual-stat-value">{co2Lbs} lbs</span>
              </div>
              <p className="visual-stat-desc">
                That's like <strong>not driving {miles} miles</strong>.
              </p>

              <div className="co2-animation-scene">
                <div className="co2-earth-icon">
                  <EarthIcon />
                </div>
                <SmokeCloud delay={0} size={1.1} y={-6} />
                <SmokeCloud delay={0.15} size={0.8} y={8} />
                <SmokeCloud delay={0.3} size={0.9} y={-2} />
                <motion.div
                  className="co2-cloud-label-float"
                  initial={{ x: 60, opacity: 0.9 }}
                  animate={{ x: 220, opacity: 0 }}
                  transition={{ delay: 0.9, duration: 1.5, ease: 'easeIn' }}
                >
                  {co2Lbs} lbs
                </motion.div>
                <div className="co2-void">
                  <motion.div
                    className="co2-void-ring"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.3, 0.6] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  />
                  <div className="co2-void-center" />
                </div>
              </div>
              <p className="co2-caption">This pollution didn't enter the atmosphere</p>
            </motion.div>

            {/* Water — Nalgene bottles + real crops */}
            <motion.div className="visual-stat glass water-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">Water Saved</span>
                <span className="visual-stat-value">{result.impact.water.toFixed(0)} gal</span>
              </div>

              {/* Nalgene bottle comparison */}
              <div className="nalgene-section">
                <p className="nalgene-headline">
                  That's <strong>~{nalgeneCount.toLocaleString()} Nalgene bottles</strong> of water
                </p>
                <div className="nalgene-grid">
                  {Array.from({ length: Math.min(16, Math.ceil(nalgeneCount / 30)) }).map((_, i) => (
                    <NalgeneBottle key={i} delay={1 + i * 0.06} />
                  ))}
                  {nalgeneCount > 16 && (
                    <motion.span className="nalgene-more"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                    >
                      x{nalgeneCount.toLocaleString()}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Real crop equivalents */}
              <div className="crops-section">
                <p className="crops-title">That water could grow:</p>
                <motion.div className="crop-item"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                >
                  <span className="crop-icon">🥬</span>
                  <span className="crop-text">~{lettuceHeads} heads of lettuce</span>
                </motion.div>
                <motion.div className="crop-item"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.55 }}
                >
                  <span className="crop-icon">🍅</span>
                  <span className="crop-text">~{tomatoPlants} tomato plants</span>
                </motion.div>
                <motion.div className="crop-item"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.7 }}
                >
                  <span className="crop-icon">🥔</span>
                  <span className="crop-text">~{potatoLbs} lbs of potatoes</span>
                </motion.div>
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
