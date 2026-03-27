import { useState } from 'react'
import HomeScreen from './HomeScreen.jsx'
import TotalsScreen from './TotalsScreen.jsx'
import './App.css'

function App() {
  const [tab, setTab] = useState('log')

  return (
    <div className="app">
      <div className="screen">
        {tab === 'log' ? <HomeScreen /> : <TotalsScreen />}
      </div>
      <nav className="bottom-nav">
        <button
          className={`nav-btn ${tab === 'log' ? 'active' : ''}`}
          onClick={() => setTab('log')}
        >
          <span className="nav-icon">+</span>
          <span className="nav-label">Log</span>
        </button>
        <button
          className={`nav-btn ${tab === 'totals' ? 'active' : ''}`}
          onClick={() => setTab('totals')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Totals</span>
        </button>
      </nav>
    </div>
  )
}

export default App
