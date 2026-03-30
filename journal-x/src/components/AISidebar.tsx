'use client'
import { useState } from 'react'

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai-sidebar-open') === 'true'
    }
    return false
  })
  const [messages, setMessages] = useState([
    { role: 'coach', text: "Hello. I've reviewed your last 18 trades. Your breakout setups are your edge — 71% win rate. Your biggest leak is mean reversion at 28%. Consider removing it from your playbook entirely." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/coach', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'coach', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: 'Something went wrong.' }])
    }
    setLoading(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); localStorage.setItem('ai-sidebar-open', 'true'); setIsOpen(true) }}
        style={{position:'fixed',right:0,top:'50%',transform:'translateY(-50%)',zIndex:2147483647,background:'#0a0a0a',border:'0.5px solid rgba(0,212,160,0.3)',borderRight:'none',borderRadius:'8px 0 0 8px',padding:'14px 10px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px'}}
      >
        <div style={{width:6,height:6,borderRadius:'50%',background:'#00d4a0'}}/>
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
          <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
        </svg>
      </button>
    )
  }

  return (
    <div
      id="ai-sidebar-panel"
      onClick={(e) => e.stopPropagation()}
      style={{position:'fixed',right:0,top:0,height:'100vh',width:'320px',zIndex:2147483647,background:'#0a0a0a',borderLeft:'0.5px solid #1e1e1e',display:'flex',flexDirection:'column',fontFamily:'DM Mono,monospace'}}
    >
      <div style={{padding:'16px',borderBottom:'0.5px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
            <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
          </svg>
          <span style={{fontSize:11,color:'#00d4a0',letterSpacing:'0.1em'}}>AI COACH — LIVE</span>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#00d4a0'}}/>
        </div>
        <button onClick={(e) => { e.stopPropagation(); localStorage.setItem('ai-sidebar-open', 'false'); setIsOpen(false) }} style={{background:'none',border:'none',color:'#555',fontSize:20,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</button>
      </div>
      <div style={{padding:'12px 16px',borderBottom:'0.5px solid #1a1a1a',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[{l:'WIN RATE',v:'61%',c:'#00d4a0'},{l:'TOTAL P&L',v:'+$2,937',c:'#00d4a0'},{l:'AVG R:R',v:'1.27',c:'#aaa'},{l:'EXP. VALUE',v:'+$163',c:'#00d4a0'}].map(s=>(
          <div key={s.l} style={{background:'#111',border:'0.5px solid #1e1e1e',borderRadius:6,padding:'8px 10px'}}>
            <div style={{fontSize:9,color:'#444',letterSpacing:'0.07em',marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:15,fontWeight:600,color:s.c}}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{padding:'12px 16px',borderBottom:'0.5px solid #1a1a1a'}}>
        <div style={{fontSize:10,color:'#333',letterSpacing:'0.08em',marginBottom:8}}>LATEST INSIGHT</div>
        <div style={{background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.15)',borderRadius:6,padding:'10px 12px',fontSize:11,color:'#5a7a68',lineHeight:1.6}}>
          You have exited early on 4 of your last 6 winners. This has cost an estimated <span style={{color:'#00d4a0'}}>$240</span> in unrealized gains this month.
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'12px 16px',display:'flex',flexDirection:'column',gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{alignSelf:m.role==='user'?'flex-end':'flex-start',maxWidth:'85%'}}>
            {m.role==='coach' && <div style={{fontSize:9,color:'#00d4a0',marginBottom:4,letterSpacing:'0.08em'}}>COACH</div>}
            <div style={{background:m.role==='user'?'#1a1a1a':'#0c1812',border:m.role==='user'?'0.5px solid #2a2a2a':'0.5px solid rgba(0,212,160,0.1)',borderRadius:m.role==='user'?'6px 6px 0 6px':'6px 6px 6px 0',padding:'10px 12px',fontSize:12,color:m.role==='user'?'#aaa':'#5a7a68',lineHeight:1.6}}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{alignSelf:'flex-start',background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.1)',borderRadius:'6px 6px 6px 0',padding:'10px 14px',color:'#00d4a0',fontSize:12}}>...</div>}
      </div>
      <div style={{padding:'12px 16px',borderTop:'0.5px solid #1a1a1a',display:'flex',gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendMessage()} placeholder="Ask your coach..." style={{flex:1,background:'#111',border:'0.5px solid #1e1e1e',borderRadius:6,padding:'10px 12px',fontSize:12,color:'#aaa',fontFamily:'DM Mono,monospace',outline:'none'}}/>
        <button onClick={sendMessage} style={{background:'rgba(0,212,160,0.1)',border:'0.5px solid rgba(0,212,160,0.3)',borderRadius:6,padding:'10px 14px',color:'#00d4a0',fontSize:12,cursor:'pointer'}}>Send</button>
      </div>
    </div>
  )
}
