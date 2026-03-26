const WINNING_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

const OP_MOVE     = 1
const OP_STATE    = 2
const OP_TIMER    = 3
const OP_GAMEOVER = 4

function checkWinner(board) {
  for (const [a, b, c] of WINNING_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  if (board.every(cell => cell !== '')) return 'draw'
  return null
}

const matchInit = function(ctx, logger, nk, params) {
  logger.info('Match created')
  return {
    state: {
      board: Array(9).fill(''),
      currentTurn: '',
      players: [],
      symbols: {},
      usernames: {},
      winner: null,
      timeLeft: 30,
    },
    tickRate: 1,
    label: 'tictactoe'
  }
}

const matchJoinAttempt = function(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
  if (state.players.length >= 2) {
    return { state, accept: false, rejectMessage: 'Match is full' }
  }
  return { state, accept: true }
}

const matchJoin = function(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (const presence of presences) {
    state.players.push(presence.userId)
    state.usernames[presence.userId] = presence.username
    logger.info('Player joined: ' + presence.username)
  }

  if (state.players.length === 2) {
    state.symbols[state.players[0]] = 'X'
    state.symbols[state.players[1]] = 'O'
    state.currentTurn = state.players[0]
    state.timeLeft = 30

    const payload = JSON.stringify({
      board: state.board,
      currentTurn: state.symbols[state.currentTurn],
      symbols: state.symbols,
      usernames: state.usernames,
      timeLeft: state.timeLeft,
      winner: null,
    })
    dispatcher.broadcastMessage(OP_STATE, payload)
    logger.info('Match started')
  }

  return { state }
}

const matchLeave = function(ctx, logger, nk, dispatcher, tick, state, presences) {
  for (const presence of presences) {
    logger.info('Player left: ' + presence.username)
    if (state.players.length === 2 && !state.winner) {
      const remainingId = state.players.find(id => id !== presence.userId)
      if (remainingId) {
        state.winner = state.symbols[remainingId]
        dispatcher.broadcastMessage(OP_GAMEOVER, JSON.stringify({
          winner: state.winner,
          reason: 'opponent_disconnected'
        }))
      }
    }
    state.players = state.players.filter(id => id !== presence.userId)
  }
  return { state }
}

const matchLoop = function(ctx, logger, nk, dispatcher, tick, state, messages) {
  if (state.winner) return null
  if (state.players.length < 2) return { state }

  // Timer tick
  state.timeLeft -= 1
  dispatcher.broadcastMessage(OP_TIMER, JSON.stringify({ timeLeft: state.timeLeft }))

  // Timer expired — forfeit turn
  if (state.timeLeft <= 0) {
    state.currentTurn = state.players.find(id => id !== state.currentTurn) || state.currentTurn
    state.timeLeft = 30
    dispatcher.broadcastMessage(OP_STATE, JSON.stringify({
      board: state.board,
      currentTurn: state.symbols[state.currentTurn],
      timeLeft: state.timeLeft,
      winner: null,
      forfeit: true,
    }))
    return { state }
  }

  // Process moves
  for (const msg of messages) {
    if (msg.opCode !== OP_MOVE) continue
    if (msg.sender.userId !== state.currentTurn) continue

    let data
    try {
      data = JSON.parse(nk.binaryToString(msg.data))
    } catch(e) {
      logger.error('Invalid move payload')
      continue
    }

    const { cell } = data
    if (cell < 0 || cell > 8 || state.board[cell] !== '') continue

    // Apply move
    state.board[cell] = state.symbols[state.currentTurn]
    logger.info(state.usernames[state.currentTurn] + ' played cell ' + cell)

    const winner = checkWinner(state.board)

    if (winner) {
      state.winner = winner

      if (winner !== 'draw') {
        const winnerId = state.players.find(id => state.symbols[id] === winner)
        const loserId  = state.players.find(id => state.symbols[id] !== winner)
        if (winnerId) nk.leaderboardRecordWrite('tictactoe_wins',   winnerId, state.usernames[winnerId], 1, 0, {})
        if (loserId)  nk.leaderboardRecordWrite('tictactoe_losses', loserId,  state.usernames[loserId],  1, 0, {})
      }

      dispatcher.broadcastMessage(OP_GAMEOVER, JSON.stringify({
        board: state.board,
        winner,
        symbols: state.symbols,
        usernames: state.usernames,
      }))
      return { state }
    }

    // Switch turn + reset timer
    state.currentTurn = state.players.find(id => id !== state.currentTurn) || state.currentTurn
    state.timeLeft = 30

    dispatcher.broadcastMessage(OP_STATE, JSON.stringify({
      board: state.board,
      currentTurn: state.symbols[state.currentTurn],
      timeLeft: state.timeLeft,
      winner: null,
    }))
  }

  return { state }
}

const matchTerminate = function(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
  logger.info('Match terminated')
  return { state }
}

const matchSignal = function(ctx, logger, nk, dispatcher, tick, state, data) {
  return { state }
}

const matchmakerMatched = function(ctx, logger, nk, matches) {
  try {
    const matchId = nk.matchCreate('tictactoe', {})
    return matchId
  } catch (error) {
    logger.error('Error creating match: %q', error)
    throw error
  }
}

var InitModule = function(ctx, logger, nk, initializer) {
  initializer.registerMatch('tictactoe', {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate,
    matchSignal: matchSignal,
  })

  initializer.registerMatchmakerMatched(matchmakerMatched)

  try {
    nk.leaderboardCreate('tictactoe_wins',   true, 'desc', 'incr', null, {})
    nk.leaderboardCreate('tictactoe_losses', true, 'desc', 'incr', null, {})
  } catch(e) {
    logger.info('Leaderboards already exist or failed: ' + e.message)
  }

  logger.info('TicTacToe module loaded!')
}