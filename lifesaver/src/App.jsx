import { useState } from 'react'
import HomeScreen from './HomeScreen.jsx'
import TotalsScreen from './TotalsScreen.jsx'
import Settings from './Settings.jsx'
import './App.css'

function App() {
  const [tab, setTab] = useState('log')
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="app">
      <button
        className="settings-trigger"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
      >
        ⚙
      </button>

      <div className="screen">
        {tab === 'log' ? (
          <HomeScreen onSettingsOpen={() => setSettingsOpen(true)} />
        ) : (
          <TotalsScreen />
        )}
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

      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
