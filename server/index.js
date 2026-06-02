const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gm = require('./gameManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Number masking: mask Korean and Arabic numerals in chat
const numberPatterns = [
  /\d+/g,
  /일|이|삼|사|오|육|칠|팔|구|십|백/g,
  /하나|둘|셋|넷|다섯|여섯|일곱|여덟|아홉|열/g,
  /스물|서른|마흔|쉰|예순|일흔|여든|아흔/g,
];

function maskNumbers(text) {
  let masked = text;
  let hasMasked = false;
  numberPatterns.forEach(pattern => {
    if (pattern.test(masked)) hasMasked = true;
    pattern.lastIndex = 0;
    masked = masked.replace(pattern, '██');
  });
  return { masked, hasMasked };
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('createRoom', ({ nickname, mode, roomName }) => {
    const room = gm.createRoom(socket.id, nickname, mode, roomName);
    socket.join(room.code);
    socket.emit('roomCreated', { room: gm.getRoomForPlayer(room.code, socket.id), code: room.code });
  });

  socket.on('joinRoom', ({ code, nickname }) => {
    const result = gm.joinRoom(code.toUpperCase(), socket.id, nickname);
    if (result.error) {
      socket.emit('joinError', { message: result.error });
      return;
    }
    socket.join(code.toUpperCase());
    socket.emit('roomJoined', { room: gm.getRoomForPlayer(code.toUpperCase(), socket.id) });
    io.to(code.toUpperCase()).emit('playerJoined', { room: gm.getRoomForPlayer(code.toUpperCase(), socket.id) });
  });

  socket.on('changeMode', ({ code, mode }) => {
    const room = gm.changeMode(code, mode);
    if (!room) return;
    io.to(code).emit('modeChanged', { room: gm.getRoomForPlayer(code, socket.id) });
  });

  socket.on('startGame', ({ code }) => {
    const room = gm.startGame(code);
    if (!room) return;
    // Send each player their own cards
    room.players.forEach(p => {
      io.to(p.id).emit('gameStarted', { room: gm.getRoomForPlayer(code, p.id) });
    });
  });

  socket.on('playCard', ({ code, card }) => {
    const result = gm.playCard(code, socket.id, card);
    if (!result) return;
    const { room, mistake, lostCards, roundResult, gameOver } = result;

    // Broadcast updated state to all
    room.players.forEach(p => {
      io.to(p.id).emit('cardPlayed', {
        room: gm.getRoomForPlayer(code, p.id),
        mistake,
        lostCards,
        roundResult,
        gameOver,
      });
    });

    if (gameOver) {
      io.to(code).emit('gameOver', { message: '라이프가 모두 소진되었습니다.' });
    } else if (roundResult === 'roundClear') {
      io.to(code).emit('roundClear', { round: room.gameState.round });
    }
  });

  socket.on('nextRound', ({ code }) => {
    const result = gm.nextRound(code);
    if (!result) return;
    const { room, victory, reward } = result;
    if (victory) {
      io.to(code).emit('victory', { message: '모든 라운드를 클리어했습니다!' });
    } else {
      room.players.forEach(p => {
        io.to(p.id).emit('roundStarted', { room: gm.getRoomForPlayer(code, p.id), reward });
      });
    }
  });

  socket.on('requestShuriken', ({ code }) => {
    const room = gm.initShurikenVote(code, socket.id);
    if (!room) return;
    const initiator = room.players.find(p => p.id === socket.id);
    io.to(code).emit('shurikenVoteStarted', { initiatorNickname: initiator?.nickname });
  });

  socket.on('shurikenVote', ({ code, agree }) => {
    const result = gm.castShurikenVote(code, socket.id, agree);
    if (!result) return;
    const { room, result: voteResult, discarded, roundClear } = result;

    if (voteResult === 'approved') {
      room.players.forEach(p => {
        io.to(p.id).emit('shurikenUsed', {
          room: gm.getRoomForPlayer(code, p.id),
          discarded,
          roundClear,
        });
      });
      if (roundClear) io.to(code).emit('roundClear', { round: room.gameState.round });
    } else if (voteResult === 'rejected') {
      io.to(code).emit('shurikenRejected');
    } else {
      io.to(code).emit('shurikenVoteUpdate', { votes: result.room.shurikenVote?.votes });
    }
  });

  socket.on('highlight', ({ code, level }) => {
    const room = gm.setHighlight(code, socket.id, level);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    io.to(code).emit('highlightUpdate', { playerId: socket.id, nickname: player?.nickname, level });
  });

  socket.on('modeActivated', ({ code, mode }) => {
    const room = gm.getRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    // 나를 제외한 다른 플레이어에게 알림
    socket.to(code).emit('modeActivatedByPeer', { mode, nickname: player?.nickname });
  });

  socket.on('bodyPart', ({ code, position }) => {
    const room = gm.getRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    socket.to(code).emit('bodyPartUpdate', {
      playerId: socket.id,
      nickname: player?.nickname,
      position,
    });
  });

  socket.on('chat', ({ code, message }) => {
    const room = gm.getRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    const { masked, hasMasked } = maskNumbers(message);
    io.to(code).emit('chatMessage', {
      nickname: player?.nickname || '익명',
      message: masked,
      hasMasked,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    // Find and clean up room for this socket
    const code = gm.getRoomCodeForSocket(socket.id);
    if (code) {
      const room = gm.leaveRoom(code, socket.id);
      if (room) {
        room.players.forEach(p => {
          io.to(p.id).emit('playerLeft', { room: gm.getRoomForPlayer(code, p.id) });
        });
      }
    }
  });

  socket.on('leaveRoom', ({ code }) => {
    const room = gm.leaveRoom(code, socket.id);
    socket.leave(code);
    if (room) {
      room.players.forEach(p => {
        io.to(p.id).emit('playerLeft', { room: gm.getRoomForPlayer(code, p.id) });
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
