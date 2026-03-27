import { useState } from 'react'
import { IMPACT, inferMeatType, HEADERS, FLAVOR_LINES, randomFrom, saveMeal } from './data'

function CountUp({ value, decimals = 2 }) {
  const [display, setDisplay] = useState(0)
  const ref = useState(null)

  useState(() => {
    let start = 0
    const end = value
    const duration = 600
    const startTime = Date.now()

    function tick() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])

  return <span className="count-up">{display.toFixed(decimals)}</span>
}

function RepeatEmoji({ emoji, count }) {
  const full = Math.floor(count)
  const partial = count - full
  const icons = []
  for (let i = 0; i < Math.max(full, 1); i++) {
    icons.push(<span key={i}>{emoji}</span>)
  }
  if (partial > 0 && full > 0) {
    icons.push(
      <span key="partial" style={{ opacity: Math.max(partial, 0.3) }}>{emoji}</span>
    )
  }
  return <div className="visual-bar">{icons}</div>
}

export default function HomeScreen() {
  const [meal, setMeal] = useState('')
  const [result, setResult] = useState(null)

  function handleLog() {
    if (!meal.trim()) return

    const type = inferMeatType(meal)
    const impact = IMPACT[type]

    const entry = {
      timestamp: Date.now(),
      animals: impact.animals,
      co2: impact.co2,
      water: impact.water,
      meal: meal.trim(),
      type,
    }
    saveMeal(entry)

    setResult({
      ...impact,
      header: randomFrom(HEADERS),
      flavor: randomFrom(FLAVOR_LINES),
    })

    setMeal('')

    if (navigator.vibrate) navigator.vibrate(10)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLog()
  }

  return (
    <div className="home">
      <h1>Lifesaver</h1>

      <div className="input-group">
        <input
          className="meal-input"
          type="text"
          placeholder="What did you eat?"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button className="log-btn" onClick={handleLog} disabled={!meal.trim()}>
        Log it
      </button>

      {result && (
        <div className="results" key={Date.now()}>
          <p className="result-header">{result.header}</p>

          <div className="stat-card">
            <div className="stat-emoji">{result.emoji}</div>
            <p className="stat-text">
              ~<CountUp value={result.animals} decimals={3} /> {result.label} didn't get killed for this
            </p>
            <RepeatEmoji emoji={result.emoji} count={result.animals * 25} />
          </div>

          <div className="stat-card">
            <div className="stat-emoji">☁️</div>
            <p className="stat-text">
              ~<CountUp value={result.co2} decimals={1} /> kg CO₂ didn't get dumped into the air
            </p>
            <RepeatEmoji emoji="☁️" count={result.co2} />
          </div>

          <div className="stat-card">
            <div className="stat-emoji">💧</div>
            <p className="stat-text">
              ~<CountUp value={result.water} decimals={0} /> gallons of water didn't get wasted
            </p>
            <RepeatEmoji emoji="💧" count={Math.min(result.water / 50, 10)} />
          </div>

          <p className="flavor">{result.flavor}</p>
        </div>
      )}
    </div>
  )
}
