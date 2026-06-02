import { useState, useEffect } from 'react'

function ShurikenIcon({ size = 32, color = '#d4af37' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
      <circle cx="12" cy="12" r="2.5" fill="#111" />
    </svg>
  )
}

export default function ShurikenVote({ initiator, totalPlayers, voteStatus, onVote, myVote }) {
  const [timeLeft, setTimeLeft] = useState(15)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); if (myVote === null) onVote(false); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const needed = Math.ceil((totalPlayers || 2) / 2)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-dark-900/90 px-6">
      <div className="bg-dark-800 rounded-2xl p-6 w-full border border-gold-600 text-center">
        <div className="flex justify-center mb-3">
          <div style={{ animation: 'spin 3s linear infinite' }}>
            <ShurikenIcon size={48} />
          </div>
        </div>

        <div className="text-gold-400 font-bold text-lg mb-1">수리검 투표</div>
        <div className="text-gray-200 text-sm mb-1">
          <span className="text-gold-300 font-medium">{initiator}</span>이(가) 수리검 사용을 제안했습니다
        </div>
        <div className="text-gray-400 text-xs mb-1">각자 가장 낮은 카드가 버려집니다</div>
        <div className="text-gold-500 text-xs font-medium mb-4">
          과반수 동의 필요 ({needed}명 이상 / {totalPlayers}명)
        </div>

        {/* 투표 현황 */}
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: totalPlayers || 2 }).map((_, i) => {
            const votes = voteStatus ? Object.values(voteStatus) : []
            const v = votes[i]
            return (
              <div key={i} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all ${
                v === true  ? 'border-gold-400 bg-gold-400/20 text-gold-300' :
                v === false ? 'border-red-600 bg-red-900/20 text-red-400' :
                'border-gray-600 text-gray-500'
              }`}>
                {v === true ? '✓' : v === false ? '✗' : '?'}
              </div>
            )
          })}
        </div>

        {/* 타이머 바 */}
        <div className="h-1 bg-dark-700 rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-gold-400 rounded-full transition-all"
            style={{ width: `${(timeLeft / 15) * 100}%` }} />
        </div>

        {myVote === null ? (
          <div className="flex gap-3">
            <button onClick={() => onVote(false)}
              className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-200 font-medium active:scale-95 transition-all">
              거절
            </button>
            <button onClick={() => onVote(true)}
              className="flex-1 py-3 rounded-xl font-bold text-dark-900 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)' }}>
              동의
            </button>
          </div>
        ) : (
          <div className={`py-3 rounded-xl text-sm font-medium border ${
            myVote
              ? 'text-gold-400 bg-gold-400/10 border-gold-700'
              : 'text-gray-300 bg-dark-700 border-dark-600'
          }`}>
            {myVote ? '동의했습니다 — 결과 대기 중...' : '거절했습니다'}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
