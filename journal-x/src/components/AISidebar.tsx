'use client'
import { useState, useRef, useEffect } from 'react'

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'coach', text: "Hello. I've reviewed your last 18 trades. Your breakout setups are your edge — 71% win rate. Your biggest leak is mean reversion at 28%. Consider removing it from your playbook entirely." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'coach', text: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'coach', text: 'Something went wrong. Try again.' }])
    }
    setLoading(false)
  }

  const StickFigure = ({ size = 24, color = '#00d4a0' }: { size?: number; color?: string }) => (
    <svg width={size} height={size * 1.1} viewBox="0 0 20 22" fill="none">
      <circle cx="10" cy="4.5" r="3.2" stroke={color} strokeWidth="1.3"/>
      <line x1="10" y1="7.7" x2="10" y2="15.5" stroke={color} strokeWidth="1.3"/>
      <line x1="5" y1="11" x2="15" y2="11" stroke={color} strokeWidth="1.3"/>
      <line x1="10" y1="15.5" x2="6.5" y2="21" stroke={color} strokeWidth="1.3"/>
      <line x1="10" y1="15.5" x2="13.5" y2="21" stroke={color} strokeWidth="1.3"/>
    </svg>
  )

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .dot-pulse { animation: blink 1s infinite; }
        .dot-pulse:nth-child(2) { animation-delay: 0.2s; }
        .dot-pulse:nth-child(3) { animation-delay: 0.4s; }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position:'fixed', right:0, top:'50%',
            transform:'translateY(-50%)', zIndex:9999,
            background:'#0a0a0a',
            border:'0.5px solid rgba(0,212,160,0.3)',
            borderRight:'none',
            borderRadius:'8px 0 0 8px',
            padding:'14px 10px', cursor:'pointer',
            display:'flex', flexDirection:'column',
            alignItems:'center', gap:'8px'
          }}
        >
          <div style={{
            width:8, height:8, borderRadius:'50%',
            background:'#00d4a0',
            animation:'pulse 1.5s infinite'
          }}/>
          <StickFigure size={22}/>
        </button>
      )}

      {isOpen && (
        <div style={{
          position:'fixed', right:0, top:0,
          height:'100vh', width:320, zIndex:9999,
          background:'#0a0a0a',
          borderLeft:'0.5px solid #1e1e1e',
          display:'flex', flexDirection:'column',
          fontFamily:'DM Mono, monospace'
        }}>

          {/* Header */}
          <div style={{
            padding:'16px', borderBottom:'0.5px solid #1a1a1a',
            display:'flex', alignItems:'center',
            justifyContent:'space-between'
          }}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <StickFigure size={20}/>
              <span style={{fontSize:11, color:'#00d4a0', letterSpacing:'0.1em'}}>AI COACH — LIVE</span>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#00d4a0',animation:'pulse 1.5s infinite'}}/>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{background:'none',border:'none',color:'#555',fontSize:18,cursor:'pointer',padding:'0 4px',lineHeight:1}}
            >×</button>
          </div>

          {/* Stats */}
          <div style={{padding:'12px 16px', borderBottom:'0.5px solid #1a1a1a'}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              {[
                {label:'WIN RATE', value:'61%', color:'#00d4a0'},
                {label:'TOTAL P&L', value:'+$2,937', color:'#00d4a0'},
                {label:'AVG R:R', value:'1.27', color:'#aaa'},
                {label:'EXP. VALUE', value:'+$163', color:'#00d4a0'},
              ].map(s => (
                <div key={s.label} style={{background:'#111',border:'0.5px solid #1e1e1e',borderRadius:6,padding:'8px 10px'}}>
                  <div style={{fontSize:9,color:'#444',letterSpacing:'0.07em',marginBottom:4}}>{s.label}</div>
                  <div style={{fontSize:15,fontWeight:600,color:s.color}}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest insight */}
          <div style={{padding:'12px 16px', borderBottom:'0.5px solid #1a1a1a'}}>
            <div style={{fontSize:10,color:'#333',letterSpacing:'0.08em',marginBottom:8}}>LATEST INSIGHT</div>
            <div style={{background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.15)',borderRadius:6,padding:'10px 12px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <StickFigure size={12}/>
                <span style={{fontSize:10,color:'#00d4a0',letterSpacing:'0.08em'}}>COACH</span>
              </div>
              <div style={{fontSize:11,color:'#5a7a68',lineHeight:1.6}}>
                You&apos;ve exited early on 4 of your last 6 winners. This has cost an estimated <span style={{color:'#00d4a0'}}>$240</span> in unrealized gains this month.
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10}}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth:'85%'
              }}>
                {m.role === 'coach' && (
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:4}}>
                    <StickFigure size={10}/>
                    <span style={{fontSize:9,color:'#00d4a0',letterSpacing:'0.08em'}}>COACH</span>
                  </div>
                )}
                <div style={{
                  background: m.role === 'user' ? '#1a1a1a' : '#0c1812',
                  border: m.role === 'user' ? '0.5px solid #2a2a2a' : '0.5px solid rgba(0,212,160,0.1)',
                  borderRadius: m.role === 'user' ? '6px 6px 0 6px' : '6px 6px 6px 0',
                  padding:'10px 12px',
                  fontSize:12,
                  color: m.role === 'user' ? '#aaa' : '#5a7a68',
                  lineHeight:1.6
                }}>{m.text}</div>
              </div>
            ))}
            {loading && (
              <div style={{alignSelf:'flex-start'}}>
                <div style={{background:'#0c1812',border:'0.5px solid rgba(0,212,160,0.1)',borderRadius:'6px 6px 6px 0',padding:'10px 14px',display:'flex',gap:4}}>
                  {[0,1,2].map(i => (
                    <div key={i} className="dot-pulse" style={{width:5,height:5,borderRadius:'50%',background:'#00d4a0'}}/>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{padding:'12px 16px', borderTop:'0.5px solid #1a1a1a', display:'flex', gap:8}}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask your coach..."
              style={{
                flex:1, background:'#111',
                border:'0.5px solid #1e1e1e',
                borderRadius:6, padding:'10px 12px',
                fontSize:12, color:'#aaa',
                fontFamily:'DM Mono, monospace',
                outline:'none'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background:'rgba(0,212,160,0.1)',
                border:'0.5px solid rgba(0,212,160,0.3)',
                borderRadius:6, padding:'10px 14px',
                color:'#00d4a0', fontSize:12,
                fontFamily:'DM Mono, monospace',
                cursor:'pointer'
              }}
            >Send</button>
          </div>

        </div>
      )}
    </>
  )
}
