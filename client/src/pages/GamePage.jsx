import { useState, useEffect } from 'react'
import socket from '../socket'
import CardTable from '../components/CardTable'
import MyCards from '../components/MyCards'
import ChatBox from '../components/ChatBox'
import TokenBar from '../components/TokenBar'
import PlayerStatus from '../components/PlayerStatus'
import ShurikenVote from '../components/ShurikenVote'
import ModePanel from '../components/ModePanel'

export default function GamePage({ initialRoom, nickname, onGameEnd }) {
  const [room, setRoom] = useState(initialRoom)
  const [messages, setMessages] = useState([])
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState(false)
  const [shurikenVoting, setShurikenVoting] = useState(false)
  const [shurikenInitiator, setShurikenInitiator] = useState('')
  const [shurikenVoteStatus, setShurikenVoteStatus] = useState({})
  const [myVote, setMyVote] = useState(null)
  const [notification, setNotification] = useState(null)
  const [gameOver, setGameOver] = useState(null)
  const [victory, setVictory] = useState(false)
  const [roundClearMsg, setRoundClearMsg] = useState(null)
  const [otherPositions, setOtherPositions] = useState({}) // playerId -> { position, nickname }

  const myPlayer = room.players.find(p => p.id === socket.id)
  const myCards = myPlayer?.cards || []
  const gs = room.gameState

  function showNotif(msg, color = 'gold') {
    setNotification({ msg, color })
    setTimeout(() => setNotification(null), 2500)
  }

  useEffect(() => {
    socket.on('cardPlayed', ({ room: r, mistake, roundResult }) => {
      setRoom(r)
      if (mistake) {
        setShake(true)
        setFlash(true)
        setTimeout(() => setShake(false), 600)
        setTimeout(() => setFlash(false), 600)
        showNotif(`💔 라이프 -1 (${r.gameState.life}개 남음)`, 'red')
      }
      // cardPlayed에서 즉시 처리 (roundClear 이벤트 누락 방지)
      if (roundResult === 'roundClear') {
        const round = r.gameState.round
        const nextRoundNum = round + 1
        const rewardNext =
          [3, 7, 11].includes(nextRoundNum) ? 'shuriken' :
          [5, 9].includes(nextRoundNum) ? 'life' : null
        setRoundClearMsg({ round, reward: rewardNext })
        setTimeout(() => {
          setRoundClearMsg(null)
          socket.emit('nextRound', { code: r.code })
        }, 2500)
      }
    })

    socket.on('roundClear', ({ round }) => {
      // cardPlayed에서 이미 처리됐으면 중복 실행 방지
      setRoundClearMsg(prev => {
        if (prev) return prev // 이미 오버레이가 뜬 경우 무시
        const nextRoundNum = round + 1
        const rewardNext =
          [3, 7, 11].includes(nextRoundNum) ? 'shuriken' :
          [5, 9].includes(nextRoundNum) ? 'life' : null
        setTimeout(() => {
          setRoundClearMsg(null)
          socket.emit('nextRound', { code: room.code })
        }, 2500)
        return { round, reward: rewardNext }
      })
    })

    socket.on('roundStarted', ({ room: r, reward }) => {
      setRoom(r)
      if (reward === 'shuriken') {
        showNotif(`🗡️ 수리검 +1 획득! 라운드 ${r.gameState.round} 시작`, 'gold')
      } else if (reward === 'life') {
        showNotif(`❤️ 라이프 +1 획득! 라운드 ${r.gameState.round} 시작`, 'red')
      } else {
        showNotif(`🃏 라운드 ${r.gameState.round} 시작!`, 'gold')
      }
    })

    socket.on('gameOver', () => setGameOver(true))
    socket.on('victory', () => setVictory(true))

    socket.on('shurikenVoteStarted', ({ initiatorNickname }) => {
      setShurikenVoting(true)
      setShurikenInitiator(initiatorNickname)
      setShurikenVoteStatus({})
      setMyVote(null)
    })

    socket.on('shurikenVoteUpdate', ({ votes }) => {
      if (votes) setShurikenVoteStatus(votes)
    })

    socket.on('shurikenUsed', ({ room: r }) => {
      setRoom(r)
      setShurikenVoting(false)
      setMyVote(null)
      showNotif('🗡️ 수리검! 각자 최저 카드 제거', 'gold')
    })

    socket.on('shurikenRejected', () => {
      setShurikenVoting(false)
      setMyVote(null)
      showNotif('수리검 거절됨', 'gray')
    })

    socket.on('highlightUpdate', ({ playerId, nickname: nick, level }) => {
      if (playerId !== socket.id && level >= 3) {
        showNotif(`${nick}이(가) 카드를 확신하고 있어요!`, 'gold')
      }
    })

    socket.on('bodyPartUpdate', ({ playerId, position, nickname: peerNick }) => {
      setOtherPositions(prev => ({ ...prev, [playerId]: { position, nickname: peerNick } }))
    })

    socket.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, msg].slice(-100))
    })

    socket.on('playerLeft', ({ room: r }) => setRoom(r))

    return () => {
      socket.off('cardPlayed'); socket.off('roundClear'); socket.off('roundStarted')
      socket.off('gameOver'); socket.off('victory')
      socket.off('shurikenVoteStarted'); socket.off('shurikenVoteUpdate')
      socket.off('shurikenUsed'); socket.off('shurikenRejected')
      socket.off('highlightUpdate'); socket.off('bodyPartUpdate')
      socket.off('chatMessage'); socket.off('playerLeft')
    }
  }, [room.code])

  function handlePlayCard(card) { socket.emit('playCard', { code: room.code, card }) }
  function handleRequestShuriken() { socket.emit('requestShuriken', { code: room.code }) }
  function handleShurikenVote(agree) { socket.emit('shurikenVote', { code: room.code, agree }); setMyVote(agree) }
  function handleHighlight(level) { socket.emit('highlight', { code: room.code, level }) }
  function handleChat(msg) { socket.emit('chat', { code: room.code, message: msg }) }
  function handleLeave() { socket.emit('leaveRoom', { code: room.code }); onGameEnd() }

  function handleRestart() {
    socket.emit('startGame', { code: room.code })
    setGameOver(null)
    setVictory(false)
    setMessages([])
    setOtherPositions({})
  }

  // ── 결과 화면 ──────────────────────────────────────────────
  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <div className="text-6xl mb-2">💀</div>
        <div className="text-red-400 text-2xl font-bold">게임 오버</div>
        <div className="text-gray-400 text-sm">라이프가 모두 소진되었습니다</div>
        <div className="text-gold-400 font-medium mb-4">라운드 {gs?.round}까지 도달</div>
        <button onClick={handleRestart}
          className="w-full max-w-xs py-4 rounded-xl font-bold text-dark-900 text-lg active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#d4af37,#f0c040)', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
          다시하기 🔄
        </button>
        <button onClick={onGameEnd}
          className="w-full max-w-xs py-3 rounded-xl text-gray-400 text-sm border border-dark-600 active:scale-95 transition-all">
          로비로 돌아가기
        </button>
      </div>
    )
  }

  if (victory) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-3">
        <div className="text-6xl mb-2">🏆</div>
        <div className="text-gold-400 text-2xl font-bold">승리!</div>
        <div className="text-gray-300 text-sm mb-4">모든 라운드를 클리어했습니다!</div>
        <button onClick={handleRestart}
          className="w-full max-w-xs py-4 rounded-xl font-bold text-dark-900 text-lg active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#d4af37,#f0c040)', boxShadow: '0 4px 20px rgba(212,175,55,0.3)' }}>
          다시하기 🔄
        </button>
        <button onClick={onGameEnd}
          className="w-full max-w-xs py-3 rounded-xl text-gray-400 text-sm border border-dark-600 active:scale-95 transition-all">
          로비로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full relative ${flash ? 'flash-red' : ''} ${shake ? 'shake' : ''}`}>

      {/* 알림 토스트 */}
      {notification && (
        <div className={`absolute top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-sm font-medium slide-up whitespace-nowrap ${
          notification.color === 'red'  ? 'bg-red-900 text-red-300' :
          notification.color === 'gray' ? 'bg-dark-700 text-dark-300' :
          'bg-dark-700 text-gold-400 border border-gold-600'
        }`}>
          {notification.msg}
        </div>
      )}

      {/* 라운드 클리어 오버레이 */}
      {roundClearMsg && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-dark-900/85">
          <div className="text-center px-6">
            <div className="text-gold-400 text-4xl font-bold mb-3">
              라운드 {roundClearMsg.round} 클리어!
            </div>
            {roundClearMsg.reward === 'shuriken' && (
              <div className="flex items-center justify-center gap-2 mb-2 animate-bounce">
                <span className="text-2xl">🗡️</span>
                <span className="text-gold-300 font-bold text-lg">수리검 +1 획득!</span>
              </div>
            )}
            {roundClearMsg.reward === 'life' && (
              <div className="flex items-center justify-center gap-2 mb-2 animate-bounce">
                <span className="text-2xl">❤️</span>
                <span className="text-red-300 font-bold text-lg">라이프 +1 획득!</span>
              </div>
            )}
            <div className="text-dark-400 text-sm mt-2">다음 라운드 준비 중...</div>
          </div>
        </div>
      )}

      {/* 수리검 투표 팝업 */}
      {shurikenVoting && (
        <ShurikenVote
          initiator={shurikenInitiator}
          totalPlayers={room.players.length}
          voteStatus={shurikenVoteStatus}
          myVote={myVote}
          onVote={handleShurikenVote}
        />
      )}

      {/* 상단 토큰 바 */}
      <TokenBar
        life={gs?.life}
        maxLife={gs?.maxLife}
        shuriken={gs?.shuriken}
        round={gs?.round}
        maxRound={gs?.maxRound}
        onShuriken={handleRequestShuriken}
        canShuriken={gs?.shuriken > 0 && !shurikenVoting}
        onLeave={handleLeave}
      />

      {/* 플레이어 상태 */}
      <PlayerStatus players={room.players} myId={socket.id} />

      {/* 카드 테이블 */}
      <CardTable tableCards={gs?.tableCards || []} />

      {/* 내 카드 */}
      <MyCards
        cards={myCards}
        onPlay={handlePlayCard}
        onHighlight={handleHighlight}
        otherPlayersWithCards={room.players.filter(p => p.id !== socket.id && (p.cardCount ?? 0) > 0)}
      />

      {/* ── 모드 탭 패널 (채팅 위) ── */}
      <ModePanel
        code={room.code}
        otherPositions={otherPositions}
      />

      {/* 채팅 */}
      <ChatBox messages={messages} onSend={handleChat} />
    </div>
  )
}
