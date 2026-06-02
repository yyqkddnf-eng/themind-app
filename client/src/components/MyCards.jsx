import { useState, useRef } from 'react'

export default function MyCards({ cards, onPlay, onHighlight }) {
  const [highlightLevel, setHighlightLevel] = useState(0)
  const holdTimers = useRef({})
  const currentLevel = useRef(0)

  function handleHoldStart(card, e) {
    e.preventDefault()
    currentLevel.current = 0
    holdTimers.current[card] = setTimeout(() => {
      currentLevel.current = 1; setHighlightLevel(1); onHighlight(1)
      holdTimers.current[card + '_2'] = setTimeout(() => {
        currentLevel.current = 2; setHighlightLevel(2); onHighlight(2)
        holdTimers.current[card + '_3'] = setTimeout(() => {
          currentLevel.current = 3; setHighlightLevel(3); onHighlight(3)
        }, 1000)
      }, 1000)
    }, 1000)
  }

  // 카드 제출 (mouseup / touchend 전용)
  function handleHoldEnd(card) {
    clearTimeout(holdTimers.current[card])
    clearTimeout(holdTimers.current[card + '_2'])
    clearTimeout(holdTimers.current[card + '_3'])
    if (currentLevel.current === 0) onPlay(card)
    setHighlightLevel(0)
    onHighlight(0)
    currentLevel.current = 0
  }

  // 마우스가 카드 밖으로 나갈 때 — 제출하지 않고 타이머만 취소
  function handleMouseLeave(card) {
    clearTimeout(holdTimers.current[card])
    clearTimeout(holdTimers.current[card + '_2'])
    clearTimeout(holdTimers.current[card + '_3'])
    setHighlightLevel(0)
    onHighlight(0)
    currentLevel.current = 0
  }

  const glowClass =
    highlightLevel === 3 ? 'card-premium-glow-3' :
    highlightLevel === 2 ? 'card-premium-glow-2' :
    highlightLevel === 1 ? 'card-premium-glow' : ''

  return (
    <div className="bg-dark-900 border-t border-dark-700 px-4 py-3">
      <div className="text-gray-400 text-xs mb-2 tracking-wide">
        내 카드 — 꾹 누르면 강조, 탭하면 제출
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cards.length === 0 && (
          <div className="text-gray-500 text-sm py-2">카드가 없습니다</div>
        )}
        {cards.map(card => (
          <button
            key={card}
            onTouchStart={e => handleHoldStart(card, e)}
            onTouchEnd={() => handleHoldEnd(card)}
            onMouseDown={e => handleHoldStart(card, e)}
            onMouseUp={() => handleHoldEnd(card)}
            onMouseLeave={() => handleMouseLeave(card)}
            className={`card-premium flex-shrink-0 flex items-center justify-center relative select-none transition-all active:scale-95 ${glowClass}`}
            style={{ width: 56, height: 80 }}
          >
            <span className="text-gold-400 font-bold text-2xl"
              style={{ textShadow: '0 0 15px rgba(212,175,55,0.6)' }}>
              {card}
            </span>
            <span className="absolute top-1 left-1.5 text-gold-600 text-xs opacity-60">{card}</span>
            <span className="absolute bottom-1 right-1.5 text-gold-600 text-xs opacity-60 rotate-180">{card}</span>
            <div className="absolute inset-0 rounded-xl opacity-5" style={{
              backgroundImage: 'repeating-linear-gradient(45deg,#d4af37 0,#d4af37 1px,transparent 0,transparent 50%)',
              backgroundSize: '8px 8px'
            }} />
          </button>
        ))}
      </div>
    </div>
  )
}
