'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';
import { generateId } from '@/lib/store';

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.message || 'I had trouble processing that. Try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: 'Connection issue. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#6366f1] hover:bg-[#5558e6] flex items-center justify-center transition-all glow-accent z-40 shadow-lg"
      >
        <span className="text-white text-lg">{open ? '\u2715' : '\u2726'}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-[380px] h-[500px] glass rounded-2xl flex flex-col z-40 shadow-2xl animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
              <span className="text-[#6366f1] text-xs">{'\u2726'}</span>
            </div>
            <div>
              <div className="text-sm font-semibold">Journal X AI</div>
              <div className="text-[10px] text-[#55556a]">Knows your trades, goals, and rules</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-[#55556a] text-sm py-8">
                <p className="mb-2">Ask me anything about your trading.</p>
                <p className="text-xs">I have access to your trade history, goals, and rules.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#6366f1] text-white rounded-br-md'
                    : 'bg-[rgba(255,255,255,0.04)] text-[#f0f0f5] rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[rgba(255,255,255,0.04)] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6366f1]/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about your trading..."
                className="flex-1 text-sm py-2.5 rounded-xl"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 bg-[#6366f1] hover:bg-[#5558e6] disabled:opacity-30 rounded-xl text-sm text-white transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
