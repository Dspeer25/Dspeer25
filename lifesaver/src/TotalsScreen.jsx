import { getTotals, loadMeals } from './data'

function getStreak() {
  const meals = loadMeals()
  if (meals.length === 0) return 0

  const days = new Set(
    meals.map((m) => new Date(m.timestamp).toDateString())
  )

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

export default function TotalsScreen() {
  const totals = getTotals()
  const streak = getStreak()

  if (totals.count === 0) {
    return (
      <div className="totals">
        <h1>Your Impact</h1>
        <p className="empty-state">No meals logged yet. Go log one.</p>
      </div>
    )
  }

  return (
    <div className="totals">
      <h1>Your Impact</h1>

      <div className="total-card">
        <div className="total-emoji">🍽️</div>
        <div className="total-number">{totals.count}</div>
        <div className="total-label">meals logged</div>
      </div>

      <div className="total-card">
        <div className="total-emoji">🐾</div>
        <div className="total-number">{totals.animals.toFixed(2)}</div>
        <div className="total-label">animals saved</div>
      </div>

      <div className="total-card">
        <div className="total-emoji">☁️</div>
        <div className="total-number">{totals.co2.toFixed(1)}</div>
        <div className="total-label">kg CO₂ avoided</div>
      </div>

      <div className="total-card">
        <div className="total-emoji">💧</div>
        <div className="total-number">{totals.water.toFixed(0)}</div>
        <div className="total-label">gallons water saved</div>
      </div>

      {streak > 0 && (
        <div className="streak-badge">
          🔥 <span className="streak-number">{streak}</span> day streak
        </div>
      )}
    </div>
  )
}
