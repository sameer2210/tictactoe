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
      className={`
        w-24 h-24 text-4xl font-bold rounded-xl border-2 transition-all
        ${value === 'X' ? 'text-purple-400 border-purple-800 bg-purple-950' : ''}
        ${value === 'O' ? 'text-teal-400 border-teal-800 bg-teal-950' : ''}
        ${isEmpty ? 'border-gray-700 bg-gray-800' : ''}
        ${canClick ? 'hover:border-purple-500 hover:bg-gray-700 cursor-pointer' : ''}
        ${!canClick && isEmpty ? 'cursor-not-allowed opacity-50' : ''}
      `}
      onClick={() => canClick && onClick(index)}
    >
      {value}
    </button>
  )
}