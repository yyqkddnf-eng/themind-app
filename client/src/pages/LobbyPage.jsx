import { useState } from 'react'
import socket from '../socket'

export default function LobbyPage({ onEnterRoom }) {
  const [nickname, setNickname] = useState('')
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [tab, setTab] = useState('create')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleCreate() {
    if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return }
    setLoading(true)
    socket.emit('createRoom', { nickname: nickname.trim(), mode: 'silent', roomName: roomName.trim() || '더 마인드' })
    socket.once('roomCreated', ({ room }) => {
      setLoading(false)
      onEnterRoom(room, nickname.trim())
    })
  }

  function handleJoin() {
    if (!nickname.trim()) { setError('닉네임을 입력해주세요'); return }
    if (!joinCode.trim()) { setError('방 코드를 입력해주세요'); return }
    setLoading(true)
    socket.emit('joinRoom', { code: joinCode.trim(), nickname: nickname.trim() })
    socket.once('roomJoined', ({ room }) => {
      setLoading(false)
      onEnterRoom(room, nickname.trim())
    })
    socket.once('joinError', ({ message }) => {
      setLoading(false)
      setError(message)
    })
  }

  return (
    <div className="flex flex-col h-full px-6 py-8 overflow-y-auto">
      {/* Logo */}
      <div className="text-center mb-10 mt-6">
        <div className="text-5xl font-bold text-gold-400 tracking-widest mb-2"
          style={{ textShadow: '0 0 30px rgba(212,175,55,0.5)' }}>
          THE MIND
        </div>
        <div className="text-gray-400 text-sm tracking-wider">더 마인드</div>
      </div>

      {/* Nickname */}
      <div className="mb-5">
        <label className="text-gold-500 text-xs tracking-wider mb-2 block">닉네임</label>
        <input
          className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
          placeholder="이름을 입력하세요"
          value={nickname}
          onChange={e => { setNickname(e.target.value); setError('') }}
          maxLength={10}
        />
      </div>

      {/* Tabs */}
      <div className="flex mb-5 bg-dark-800 rounded-lg p-1">
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'create' ? 'bg-gold-500 text-dark-900' : 'text-gray-300'}`}
          onClick={() => setTab('create')}
        >방 만들기</button>
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${tab === 'join' ? 'bg-gold-500 text-dark-900' : 'text-gray-300'}`}
          onClick={() => setTab('join')}
        >방 참가</button>
      </div>

      {tab === 'join' && (
        <div className="mb-5">
          <label className="text-gold-500 text-xs tracking-wider mb-2 block">방 코드</label>
          <input
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors text-center text-xl tracking-widest font-bold"
            placeholder="XXXXXX"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
            maxLength={6}
          />
        </div>
      )}

      {tab === 'create' && (
        <div className="mb-5">
          <label className="text-gold-500 text-xs tracking-wider mb-2 block">방 이름 (선택)</label>
          <input
            className="w-full bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="예) 혜민이네 더마인드"
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            maxLength={20}
          />
        </div>
      )}

      {error && <div className="text-red-400 text-sm text-center mb-4">{error}</div>}

      <button
        onClick={tab === 'create' ? handleCreate : handleJoin}
        disabled={loading}
        className="w-full py-4 rounded-xl font-bold text-dark-900 text-lg transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}
      >
        {loading ? '연결 중...' : (tab === 'create' ? '방 만들기' : '입장하기')}
      </button>

      <div className="mt-8 text-center text-gray-500 text-xs">
        숫자를 말하지 마세요 🤫
      </div>
    </div>
  )
}
