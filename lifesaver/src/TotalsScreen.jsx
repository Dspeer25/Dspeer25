import { useState } from 'react'
import { motion } from 'framer-motion'
import { getTotals, loadMeals } from './data'

function fmt(n, decimals = 0) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function getStreak() {
  const meals = loadMeals()
  if (meals.length === 0) return 0
  const days = new Set(meals.map((m) => new Date(m.timestamp).toDateString()))
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (days.has(d.toDateString())) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

function CountUp({ value, decimals = 2, format = true }) {
  const [display, setDisplay] = useState(0)
  useState(() => {
    const duration = 800
    const startTime = Date.now()
    function tick() {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(value * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [])
  if (format) return <>{fmt(display, decimals)}</>
  return <>{display.toFixed(decimals)}</>
}

const ANIMAL_EMOJIS = { cow: '🐄', chicken: '🐔', pig: '🐖' }
const ANIMAL_LABELS = { cow: 'Cows', chicken: 'Chickens', pig: 'Pigs' }

export default function TotalsScreen() {
  const totals = getTotals()
  const streak = getStreak()

  if (totals.count === 0) {
    return (
      <div className="totals">
        <h1 className="totals-title">Your Impact</h1>
        <p className="home-subtitle">Every meal counts.</p>
        <p className="empty-state">No meals logged yet. Go log one.</p>
      </div>
    )
  }

  const co2Lbs = totals.co2 * 2.205
  const nalgeneBottles = Math.round(totals.water / 0.25)

  // Merge animal entries by label (cow/chicken/pig)
  const mergedAnimals = {}
  for (const [key, data] of Object.entries(totals.byAnimal)) {
    const label = data.label || key
    if (!mergedAnimals[label]) {
      mergedAnimals[label] = { count: 0, label, emoji: data.emoji }
    }
    mergedAnimals[label].count += data.count
  }

  const animalEntries = Object.entries(mergedAnimals)

  const mainCards = [
    { emoji: '🍽️', value: totals.count, decimals: 0, label: 'Meals Logged' },
    { emoji: '☁️', value: co2Lbs, decimals: 1, label: 'lbs CO2 Avoided' },
    { emoji: '💧', value: totals.water, decimals: 0, label: 'Gallons Water Saved' },
    { emoji: '🫙', value: nalgeneBottles, decimals: 0, label: 'Nalgene Bottles Worth' },
  ]

  return (
    <div className="totals">
      <h1 className="totals-title">Your Impact</h1>
      <p className="home-subtitle">Every meal counts.</p>

      {mainCards.map((card, i) => (
        <motion.div
          key={card.label}
          className="total-card glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <div className="total-emoji">{card.emoji}</div>
          <div className="total-number">
            <CountUp value={card.value} decimals={card.decimals} />
          </div>
          <div className="total-label">{card.label}</div>
        </motion.div>
      ))}

      {/* Animal breakdown by type */}
      {animalEntries.length > 0 && (
        <motion.div
          className="total-card glass"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: mainCards.length * 0.1, duration: 0.4 }}
        >
          <div className="total-emoji">🐾</div>
          <div className="total-label" style={{ marginBottom: 14 }}>Animals Saved (by type)</div>
          <div className="animal-breakdown">
            {animalEntries.map(([label, data]) => (
              <div className="animal-breakdown-row" key={label}>
                <span className="animal-breakdown-emoji">
                  {ANIMAL_EMOJIS[label] || '🐾'}
                </span>
                <span className="animal-breakdown-label">
                  {ANIMAL_LABELS[label] || label}
                </span>
                <span className="animal-breakdown-value">
                  {data.count.toFixed(3)}
                </span>
              </div>
            ))}
            <div className="animal-breakdown-total">
              <span>Total</span>
              <span>{totals.animals.toFixed(3)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {streak > 0 && (
        <motion.div
          className="streak-badge"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          🔥 <span className="streak-number">{streak}</span> day streak
        </motion.div>
      )}
    </div>
  )
}
