import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getApiKey, setApiKey } from './data'

export default function Settings({ open, onClose }) {
  const [key, setKey] = useState(getApiKey())
  const [status, setStatus] = useState(null)

  function handleSave() {
    if (!key.trim()) {
      setStatus({ ok: false, msg: 'Please enter an API key' })
      return
    }
    setApiKey(key.trim())
    setStatus({ ok: true, msg: 'Saved!' })
    setTimeout(() => onClose(), 800)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="settings-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            className="settings-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="settings-handle" />
            <h2 className="settings-title">Settings</h2>

            <p className="settings-label">Anthropic API Key</p>
            <input
              className="settings-input"
              type="password"
              placeholder="sk-ant-..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <p className="settings-hint">
              Required for AI meal analysis. Your key is stored locally and never sent anywhere except the Anthropic API.
            </p>

            <button className="settings-save" onClick={handleSave}>
              Save
            </button>

            {status && (
              <p className={`settings-status ${status.ok ? 'ok' : 'err'}`}>
                {status.msg}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
