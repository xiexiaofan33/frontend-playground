import { arrayShuffle, type Position } from '../_shared'

export type AroundMineCount = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type BoardStage = 'ready' | 'playing' | 'won' | 'lost'
export type CellAction = 'open' | 'flag' | 'open-around'

export interface CellState {
  readonly index: number
  open?: boolean
  mine?: boolean
  flag?: boolean
  boom?: boolean
  aroundMineCount?: AroundMineCount
}

export interface ModelOptions {
  w: number /**board width */
  h: number /**board height */
  m: number /**mines count */
  cellBits?: Array<[number /**index */, number /*bit*/]>
  duration?: number /**game duration */
}

export class MinesweeperModel {
  options: ModelOptions = { w: 0, h: 0, m: 0 }
  timer: { duration: number; startAt?: number } = { duration: 0 }
  stage: BoardStage = 'ready'
  cells: CellState[] = []
  mineIndexArr: number[] = []
  flagIndexSet: Set<number> = new Set()

  private aroundCellsCache: Map<number, CellState[]> = new Map()
  private unopenedCellCount = 0
  // prettier-ignore
  private static aroundPosVec = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1],
  ] as const
  private static bitFlags = {
    open: 0x1, // 0001
    mine: 0x2, // 0010
    flag: 0x4, // 0100
  } as const

  constructor(options?: ModelOptions) {
    this.init(options || { w: 9, h: 9, m: 10 })
  }

  init(options: ModelOptions) {
    const { w, h, m, cellBits, duration = 0 } = options
    if (w !== this.options.w || h !== this.options.h) {
      this.cells = Array.from({ length: w * h }, (_, index) => ({ index }))
      this.aroundCellsCache.clear()
    } else {
      this.cells = this.cells.map(({ index }) => ({ index }))
    }
    this.options = { w, h, m }
    this.mineIndexArr.length = 0
    this.flagIndexSet.clear()
    this.unopenedCellCount = w * h - m
    this.timer = { duration }
    this.stage = 'ready'
    if (cellBits?.length) {
      const openedCells: CellState[] = []
      cellBits.forEach(([index, bit]) => {
        const cell = this.cells[index]
        if (bit & MinesweeperModel.bitFlags.open) {
          cell.open = true
          openedCells.push(cell)
        }
        if (bit & MinesweeperModel.bitFlags.mine) {
          cell.mine = true
          this.mineIndexArr.push(index)
        }
        if (bit & MinesweeperModel.bitFlags.flag) {
          cell.flag = true
          this.flagIndexSet.add(index)
        }
      })
      openedCells.forEach(cell => this.getAroundMineCount(cell))
      this.unopenedCellCount -= openedCells.length
      this.timer.startAt = Date.now()
      this.stage = 'playing'
    }
  }

  restart() {
    if (this.stage === 'ready') {
      return
    }
    this.cells.forEach(cell => {
      if (cell.open) cell.open = false
      if (cell.flag) cell.flag = false
      if (cell.boom) cell.boom = false
    })
    this.mineIndexArr.length = 0
    this.flagIndexSet.clear()
    this.unopenedCellCount = this.options.w * this.options.h - this.options.m
    this.timer = { duration: 0, startAt: Date.now() }
    this.stage = 'ready'
  }

  dump() {
    const cellBits = this.cells.flatMap(cell => {
      const bit =
        (cell.open ? MinesweeperModel.bitFlags.open : 0) |
        (cell.mine ? MinesweeperModel.bitFlags.mine : 0) |
        (cell.flag ? MinesweeperModel.bitFlags.flag : 0)
      return bit > 0 ? [[cell.index, bit] as [number, number]] : []
    })
    const duration = this.timer.startAt
      ? Date.now() - this.timer.startAt + this.timer.duration
      : this.timer.duration

    return { cellBits, duration, ...this.options }
  }

  posToIndex({ x, y }: Position) {
    return x + y * this.options.w
  }

  indexToPos(index: number) {
    return {
      x: index % this.options.w,
      y: Math.floor(index / this.options.w),
    }
  }

  getAroundCells(cell: CellState) {
    const index = cell.index
    const cache = this.aroundCellsCache.get(index)
    if (cache) {
      return cache
    }
    const { w, h } = this.options
    const { x, y } = this.indexToPos(index)
    const aroundCells = MinesweeperModel.aroundPosVec.flatMap(([dx, dy]) => {
      const pos = { x: x + dx, y: y + dy }
      return pos.x >= 0 && pos.x < w && pos.y >= 0 && pos.y < h
        ? [this.cells[this.posToIndex(pos)]]
        : []
    })
    this.aroundCellsCache.set(index, aroundCells)
    return aroundCells
  }

  getAroundMineCount(cell: CellState) {
    if (cell.aroundMineCount === undefined) {
      const { length } = this.getAroundCells(cell).filter(cell => cell.mine)
      cell.aroundMineCount = length as AroundMineCount
    }
    return cell.aroundMineCount
  }

  getCellGrid() {
    return Array.from({ length: this.options.h }, (_, y) =>
      Array.from(
        { length: this.options.w },
        (_, x) => this.cells[this.posToIndex({ x, y })],
      ),
    )
  }

  operate(cell: CellState, action: CellAction, allowOpenAround = false) {
    if (this.stage === 'won' || this.stage === 'lost') {
      return
    }
    if (this.stage === 'ready') {
      this.placeMines(cell)
      this.timer.startAt = Date.now()
      this.stage = 'playing'
    }
    if (action === 'open-around') {
      this.doOpenAround(cell)
      return
    }
    const success = action === 'open' ? this.doOpen(cell) : this.doFlag(cell)
    if (!success && allowOpenAround) {
      this.doOpenAround(cell)
    }
  }

  private placeMines(cell: CellState) {
    // Exclude the cell and its siblings
    const excludedIndexArr = [
      cell.index,
      ...this.getAroundCells(cell).map(({ index }) => index),
    ]
    const candidateIndexArr = this.cells.flatMap(({ index }) =>
      !excludedIndexArr.includes(index) ? [index] : [],
    )
    arrayShuffle(candidateIndexArr, this.options.m).forEach(index => {
      this.cells[index].mine = true
      this.mineIndexArr.push(index)
    })
  }

  private doOpen(cell: CellState) {
    if (cell.open || cell.flag) {
      return false
    }
    cell.open = true
    if (cell.mine) {
      cell.boom = true
      this.doGameEnd(false)
    } else if (--this.unopenedCellCount === 0) {
      this.doGameEnd(true)
    } else if (this.getAroundMineCount(cell) === 0) {
      this.getAroundCells(cell).forEach(c => this.doOpen(c))
    }
    return true
  }

  private doFlag(cell: CellState) {
    if (cell.open) {
      return false
    }
    if (cell.flag) {
      cell.flag = false
      this.flagIndexSet.delete(cell.index)
    } else {
      cell.flag = true
      this.flagIndexSet.add(cell.index)
    }
    return true
  }

  private doOpenAround(cell: CellState) {
    if (!cell.open) {
      return false
    }
    const aroundCells = this.getAroundCells(cell)
    const aroundFlagCount = aroundCells.filter(c => c.flag).length
    if (
      aroundFlagCount === 0 ||
      aroundFlagCount !== this.getAroundMineCount(cell)
    ) {
      return false
    }
    aroundCells.forEach(cell => this.doOpen(cell))
    return true
  }

  private doGameEnd(isWin: boolean) {
    if (isWin) {
      this.stage = 'won'
      this.flagIndexSet.clear()
      this.cells.forEach(cell => {
        if (cell.mine) {
          cell.flag = true
          this.flagIndexSet.add(cell.index)
        } else {
          cell.open = true
          this.getAroundMineCount(cell)
        }
      })
    } else {
      this.stage = 'lost'
      this.mineIndexArr.forEach(index => (this.cells[index].open = true))
      this.flagIndexSet.forEach(index => (this.cells[index].open = true))
    }
  }
}
