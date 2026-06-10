import { useState, useRef, useEffect } from 'react'

const EMOJIS = [
  { emoji: '😤', text: '나 곧 낼 거야' },
  { emoji: '😰', text: '잠깐만요' },
  { emoji: '👀', text: '눈치 보는 중' },
  { emoji: '🙏', text: '기다려줘' },
  { emoji: '😂', text: '웃음' },
  { emoji: '👏', text: '잘했어요' },
]

export default function ChatBox({ messages, onSend }) {
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  function sendEmoji({ emoji, text }) {
    onSend(`${emoji} ${text}`)
    setShowEmoji(false)
  }

  return (
    <div className="flex flex-col bg-dark-800 border-t border-b border-dark-700" style={{ height: '150px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <div className="text-gray-500 text-xs text-center pt-4">채팅을 시작하세요</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="text-sm leading-snug">
            <span className="text-gold-500 font-medium text-xs">{msg.nickname}</span>
            <span className="text-gray-500 mx-1">·</span>
            <span className="text-gray-100">{msg.message}</span>
            {msg.hasMasked && (
              <span className="ml-1 text-gray-500 text-xs">🤐</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji panel */}
      {showEmoji && (
        <div className="grid grid-cols-2 gap-1 px-3 py-1.5 bg-dark-700 border-t border-dark-600">
          {EMOJIS.map(e => (
            <button key={e.emoji} onClick={() => sendEmoji(e)}
              className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-left active:bg-dark-600 transition-colors">
              <span className="text-sm">{e.emoji}</span>
              <span className="text-gray-300 text-xs">{e.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 px-3 py-2 border-t border-dark-700">
        <button
          onClick={() => setShowEmoji(v => !v)}
          className="text-xl active:scale-90 transition-transform"
        >😊</button>
        <input
          className="flex-1 bg-dark-900 rounded-lg px-3 py-1.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold-600 border border-dark-600"
          placeholder="숫자는 말하면 안돼요 🤫"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-3 py-1.5 rounded-lg text-dark-900 text-sm font-bold active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)' }}
        >전송</button>
      </div>
    </div>
  )
}
