import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IMPACT, inferMeatType, HEADERS, FLAVOR_LINES, randomFrom,
  saveMeal, calculateImpactFromItems, getApiKey, resizeImage,
  CO2_FACTS, CROP_SETS
} from './data'
import { analyzeMealImage, analyzeMealText } from './api/claude'
import AnimalReveal from './AnimalReveal'

function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export default function HomeScreen() {
  const [meal, setMeal] = useState('')
  const [photo, setPhoto] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [debugError, setDebugError] = useState(null)
  const [cropSetIndex, setCropSetIndex] = useState(0)
  const [showFunny, setShowFunny] = useState(false)
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
      byAnimal: impact.byAnimal,
    })

    setResult({
      items,
      description,
      impact,
      totalAnimals,
      header: randomFrom(HEADERS),
      flavor: randomFrom(FLAVOR_LINES),
    })

    setCropSetIndex(0)
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
    setDebugError(null)

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
      setDebugError(null)
      doLog(items, aiResult.description)
    } catch (err) {
      console.error('[Lifesaver] AI FAILED:', err.message)
      if (err.message === 'NOT_FOOD') {
        setDebugError("That doesn't look right. Make sure the photo is clear and that food is pictured only.")
        setAnalyzing(false)
        return
      }
      setDebugError(`AI error: ${err.message}`)
      const text = meal.trim() || 'plant-based meal'
      const type = inferMeatType(text)
      doLog([{ name: text, meatEquivalent: type, portionGrams: 200 }], null)
    } finally {
      setAnalyzing(false)
    }
  }

  const hasInput = photo || meal.trim()
  const co2Lbs = result ? (result.impact.co2 * 2.205) : 0
  const co2Fact = result ? CO2_FACTS(co2Lbs) : ''
  const nalgeneCount = result ? Math.round(result.impact.water / 0.25) : 0
  const waterPercent = result ? Math.min((result.impact.water / 1000) * 100, 100) : 0

  const currentCrops = result ? CROP_SETS[cropSetIndex % CROP_SETS.length].map(c => ({
    ...c,
    amount: c.calc(result.impact.water),
  })) : []

  function rotateCrops() {
    setCropSetIndex(prev => prev + 1)
  }

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

      {/* Fun easter egg */}
      <button className="funny-btn" onClick={() => setShowFunny(prev => !prev)}>
        press for something funny
      </button>

      <AnimatePresence>
        {showFunny && (
          <motion.div
            className="funny-scene"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="funny-container">
              {/* CSS-drawn cartoon face */}
              <div className="funny-cartoon-face">
                <div className="cartoon-hair" />
                <div className="cartoon-head">
                  <div className="cartoon-eye cartoon-eye-left" />
                  <div className="cartoon-eye cartoon-eye-right" />
                  <div className="cartoon-mouth" />
                </div>
              </div>
              {/* Poop liquid dripping down - 3 big goopy streams */}
              <motion.div
                className="funny-poop-liquid"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, type: 'spring', bounce: 0.3 }}
              >
                <div className="poop-blob" />
                <div className="poop-drip poop-drip-1" />
                <div className="poop-drip poop-drip-2" />
                <div className="poop-drip poop-drip-3" />
              </motion.div>
            </div>
            <motion.p className="funny-caption"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            >
              Oops... someone had a rough day.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {debugError && (
        <div style={{
          background: debugError.includes("doesn't look right")
            ? 'rgba(255,180,50,0.15)' : 'rgba(255,50,50,0.15)',
          border: `1px solid ${debugError.includes("doesn't look right")
            ? 'rgba(255,180,50,0.3)' : 'rgba(255,100,100,0.3)'}`,
          borderRadius: 12,
          padding: '10px 14px',
          marginTop: 12,
          width: '100%',
          fontSize: 13,
          color: debugError.includes("doesn't look right") ? '#ffcc66' : '#ff9999',
          wordBreak: 'break-all',
          textAlign: 'center',
        }}>
          {debugError}
        </div>
      )}

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
                  <span className="ai-breakdown-equiv">replaces {item.meatEquivalent} (~{fmt(item.portionGrams)}g)</span>
                </div>
              ))}
            </motion.div>

            {/* Animal reveal — one per animal type (merged) */}
            {Object.entries(result.impact.byAnimal).map(([key, data]) => (
              <AnimalReveal key={key} animalType={data.image} count={data.count} label={data.label} />
            ))}

            {/* CO2 — dramatic space scene with real earth photo */}
            <motion.div className="visual-stat glass co2-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">CO2 Kept Out</span>
                <span className="visual-stat-value">{fmt(co2Lbs, 1)} lbs</span>
              </div>
              <p className="visual-stat-desc">{co2Fact}</p>

              <div className="co2-space-scene">
                {/* Starfield background */}
                <div className="stars-layer">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className="star"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${1 + Math.random() * 2}px`,
                        height: `${1 + Math.random() * 2}px`,
                        animationDelay: `${Math.random() * 3}s`,
                      }}
                    />
                  ))}
                </div>

                {/* Real Earth photo with pollution glow */}
                <div className="co2-real-earth">
                  <motion.img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/The_Blue_Marble_%28remastered%29.jpg/600px-The_Blue_Marble_%28remastered%29.jpg"
                    alt="Earth"
                    className="earth-photo"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 60, ease: 'linear' }}
                  />
                  <div className="earth-shadow" />
                  <div className="earth-pollution-glow" />
                </div>

                {/* 3 large dark smoke blobs streaming from earth to the right */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={`smoke-a-${i}`}
                    className="co2-smoke-blob"
                    style={{ top: `${15 + i * 30}%` }}
                    initial={{ left: '12%', opacity: 0, scale: 0.3 }}
                    animate={{
                      left: ['12%', '35%', '60%', '90%', '105%'],
                      opacity: [0, 0.95, 0.85, 0.4, 0],
                      scale: [0.3, 1.2, 1.5, 1.1, 0.6],
                    }}
                    transition={{
                      delay: i * 1.0,
                      duration: 4,
                      ease: 'easeOut',
                      repeat: Infinity,
                      repeatDelay: 0.3,
                    }}
                  />
                ))}
                {/* Second wave of smoke for continuous feel */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={`smoke-b-${i}`}
                    className="co2-smoke-blob co2-smoke-blob-alt"
                    style={{ top: `${25 + i * 25}%` }}
                    initial={{ left: '12%', opacity: 0, scale: 0.3 }}
                    animate={{
                      left: ['12%', '30%', '55%', '85%', '105%'],
                      opacity: [0, 0.8, 0.7, 0.3, 0],
                      scale: [0.3, 1.0, 1.3, 0.9, 0.5],
                    }}
                    transition={{
                      delay: i * 1.0 + 2.0,
                      duration: 4,
                      ease: 'easeOut',
                      repeat: Infinity,
                      repeatDelay: 0.3,
                    }}
                  />
                ))}

                {/* Pulsing label */}
                <motion.span
                  className="co2-space-label"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {fmt(co2Lbs, 1)} lbs avoided
                </motion.span>
              </div>
              <p className="co2-caption">This pollution didn't enter the atmosphere</p>
            </motion.div>

            {/* Water — warehouse photo with rising blue fill + crops */}
            <motion.div className="visual-stat glass water-section"
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            >
              <div className="visual-stat-header">
                <span className="visual-stat-label">Water Saved</span>
                <span className="visual-stat-value">{fmt(result.impact.water)} gal</span>
              </div>

              <div className="warehouse-fill-section">
                <div className="warehouse-container">
                  <img
                    src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80"
                    alt="Warehouse"
                    className="warehouse-bg-img"
                    loading="lazy"
                  />
                  <div
                    className="warehouse-water-fill"
                    style={{ height: `${Math.max(waterPercent, 5)}%` }}
                  />
                  <div className="warehouse-text-overlay">
                    <span className="warehouse-nalgene-count">{fmt(nalgeneCount)}</span>
                    <span className="warehouse-nalgene-label">Nalgene bottles worth</span>
                  </div>
                </div>
              </div>

              {/* Real crop equivalents with rotation */}
              <div className="crops-section">
                <div className="crops-header">
                  <p className="crops-title">That water could grow:</p>
                  <button className="crops-refresh" onClick={rotateCrops} title="Show different crops">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 018 14 6 6 0 1114 8h-3l4 4 4-4h-3a7.96 7.96 0 00-2.35-5.65z" fill="rgba(255,255,255,0.5)" transform="scale(0.85)" />
                    </svg>
                    <span>Or</span>
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cropSetIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                  >
                    {currentCrops.map((crop, i) => (
                      <motion.div className="crop-item" key={crop.name}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * i }}
                      >
                        <span className="crop-icon">{crop.emoji}</span>
                        <span className="crop-text">~{fmt(crop.amount)} {crop.name}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
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
