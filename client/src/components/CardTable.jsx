export default function CardTable({ tableCards }) {
  const lastCards = tableCards.slice(-5)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 relative overflow-hidden">
      {/* 배경 링 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-48 h-48 rounded-full border border-gold-600 opacity-5" />
        <div className="absolute w-32 h-32 rounded-full border border-gold-500 opacity-5" />
      </div>

      {tableCards.length === 0 ? (
        <div className="text-center">
          <div className="mx-auto mb-3 flex items-center justify-center"
            style={{
              width: 100, height: 140,
              background: 'linear-gradient(145deg, #111, #1a1a1a)',
              border: '1.5px dashed #444',
              borderRadius: 16,
            }}>
            <span className="text-gray-600 text-4xl">?</span>
          </div>
          <div className="text-gray-400 text-sm">카드를 내려놓으세요</div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 w-full">

          {/* 마지막 카드 — 크게 + 누가 냈는지 표시 */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="card-premium flex items-center justify-center relative slide-up"
              style={{ width: 110, height: 155, background: 'linear-gradient(145deg, #0f0f0f, #1c1c1c)' }}>
              <div className="text-gold-300 font-bold"
                style={{ fontSize: 52, lineHeight: 1, textShadow: '0 0 20px rgba(212,175,55,0.7)' }}>
                {tableCards[tableCards.length - 1].value}
              </div>
              <div className="absolute top-2 left-2.5 text-gold-600 text-sm opacity-60">
                {tableCards[tableCards.length - 1].value}
              </div>
              <div className="absolute bottom-2 right-2.5 text-gold-600 text-sm opacity-60 rotate-180">
                {tableCards[tableCards.length - 1].value}
              </div>
              <div className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-gold-600 opacity-40" />
              <div className="absolute bottom-2 left-2.5 w-1.5 h-1.5 rounded-full bg-gold-600 opacity-40" />
            </div>

            {/* 낸 사람 닉네임 */}
            <div className="flex items-center gap-1.5 bg-dark-800 rounded-full px-2.5 py-1 border border-dark-600">
              <div className="w-3.5 h-3.5 rounded-full bg-gold-600 flex items-center justify-center text-dark-900 font-bold shrink-0"
                style={{ fontSize: 8 }}>
                {tableCards[tableCards.length - 1].nickname?.[0]}
              </div>
              <span className="text-gold-400 text-xs font-medium leading-none">
                {tableCards[tableCards.length - 1].nickname}
              </span>
            </div>
          </div>

          {/* 이전 카드들 — 작게 + 닉네임 */}
          {lastCards.length > 1 && (
            <div className="flex gap-2 items-end">
              {lastCards.slice(0, -1).map((c, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="card-premium flex items-center justify-center relative"
                    style={{ width: 44, height: 62 }}>
                    <span className="text-gold-500 font-bold text-base">{c.value}</span>
                    <span className="absolute top-1 left-1 text-gold-700 text-xs opacity-50">{c.value}</span>
                  </div>
                  <span className="text-gray-500 text-xs text-center leading-none" style={{ maxWidth: 46, wordBreak: 'keep-all' }}>
                    {c.nickname}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="text-gray-500 text-xs mt-1">
            총 <span className="text-gold-500 font-medium">{tableCards.length}</span>장 제출됨
          </div>
        </div>
      )}
    </div>
  )
}
