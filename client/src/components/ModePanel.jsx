import { useState, useEffect, useRef } from 'react'
import socket from '../socket'

const TABS = [
  { key: 'silent',     label: '침묵속의 외침', icon: '🤫' },
  { key: 'timeattack', label: '타임어택',      icon: '⏱️' },
  { key: 'body',       label: '몸으로 말해요', icon: '🙆' },
]

function posLabel(pos) {
  if (pos === null) return ''
  if (pos <= 8)  return '머리'
  if (pos <= 18) return '목'
  if (pos <= 28) return '어깨'
  if (pos <= 40) return '가슴'
  if (pos <= 52) return '배'
  if (pos <= 63) return '허리'
  if (pos <= 74) return '허벅지'
  if (pos <= 84) return '무릎'
  if (pos <= 93) return '정강이'
  return '발끝'
}

const PEER_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#a78bfa']

// ── 침묵 모드 ──────────────────────────────────────────────────
function SilentMode({ active, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center py-5 gap-3">
      {active ? (
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">🤫</div>
          <div className="text-gold-400 text-sm font-medium">침묵 모드 진행 중</div>
          <div className="text-gray-400 text-xs mt-1">직감으로 카드를 내려놓으세요</div>
        </div>
      ) : (
        <>
          <div className="text-gray-300 text-xs text-center px-6 leading-relaxed">
            말없이 직감으로만 카드를 냅니다.<br />눈빛으로 소통하세요.
          </div>
          <button onClick={onStart}
            className="px-8 py-2.5 rounded-xl font-bold text-dark-900 text-sm active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', boxShadow: '0 4px 16px rgba(212,175,55,0.3)' }}>
            시작!
          </button>
        </>
      )}
    </div>
  )
}

// ── 타임어택 모드 ──────────────────────────────────────────────
function TimeAttackMode({ active, onStart, duration = 150 }) {
  const [progress, setProgress] = useState(100)
  const [urgent, setUrgent] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!active) { setProgress(100); setUrgent(false); return }
    const end = Date.now() + duration * 1000
    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, end - Date.now())
      const pct = (remaining / (duration * 1000)) * 100
      setProgress(pct)
      setUrgent(pct < 30)
      if (remaining <= 0) clearInterval(intervalRef.current)
    }, 100)
    return () => clearInterval(intervalRef.current)
  }, [active, duration])

  const barColor = urgent
    ? 'linear-gradient(90deg, #dc2626, #ef4444)'
    : progress < 60
    ? 'linear-gradient(90deg, #d97706, #f59e0b)'
    : 'linear-gradient(90deg, #d4af37, #f0c040)'

  return (
    <div className="flex flex-col items-center justify-center py-4 gap-3 px-4">
      {active ? (
        <div className="w-full">
          <div className="text-center mb-2">
            <span className={`text-xs font-medium ${urgent ? 'text-red-400 animate-pulse' : 'text-gold-400'}`}>
              {urgent ? '⚠️ 시간이 얼마 없어요!' : '타임어택 진행 중'}
            </span>
          </div>
          <div className="w-full h-4 bg-dark-700 rounded-full overflow-hidden border border-dark-600">
            <div className="h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%`, background: barColor }} />
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            {['🟢','🟡','🟠','🔴'].map((e, i) => (
              <span key={i} className={`text-xs transition-opacity ${progress < (i + 1) * 25 ? 'opacity-20' : 'opacity-80'}`}>{e}</span>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="text-gray-300 text-xs text-center leading-relaxed">
            제한 시간이 흐릅니다.<br />게이지가 줄기 전에 카드를 내세요.
          </div>
          <button onClick={onStart}
            className="px-8 py-2.5 rounded-xl font-bold text-dark-900 text-sm active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', boxShadow: '0 4px 16px rgba(212,175,55,0.3)' }}>
            시작!
          </button>
        </>
      )}
    </div>
  )
}

// ── 몸으로 말해요 모드 ─────────────────────────────────────────
// 실루엣 높이 고정값 (px) — 슬라이더와 동일하게 맞춤
const BODY_H = 220

function BodyMode({ active, onStart, code, otherPositions }) {
  const [myPos, setMyPos] = useState(null)
  const touchRef = useRef(null)

  function calcPos(clientY) {
    const el = touchRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return Math.max(0, Math.min(100, Math.round(((clientY - rect.top) / rect.height) * 100)))
  }

  function handleTouch(e) {
    e.preventDefault()
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const pos = calcPos(clientY)
    if (pos === null) return
    setMyPos(pos)
    socket.emit('bodyPart', { code, position: pos })
  }

  return (
    <div className="flex flex-col items-center py-2 px-2">
      {!active ? (
        <div className="flex flex-col items-center gap-3 py-3">
          <div className="text-gray-300 text-xs text-center leading-relaxed px-4">
            머리(0)부터 발끝(100)까지<br />내 카드 범위를 몸으로 표시하세요.
          </div>
          <button onClick={onStart}
            className="px-8 py-2.5 rounded-xl font-bold text-dark-900 text-sm active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', boxShadow: '0 4px 16px rgba(212,175,55,0.3)' }}>
            시작!
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2 w-full">

          {/* 왼쪽: 머리/발끝 레이블만 */}
          <div className="flex flex-col justify-between text-right shrink-0 py-0" style={{ height: BODY_H, width: 28 }}>
            <span className="text-gold-400 text-xs font-bold leading-none">머리</span>
            <span className="text-gold-400 text-xs font-bold leading-none">발끝</span>
          </div>

          {/* 중앙: 실루엣 + 터치 영역 — 같은 높이 */}
          <div className="relative flex-1 shrink-0" style={{ height: BODY_H }}>

            {/* 실루엣 SVG — viewBox를 발끝(y=164)까지 딱 맞춤 */}
            <svg
              viewBox="0 2 60 162"
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 w-full h-full pointer-events-none"
              fill="#d4af37"
              style={{ opacity: 0.28 }}
            >
              {/* 머리 */}
              <ellipse cx="30" cy="13" rx="10" ry="11" />
              {/* 목 */}
              <rect x="26" y="23" width="8" height="7" rx="2" />
              {/* 몸통 */}
              <path d="M14,31 Q9,38 11,72 L20,72 L20,95 L40,95 L40,72 L49,72 Q51,38 46,31 Z" />
              {/* 왼팔 */}
              <path d="M14,33 Q5,42 4,75 L10,76 Q13,50 19,40 Z" />
              {/* 오른팔 */}
              <path d="M46,33 Q55,42 56,75 L50,76 Q47,50 41,40 Z" />
              {/* 왼손 */}
              <ellipse cx="7" cy="79" rx="4.5" ry="6" />
              {/* 오른손 */}
              <ellipse cx="53" cy="79" rx="4.5" ry="6" />
              {/* 왼다리 */}
              <path d="M20,95 L17,155 L24,155 L26,95 Z" />
              {/* 오른다리 */}
              <path d="M40,95 L43,155 L36,155 L34,95 Z" />
              {/* 왼발 — 바닥 y=164에 딱 붙음 */}
              <ellipse cx="20" cy="159" rx="7.5" ry="5" />
              {/* 오른발 */}
              <ellipse cx="40" cy="159" rx="7.5" ry="5" />
            </svg>

            {/* 중앙 수직선 */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gold-600 opacity-25 pointer-events-none"
              style={{ transform: 'translateX(-50%)' }} />

            {/* 눈금선 */}
            {[0, 25, 50, 75, 100].map(v => (
              <div key={v}
                className="absolute left-0 right-0 border-t border-gray-700 pointer-events-none"
                style={{ top: `${v}%`, opacity: 0.4 }} />
            ))}

            {/* 터치 영역 */}
            <div
              ref={touchRef}
              className="absolute inset-0 cursor-pointer"
              onClick={handleTouch}
              onTouchStart={handleTouch}
              onTouchMove={handleTouch}
            />

            {/* 다른 플레이어 마커 */}
            {Object.entries(otherPositions || {}).map(([pid, info], i) =>
              info?.position != null ? (
                <div key={pid}
                  className="absolute left-1/2 pointer-events-none flex items-center gap-1"
                  style={{ top: `${info.position}%`, transform: 'translate(4px, -50%)' }}>
                  <div className="w-3 h-3 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: PEER_COLORS[i % PEER_COLORS.length] }} />
                  <span className="text-xs font-bold whitespace-nowrap"
                    style={{ color: PEER_COLORS[i % PEER_COLORS.length], fontSize: 10 }}>
                    {info.nickname}
                  </span>
                </div>
              ) : null
            )}

            {/* 내 마커 */}
            {myPos !== null && (
              <div className="absolute left-1/2 pointer-events-none"
                style={{ top: `${myPos}%`, transform: 'translate(-50%, -50%)' }}>
                <div className="w-4 h-4 rounded-full bg-gold-400 border-2 border-white"
                  style={{ boxShadow: '0 0 10px rgba(212,175,55,0.9)' }} />
              </div>
            )}
          </div>

          {/* 오른쪽 상태 */}
          <div className="flex flex-col justify-between shrink-0 py-0" style={{ height: BODY_H, width: 44 }}>
            {myPos !== null ? (
              <div className="text-left mt-auto mb-auto">
                <div className="text-gold-400 text-xs font-bold leading-tight">{posLabel(myPos)}</div>
                <div className="text-gray-400 text-xs mt-0.5">나</div>
              </div>
            ) : (
              <div className="text-gray-400 text-xs mt-auto mb-auto leading-relaxed">
                터치<br />하세요
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 메인 ModePanel ─────────────────────────────────────────────
export default function ModePanel({ code, otherPositions, onModeActivate }) {
  const [activeTab, setActiveTab] = useState('silent')
  const [activeModes, setActiveModes] = useState({ silent: false, timeattack: false, body: false })

  function handleStart(mode) {
    setActiveModes({ silent: false, timeattack: false, body: false, [mode]: true })
    onModeActivate?.(mode)
    socket.emit('modeActivated', { code, mode })
  }

  useEffect(() => {
    socket.on('modeActivatedByPeer', ({ mode }) => {
      setActiveModes({ silent: false, timeattack: false, body: false, [mode]: true })
      setActiveTab(mode)
    })
    return () => socket.off('modeActivatedByPeer')
  }, [])

  return (
    <div className="bg-dark-800 border-t border-dark-700">
      {/* 탭 바 */}
      <div className="flex border-b border-dark-700">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-all ${
              activeTab === t.key
                ? 'text-gold-400 border-b-2 border-gold-400 bg-dark-700'
                : 'text-gray-400 hover:text-gray-200'
            }`}>
            <span>{t.icon}</span>
            <span className="truncate">{t.label}</span>
            {activeModes[t.key] && (
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 ml-0.5 animate-pulse shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'silent'     && <SilentMode     active={activeModes.silent}     onStart={() => handleStart('silent')} />}
        {activeTab === 'timeattack' && <TimeAttackMode active={activeModes.timeattack} onStart={() => handleStart('timeattack')} />}
        {activeTab === 'body'       && <BodyMode       active={activeModes.body}       onStart={() => handleStart('body')} code={code} otherPositions={otherPositions} />}
      </div>
    </div>
  )
}
