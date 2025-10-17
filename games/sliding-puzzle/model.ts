import { getRandomInt, type MoveDirection, type Position } from '../_shared'

export interface PieceState {
  readonly id: number
  readonly targetPos: Position
  x: number
  y: number
}

export interface ModelOptions {
  w: number
  h: number
  steps?: number
  idArr?: number[]
}

export class SlidingPuzzleModel {
  options: ModelOptions = { w: 0, h: 0 }
  pieces: PieceState[] = []
  isSolved = false
  steps = 0
  blankPiece!: PieceState

  // prettier-ignore
  static readonly vectorMap: Record<MoveDirection, Position> = {
    up:    { x: 0,  y: -1 },
    down:  { x: 0,  y: 1  },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  },
  } as const;

  constructor(options?: ModelOptions) {
    this.init(options || { w: 3, h: 3 })
  }

  init(options: ModelOptions) {
    const { w, h, steps = 0, idArr } = options
    // 约定 空白块 位于数组的 最后一个位置 并且 id = 0
    const blankIndex = w * h - 1
    if (this.options.w !== w || this.options.h !== h) {
      this.options = { w, h }
      this.pieces = Array.from({ length: blankIndex }, (_, index) => {
        const targetPos = this.indexToPos(index)
        return { id: index + 1, targetPos, ...targetPos }
      })
      const blankTargetPos = this.indexToPos(blankIndex)
      this.pieces.push({
        id: 0,
        targetPos: blankTargetPos,
        ...blankTargetPos,
      })
    }
    this.blankPiece = this.pieces[blankIndex]
    if (idArr?.length) {
      idArr.forEach((id, index) => {
        const { x, y } = this.indexToPos(index)
        const piece = this.pieces.find(p => p.id === id)
        if (piece) {
          piece.x = x
          piece.y = y
        }
      })
    }
    this.isSolved = this.checkIsSolved()
    this.steps = steps
  }

  move(arg: number | Position | MoveDirection) {
    if (this.isSolved) {
      return
    }
    if (typeof arg === 'string') {
      const { x, y } = SlidingPuzzleModel.vectorMap[arg]
      arg = { x: this.blankPiece.x - x, y: this.blankPiece.y - y }
    }
    const focusedPiece = this.getPiece(arg)
    const pieces = this.getMoves(focusedPiece)
    if (pieces?.length) {
      for (const p of pieces) {
        this.doSwap(p)
        this.steps++
      }
      if (!this.isSolved && this.checkIsSolved()) {
        this.isSolved = true
      }
    }
  }

  shuffle(count?: number) {
    count = count || this.options.w * this.options.h * 10
    const vectors = Object.values(SlidingPuzzleModel.vectorMap)
    const pickIdx = () => vectors[getRandomInt(0, vectors.length)]
    while (count > 0) {
      const index = pickIdx()
      const piece = this.getPiece(index)
      if (piece) {
        this.doSwap(piece)
        count--
      }
    }
  }

  checkIsSolved() {
    return this.pieces.every(
      p => p.x === p.targetPos.x && p.y === p.targetPos.y,
    )
  }

  indexToPos(index: number) {
    return { x: index % this.options.w, y: Math.floor(index / this.options.w) }
  }

  getPiece(arg: number | Position) {
    return typeof arg === 'number'
      ? this.pieces.find(p => p.id === arg)
      : this.pieces.find(p => p.x === arg.x && p.y === arg.y)
  }

  getMoves(piece?: PieceState) {
    if (!piece) {
      return
    }
    const { x, y } = piece
    let { x: currX, y: currY } = this.blankPiece
    let offsetX = Math.abs(currX - x)
    let offsetY = Math.abs(currY - y)
    if (offsetX !== 0 && offsetY !== 0) {
      return
    }

    const positions: Position[] = []
    if (offsetX !== 0) {
      const dx = x > currX ? 1 : -1
      while (offsetX > 0) {
        offsetX -= 1
        currX += dx
        positions.push({ x: currX, y })
      }
    } else {
      const dy = y > currY ? 1 : -1
      while (offsetY > 0) {
        offsetY -= 1
        currY += dy
        positions.push({ x, y: currY })
      }
    }
    return positions
      .map(pos => this.getPiece(pos))
      .filter(Boolean) as PieceState[]
  }

  doSwap(piece: PieceState) {
    const { x, y } = this.blankPiece
    this.blankPiece.x = piece.x
    this.blankPiece.y = piece.y
    piece.x = x
    piece.y = y
  }
}
