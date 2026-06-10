// rooms: Map<roomCode, RoomState>
// RoomState: { code, players, gameState, mode, hostId }
// players: [{ id, nickname, cards, isReady }]
// gameState: { round, life, shuriken, tableCards, phase, votes }

const rooms = new Map();
// Track which room each socket belongs to
const socketRoomMap = new Map(); // socketId -> roomCode

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(hostId, nickname, mode, roomName) {
  const code = generateCode();
  const room = {
    code,
    hostId,
    roomName: roomName || '더 마인드',
    mode: mode || 'silent', // 'silent' | 'timeattack' | 'body'
    players: [{ id: hostId, nickname, cards: [], cardCount: 0, isReady: false, highlight: 0 }],
    gameState: null,
    phase: 'waiting', // waiting | playing | result
    shurikenVote: null,
  };
  rooms.set(code, room);
  socketRoomMap.set(hostId, code);
  return room;
}

function joinRoom(code, playerId, nickname) {
  const room = rooms.get(code);
  if (!room) return { error: '방을 찾을 수 없습니다.' };
  if (room.phase === 'playing') return { error: '게임이 이미 진행 중입니다.' };
  if (room.players.length >= 4) return { error: '방이 꽉 찼습니다.' };
  if (room.players.find(p => p.id === playerId)) {
    socketRoomMap.set(playerId, code);
    return { room };
  }
  room.players.push({ id: playerId, nickname, cards: [], cardCount: 0, isReady: false, highlight: 0 });
  socketRoomMap.set(playerId, code);
  return { room };
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room) return null;
  const playerCount = room.players.length;

  // Life tokens by player count
  const lifeMap = { 1: 3, 2: 2, 3: 3, 4: 4 };
  const life = lifeMap[playerCount] || 3;

  room.phase = 'playing';
  room.gameState = {
    round: 1,
    maxRound: 12,
    life,
    maxLife: life,
    shuriken: 1,
    tableCards: [],
    phase: 'playing',
  };

  dealCards(room);
  return room;
}

function dealCards(room) {
  const round = room.gameState.round;
  // Generate unique random cards 1-100
  const allCards = Array.from({ length: 100 }, (_, i) => i + 1);
  // Shuffle
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }

  const totalNeeded = room.players.length * round;
  const picked = allCards.slice(0, totalNeeded);

  room.players.forEach((player, idx) => {
    player.cards = picked.slice(idx * round, (idx + 1) * round).sort((a, b) => a - b);
    player.cardCount = player.cards.length;
  });

  room.gameState.tableCards = [];
}

function playCard(code, playerId, card) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'playing') return null;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return null;

  const cardIndex = player.cards.indexOf(card);
  if (cardIndex === -1) return null;

  // Check if card is valid (higher than last table card)
  const tableCards = room.gameState.tableCards;
  const lastCard = tableCards.length > 0 ? tableCards[tableCards.length - 1].value : 0;

  // Remove card from player hand
  player.cards.splice(cardIndex, 1);
  player.cardCount = player.cards.length;

  // Check if any player has a lower card (mistake!)
  let mistake = false;
  let lostCards = [];

  if (card < lastCard) {
    // This card itself is out of order - but this shouldn't happen if UI prevents it
    // Actually in The Mind, mistake = someone had a lower card they didn't play
    mistake = true;
  } else {
    // Check if any OTHER player has cards lower than this one
    room.players.forEach(p => {
      p.cards.forEach(c => {
        if (c < card) {
          lostCards.push({ playerId: p.id, card: c });
        }
      });
    });

    if (lostCards.length > 0) {
      mistake = true;
      // Remove those lower cards from hands
      lostCards.forEach(({ playerId: pid, card: c }) => {
        const p = room.players.find(pl => pl.id === pid);
        if (p) {
          const idx = p.cards.indexOf(c);
          if (idx !== -1) p.cards.splice(idx, 1);
          p.cardCount = p.cards.length;
        }
      });
    }
  }

  // 잃은 카드들을 테이블에 오름차순으로 자동 추가 (플레이어 정보 포함)
  if (lostCards.length > 0) {
    const sortedLost = [...lostCards].sort((a, b) => a.card - b.card);
    sortedLost.forEach(({ playerId: pid, card: c }) => {
      const p = room.players.find(pl => pl.id === pid);
      tableCards.push({ value: c, playerId: pid, nickname: p?.nickname || '?', auto: true });
    });
  }

  // Add played card to table
  tableCards.push({ value: card, playerId, nickname: player.nickname });

  if (mistake) {
    room.gameState.life = Math.max(0, room.gameState.life - 1);
  }

  // Check win condition: all cards played
  const totalCards = room.players.reduce((sum, p) => sum + p.cards.length, 0);

  let roundResult = null;
  if (totalCards === 0) {
    roundResult = 'roundClear';
  }

  const gameOver = room.gameState.life === 0;

  return { room, mistake, lostCards, roundResult, gameOver };
}

function nextRound(code) {
  const room = rooms.get(code);
  if (!room) return null;
  // 이미 다음 라운드로 넘어갔으면 중복 처리 방지
  const totalCards = room.players.reduce((sum, p) => sum + p.cards.length, 0);
  if (totalCards > 0) return null; // 아직 카드가 남아있으면 무시

  room.gameState.round += 1;

  // 라운드 보상: 3,7,11 → 수리검 +1 / 5,9 → 라이프 +1
  const round = room.gameState.round;
  let reward = null;
  if (round === 3 || round === 7 || round === 11) {
    room.gameState.shuriken += 1;
    reward = 'shuriken';
  } else if (round === 5 || round === 9) {
    room.gameState.life += 1;
    room.gameState.maxLife += 1;
    reward = 'life';
  }

  if (room.gameState.round > room.gameState.maxRound) {
    return { room, victory: true, reward: null };
  }

  dealCards(room);
  return { room, victory: false, reward };
}

function initShurikenVote(code, initiatorId) {
  const room = rooms.get(code);
  if (!room || room.gameState.shuriken <= 0) return null;
  if (room.shurikenVote) return null; // already voting

  room.shurikenVote = {
    initiatorId,
    votes: {}, // playerId -> true/false
    timeout: Date.now() + 10000,
  };
  room.players.forEach(p => { room.shurikenVote.votes[p.id] = null; });
  return room;
}

function changeMode(code, mode) {
  const room = rooms.get(code);
  if (!room || room.phase !== 'waiting') return null;
  room.mode = mode;
  return room;
}

function castShurikenVote(code, playerId, agree) {
  const room = rooms.get(code);
  if (!room || !room.shurikenVote) return null;

  room.shurikenVote.votes[playerId] = agree;

  const total = room.players.length;
  const votes = Object.values(room.shurikenVote.votes);
  const voted = votes.filter(v => v !== null).length;
  const agreeCount = votes.filter(v => v === true).length;
  const disagreeCount = votes.filter(v => v === false).length;
  const needed = Math.ceil(total / 2);

  // 과반수 거절 시 즉시 취소
  if (disagreeCount > total - needed) {
    room.shurikenVote = null;
    return { room, result: 'rejected' };
  }

  // 과반수 동의 시 즉시 실행
  if (agreeCount >= needed) {
    // Execute shuriken
    const discarded = [];
    room.players.forEach(p => {
      if (p.cards.length > 0) {
        const lowest = Math.min(...p.cards);
        discarded.push({ playerId: p.id, nickname: p.nickname, card: lowest });
        p.cards = p.cards.filter(c => c !== lowest);
        p.cardCount = p.cards.length;
      }
    });
    room.gameState.shuriken -= 1;
    room.shurikenVote = null;

    const totalCards = room.players.reduce((sum, p) => sum + p.cards.length, 0);
    const roundClear = totalCards === 0;
    return { room, result: 'approved', discarded, roundClear };
  }

  return { room, result: 'pending' };
}

function setHighlight(code, playerId, level) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find(p => p.id === playerId);
  if (player) player.highlight = level;
  return room;
}

function leaveRoom(code, playerId) {
  const room = rooms.get(code);
  socketRoomMap.delete(playerId);
  if (!room) return null;
  room.players = room.players.filter(p => p.id !== playerId);
  if (room.players.length === 0) {
    rooms.delete(code);
    return null;
  }
  if (room.hostId === playerId && room.players.length > 0) {
    room.hostId = room.players[0].id;
  }
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function getRoomForPlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  // Return room with only this player's actual cards visible, others show count only
  return {
    ...room,
    players: room.players.map(p => ({
      id: p.id,
      nickname: p.nickname,
      cardCount: p.cardCount,
      highlight: p.highlight,
      cards: p.id === playerId ? p.cards : undefined,
    })),
  };
}

function getRoomCodeForSocket(socketId) {
  return socketRoomMap.get(socketId);
}

module.exports = {
  createRoom, joinRoom, startGame, playCard, nextRound, changeMode,
  initShurikenVote, castShurikenVote, setHighlight, leaveRoom, getRoom, getRoomForPlayer,
  getRoomCodeForSocket,
};
