import type { CellValue } from '../types/game'

interface Props {
  value: CellValue
  index: number
  isMyTurn: boolean
  onClick: (index: number) => void
}

export default function Cell({ value, index, isMyTurn, onClick }: Props) {
  const isEmpty = !value
  const canClick = isEmpty && isMyTurn

  return (
    <button
      className={[
        'game-cell',
        value === 'X' ? 'cell-x' : '',
        value === 'O' ? 'cell-o' : '',
        isEmpty ? 'is-empty' : '',
        canClick ? 'is-clickable' : '',
      ].join(' ').trim()}
      onClick={() => canClick && onClick(index)}
      disabled={!canClick}
      aria-label={`Cell ${index + 1}`}
    >
      {value}
    </button>
  )
}
