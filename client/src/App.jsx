import { useState } from 'react'
import LobbyPage from './pages/LobbyPage'
import WaitingPage from './pages/WaitingPage'
import GamePage from './pages/GamePage'
import socket from './socket'

export default function App() {
  const [page, setPage] = useState('lobby') // lobby | waiting | game
  const [roomData, setRoomData] = useState(null)
  const [nickname, setNickname] = useState('')

  return (
    <div className="h-full flex flex-col bg-dark-900">
      {page === 'lobby' && (
        <LobbyPage
          onEnterRoom={(room, nick) => {
            setRoomData(room)
            setNickname(nick)
            setPage('waiting')
          }}
        />
      )}
      {page === 'waiting' && roomData && (
        <WaitingPage
          room={roomData}
          nickname={nickname}
          onGameStart={(room) => {
            setRoomData(room)
            setPage('game')
          }}
          onRoomUpdate={(room) => setRoomData(room)}
          onLeave={() => setPage('lobby')}
        />
      )}
      {page === 'game' && roomData && (
        <GamePage
          initialRoom={roomData}
          nickname={nickname}
          onGameEnd={() => setPage('lobby')}
        />
      )}
    </div>
  )
}
