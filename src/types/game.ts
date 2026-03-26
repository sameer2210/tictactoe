export type Player = 'X' | 'O'

export type CellValue = Player | null | ''

export type GameStatus = 
  | 'lobby'        // entering nickname
  | 'matchmaking'  // finding opponent
  | 'playing'      // game in progress
  | 'gameover'     // someone won or draw

export interface GameState {
  board: CellValue[]      // 9 cells, index 0-8
  currentTurn: Player     // whose turn it is
  winner: Player | 'draw' | null
  mySymbol: Player        // are you X or O?
  opponentName: string
  timeLeft: number        // 30 second timer
  rematchRequestedByMe: boolean
  opponentWantsRematch: boolean
}

export interface LeaderboardEntry {
  username: string
  wins: number
  losses: number
  rank: number
}
