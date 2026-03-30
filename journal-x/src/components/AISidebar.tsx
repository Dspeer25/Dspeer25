'use client'
import { useState } from 'react'

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(false)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  if (!isOpen) {
    return (
      <div
        onClick={open}
        style={{
          position: 'fixed', right: 0, top: '50%',
          transform: 'translateY(-50%)', zIndex: 99999,
          background: '#0c0e17',
          borderTop: '1px solid rgba(0,212,160,0.3)',
          borderLeft: '1px solid rgba(0,212,160,0.3)',
          borderBottom: '1px solid rgba(0,212,160,0.3)',
          borderRight: 'none', borderRadius: '8px 0 0 8px',
          padding: '14px 10px', cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '8px',
        }}
      >
        <div style={{width:7,height:7,borderRadius:'50%',background:'#00d4a0',boxShadow:'0 0 8px rgba(0,212,160,0.6)'}}/>
        <svg width="22" height="24" viewBox="0 0 20 22" fill="none">
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
    <div style={{
      position: 'fixed', right: 0, top: 0,
      height: '100vh', width: 340, zIndex: 99999,
      background: '#0c0e17',
      borderLeft: '1px solid #1e2030',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'DM Mono, monospace',
    }}>
      {/* Header */}
      <div style={{padding:'18px 16px',borderBottom:'1px solid #1e2030',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
            <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
          </svg>
          <span style={{fontSize:13,color:'#00d4a0',letterSpacing:'0.1em',fontWeight:600}}>AI COACH — LIVE</span>
          <div style={{width:7,height:7,borderRadius:'50%',background:'#00d4a0',boxShadow:'0 0 8px rgba(0,212,160,0.6)'}}/>
        </div>
        <div onClick={close} style={{color:'#8a8d98',fontSize:22,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</div>
      </div>

      {/* Stats */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid #1e2030'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            {l:'WIN RATE',v:'61%',c:'#00d4a0'},
            {l:'TOTAL P&L',v:'+$2,937',c:'#00d4a0'},
            {l:'AVG R:R',v:'1.27',c:'#e0e0e8'},
            {l:'EXP. VALUE',v:'+$163',c:'#00d4a0'},
          ].map(s=>(
            <div key={s.l} style={{background:'#141620',border:'1px solid #1e2030',borderRadius:8,padding:'10px 12px'}}>
              <div style={{fontSize:11,color:'#8a8d98',letterSpacing:'0.07em',marginBottom:5,fontWeight:500}}>{s.l}</div>
              <div style={{fontSize:17,fontWeight:700,color:s.c}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Insight */}
      <div style={{padding:'14px 16px',borderBottom:'1px solid #1e2030'}}>
        <div style={{fontSize:12,color:'#8a8d98',letterSpacing:'0.08em',marginBottom:10,fontWeight:500}}>LATEST INSIGHT</div>
        <div style={{background:'#0f1a1a',border:'1px solid rgba(0,212,160,0.2)',borderRadius:8,padding:'12px 14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
            <svg width="14" height="16" viewBox="0 0 20 22" fill="none">
              <circle cx="10" cy="4.5" r="3.2" stroke="#00d4a0" strokeWidth="1.3"/>
              <line x1="10" y1="7.7" x2="10" y2="15.5" stroke="#00d4a0" strokeWidth="1.3"/>
              <line x1="5" y1="11" x2="15" y2="11" stroke="#00d4a0" strokeWidth="1.3"/>
              <line x1="10" y1="15.5" x2="6.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
              <line x1="10" y1="15.5" x2="13.5" y2="21" stroke="#00d4a0" strokeWidth="1.3"/>
            </svg>
            <span style={{fontSize:11,color:'#00d4a0',fontWeight:600}}>COACH</span>
          </div>
          <div style={{fontSize:13,color:'#b0c4b8',lineHeight:1.7}}>
            You have exited early on 4 of your last 6 winners. This has cost an estimated <span style={{color:'#00ffbb',fontWeight:600}}>$240</span> in unrealized gains this month.
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{padding:'14px 16px 90px',flexGrow:1,overflowY:'auto'}}>
        <div style={{fontSize:12,color:'#8a8d98',letterSpacing:'0.08em',marginBottom:12,fontWeight:500}}>CHAT WITH COACH</div>
        <div style={{background:'#0f1a1a',border:'1px solid rgba(0,212,160,0.15)',borderRadius:'8px 8px 8px 0',padding:'12px 14px',fontSize:13,color:'#b0c4b8',lineHeight:1.7}}>
          Hello. I have reviewed your last 18 trades. Your breakout setups are your edge at 71% win rate. Your biggest leak is mean reversion at 28% — consider removing it from your playbook.
        </div>
      </div>

      {/* Input */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'14px 16px',borderTop:'1px solid #1e2030',background:'#0c0e17',display:'flex',gap:8}}>
        <input
          placeholder="Ask your coach..."
          style={{flex:1,background:'#141620',border:'1px solid #1e2030',borderRadius:8,padding:'12px 14px',fontSize:13,color:'#e0e0e8',fontFamily:'DM Mono,monospace',outline:'none'}}
        />
        <div style={{background:'rgba(0,212,160,0.15)',border:'1px solid rgba(0,212,160,0.4)',borderRadius:8,padding:'12px 16px',color:'#00d4a0',fontSize:13,cursor:'pointer',fontWeight:600}}>Send</div>
      </div>
    </div>
  )
}
