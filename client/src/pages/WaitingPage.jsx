import { useEffect, useState } from 'react'
import socket from '../socket'

const MODES = [
  { key: 'silent',     label: '침묵속의 외침', desc: '직감으로만 카드를 냅니다', icon: '🤫' },
  { key: 'timeattack', label: '타임어택',      desc: '시간 압박 속에서 결정',   icon: '⏱️' },
  { key: 'body',       label: '몸으로 말해요', desc: '신체 부위로 힌트를 줘요', icon: '🙆' },
]

export default function WaitingPage({ room: initialRoom, nickname, onGameStart, onRoomUpdate, onLeave }) {
  const [room, setRoom] = useState(initialRoom)
  const [showModeSelect, setShowModeSelect] = useState(false)

  const isHost = room.hostId === socket.id || room.players[0]?.id === socket.id

  useEffect(() => {
    socket.on('playerJoined', ({ room: r }) => { setRoom(r); onRoomUpdate(r) })
    socket.on('playerLeft',   ({ room: r }) => { setRoom(r); onRoomUpdate(r) })
    socket.on('modeChanged',  ({ room: r }) => { setRoom(r); onRoomUpdate(r) })
    socket.on('gameStarted',  ({ room: r }) => onGameStart(r))
    return () => {
      socket.off('playerJoined')
      socket.off('playerLeft')
      socket.off('modeChanged')
      socket.off('gameStarted')
    }
  }, [])

  function handleModeChange(mode) {
    socket.emit('changeMode', { code: room.code, mode })
    setShowModeSelect(false)
  }

  function handleStart() {
    socket.emit('startGame', { code: room.code })
  }

  function handleLeave() {
    socket.emit('leaveRoom', { code: room.code })
    onLeave()
  }

  const lifeMap = { 1: 3, 2: 2, 3: 3, 4: 4 }
  const startLife = lifeMap[room.players?.length] || 3
  const currentMode = MODES.find(m => m.key === room.mode) || MODES[0]

  return (
    <div className="flex flex-col h-full px-6 py-8 overflow-y-auto">
      <div className="text-center mb-6">
        <div className="text-gold-400 text-2xl font-bold tracking-widest mb-1">THE MIND</div>
        <div className="text-gray-400 text-xs">대기실</div>
      </div>

      {/* 방 코드 */}
      <div className="bg-dark-800 rounded-2xl p-5 mb-4 text-center border border-dark-600">
        {room.roomName && room.roomName !== '더 마인드' && (
          <div className="text-white text-base font-bold mb-2">{room.roomName}</div>
        )}
        <div className="text-gray-400 text-xs mb-1 tracking-wider">방 코드</div>
        <div className="text-gold-400 text-4xl font-bold tracking-widest">{room.code}</div>
        <div className="text-gray-500 text-xs mt-2">친구에게 코드를 알려주세요</div>
      </div>


      {/* 플레이어 목록 */}
      <div className="mb-4">
        <div className="text-gold-500 text-xs tracking-wider mb-3">
          플레이어 ({room.players?.length}/4)
        </div>
        <div className="flex flex-col gap-2">
          {room.players?.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-dark-800 rounded-xl p-3 border border-dark-700">
              <div className="w-8 h-8 rounded-full bg-dark-600 flex items-center justify-center text-gold-400 font-bold text-sm">
                {p.nickname[0]}
              </div>
              <span className="text-white text-sm">{p.nickname}</span>
              {i === 0 && <span className="ml-auto text-gold-400 text-xs font-medium">방장</span>}
            </div>
          ))}
          {Array.from({ length: 4 - (room.players?.length || 0) }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-dark-900 rounded-xl p-3 border border-dark-800 opacity-40">
              <div className="w-8 h-8 rounded-full border border-dashed border-gray-600" />
              <span className="text-gray-500 text-sm">대기 중...</span>
            </div>
          ))}
        </div>
      </div>

      {/* 시작 라이프 */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-gray-400 text-xs">시작 라이프:</span>
        {Array.from({ length: startLife }).map((_, i) => (
          <span key={i} className="text-red-400 text-lg">♥</span>
        ))}
        <span className="text-gray-400 text-xs ml-2">수리검: ×1</span>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        {isHost ? (
          <button onClick={handleStart}
            className="w-full py-4 rounded-xl font-bold text-dark-900 text-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
            게임 시작
          </button>
        ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            방장이 게임을 시작하길 기다리는 중...
          </div>
        )}
        <button onClick={handleLeave}
          className="w-full py-3 rounded-xl text-gray-400 text-sm border border-dark-600 active:scale-95 transition-all">
          나가기
        </button>
      </div>
    </div>
  )
}
