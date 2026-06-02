function ShurikenIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
      <circle cx="12" cy="12" r="2.5" fill="#0a0a0a" />
    </svg>
  )
}

export default function TokenBar({ life, maxLife, shuriken, round, maxRound, onShuriken, canShuriken, onLeave }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 bg-dark-800 border-b border-dark-700">
      {/* 왼쪽: 하트 + 수리검 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxLife || 4 }).map((_, i) => (
            <span
              key={i}
              className={`text-lg transition-all duration-300 ${i < (life || 0) ? 'text-red-400' : 'text-dark-700'}`}
              style={i < (life || 0) ? { filter: 'drop-shadow(0 0 4px rgba(248,113,113,0.5))' } : {}}
            >
              ♥
            </span>
          ))}
        </div>
        <button
          onClick={onShuriken}
          disabled={!canShuriken}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all active:scale-95 ${
            canShuriken ? 'border-gold-600 text-gold-400' : 'border-dark-700 text-dark-700 cursor-not-allowed'
          }`}
          title="수리검 투표"
        >
          <ShurikenIcon size={14} color={canShuriken ? '#d4af37' : '#333'} />
          <span className="text-xs font-bold">{shuriken ?? 0}</span>
        </button>
      </div>

      {/* 가운데: 라운드 */}
      <div className="text-center">
        <div className="text-gold-400 font-bold text-sm tracking-widest">ROUND</div>
        <div className="text-white text-xs">{round} / {maxRound}</div>
      </div>

      {/* 오른쪽: 나가기 */}
      <button
        onClick={onLeave}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 border border-dark-600 hover:border-dark-500 transition-all active:scale-95"
      >
        <span className="text-xs font-medium">나가기</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </div>
  )
}
