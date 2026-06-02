export default function PlayerStatus({ players, myId }) {
  const others = players.filter(p => p.id !== myId)
  if (others.length === 0) return null

  return (
    <div className="flex gap-2 px-4 py-2 bg-dark-900 border-b border-dark-800">
      {others.map(p => (
        <div key={p.id} className={`flex items-center gap-1.5 bg-dark-800 rounded-lg px-2 py-1.5 border transition-all ${
          p.highlight >= 3 ? 'border-gold-400' :
          p.highlight >= 2 ? 'border-gold-600' :
          'border-dark-600'
        }`}>
          <div className="w-5 h-5 rounded-full bg-dark-600 flex items-center justify-center text-gold-400 text-xs font-bold">
            {p.nickname[0]}
          </div>
          <span className="text-gray-200 text-xs font-medium">{p.nickname}</span>
          <div className="flex gap-0.5">
            {Array.from({ length: p.cardCount || 0 }).map((_, i) => (
              <div key={i} className="w-2 h-3 rounded-sm bg-dark-500 border border-gold-700" />
            ))}
          </div>
          {p.highlight >= 1 && (
            <span className={`text-xs font-bold ${
              p.highlight >= 3 ? 'text-gold-300 animate-pulse' : 'text-gold-500'
            }`}>
              {p.highlight >= 3 ? '!!!' : p.highlight >= 2 ? '!!' : '!'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
