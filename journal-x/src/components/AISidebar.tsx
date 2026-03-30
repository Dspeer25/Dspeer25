'use client'
import { useState, useEffect } from 'react'

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  if (!isOpen) {
    return (
      <div
        onClick={open}
        style={{
          position: 'fixed',
          right: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 99999,
          background: '#0a0a0a',
          borderTop: '0.5px solid rgba(0,212,160,0.3)',
          borderLeft: '0.5px solid rgba(0,212,160,0.3)',
          borderBottom: '0.5px solid rgba(0,212,160,0.3)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          padding: '14px 10px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          userSelect: 'none',
        }}
      >
        <div style={{width:6,height:6,borderRadius:'50%',background:'#00d4a0'}}/>
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
          <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
        </svg>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '0px',
        top: '0px',
        width: '320px',
        height: '100vh',
        zIndex: 99999,
        background: '#0a0a0a',
        borderLeft: '0.5px solid #1e1e1e',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'DM Mono, monospace',
        overflowY: 'auto',
      }}
    >
      <div style={{padding:'16px',borderBottom:'0.5px solid #1a1a1a',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
            <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
          </svg>
          <span style={{fontSize:11,color:'#00d4a0',letterSpacing:'0.1em'}}>AI COACH — LIVE</span>
        </div>
        <div onClick={close} style={{color:'#555',fontSize:20,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</div>
      </div>

      <div style={{padding:'12px 16px',borderBottom:'0.5px solid #1a1a1a',flexShrink:0}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            {l:'WIN RATE',v:'61%',c:'#00d4a0'},
            {l:'TOTAL P&L',v:'+$2,937',c:'#00d4a0'},
            {l:'AVG R:R',v:'1.27',c:'#aaa'},
            {l:'EXP. VALUE',v:'+$163',c:'#00d4a0'},
          ].map(s => (
            <div key={s.l} style={{background:'#111',border:'0.5px solid #1e1e1e',borderRadius:6,padding:'8px 10px'}}>
              <div style={{fontSize:9,color:'#444',letterSpacing:'0.07em',marginBottom:4}}>{s.l}</div>
              <div style={{fontSize:15,fontWeight:600,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'12px 16px',borderBottom:'0.5px solid #1a1a1a',flexShrink:0}}>
        <div style={{fontSize:10,color:'#333',letterSpacing:'0.08em',marginBottom:8}}>LATEST INSIGHT</div>
        <div style={{background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.15)',borderRadius:6,padding:'10px 12px',fontSize:11,color:'#5a7a68',lineHeight:1.6}}>
          You have exited early on 4 of your last 6 winners. This has cost an estimated <span style={{color:'#00d4a0'}}>$240</span> in unrealized gains this month.
        </div>
      </div>

      <div style={{padding:'12px 16px 80px',flexGrow:1,overflowY:'auto'}}>
        <div style={{fontSize:10,color:'#333',letterSpacing:'0.08em',marginBottom:10}}>CHAT WITH COACH</div>
        <div style={{background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.1)',borderRadius:'6px 6px 6px 0',padding:'10px 12px',fontSize:12,color:'#5a7a68',lineHeight:1.6}}>
          Hello. I have reviewed your last 18 trades. Your breakout setups are your edge at 71% win rate. Your biggest leak is mean reversion at 28% — consider removing it from your playbook.
        </div>
      </div>

      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'12px 16px',borderTop:'0.5px solid #1a1a1a',background:'#0a0a0a',display:'flex',gap:8}}>
        <input
          placeholder="Ask your coach..."
          style={{flex:1,background:'#111',border:'0.5px solid #1e1e1e',borderRadius:6,padding:'10px 12px',fontSize:12,color:'#aaa',fontFamily:'DM Mono,monospace',outline:'none'}}
        />
        <div style={{background:'rgba(0,212,160,0.1)',border:'0.5px solid rgba(0,212,160,0.3)',borderRadius:6,padding:'10px 14px',color:'#00d4a0',fontSize:12,cursor:'pointer'}}>Send</div>
      </div>
    </div>
  )
}
