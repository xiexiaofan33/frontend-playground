import { arrayShuffle, type MoveDirection } from "../_shared";

export interface TileState {
  id?: number;
  value: number;
  x: number;
  y: number;
}

export interface ModelState {
  score: number;
  steps: number;
  tiles: TileState[];
}

export interface ModelOptions {
  boardWidth: number;
  popupStart: number;
  popupMoved: number;
  initialState?: Partial<ModelState>;
}

export type TilesInLine = (TileState | null)[];
export type MoveFuncArgs = {
  axis: "x" | "y";
  isReverse: boolean;
  getTilesInLine: (index: number) => TilesInLine;
};

export class G2048Model {
  options: ModelOptions = { boardWidth: 4, popupStart: 2, popupMoved: 1 };
  steps = 0;
  score = 0;
  tiles: TileState[] = [];
  isGameOver = false;
  private tileGrid: TilesInLine[] = [];
  private oldState?: ModelState;
  // prettier-ignore
  private MoveArgsMap: Record<MoveDirection, MoveFuncArgs> = {
    up   : { axis: 'y', isReverse: true,  getTilesInLine: (x: number) => this.tileGrid.map(row => row[x]) },
    down : { axis: 'y', isReverse: false, getTilesInLine: (x: number) => this.tileGrid.map(row => row[x]) },
    left : { axis: 'x', isReverse: true,  getTilesInLine: (y: number) => this.tileGrid[y] },
    right: { axis: 'x', isReverse: false, getTilesInLine: (y: number) => this.tileGrid[y] },
  };

  private static idCounter = 0;

  static isTilesPositionEqual(t1: TileState[], t2: TileState[]) {
    return (
      t1.length === t2.length &&
      t1.every((t, i) => t.x === t2[i].x && t.y === t2[i].y)
    );
  }

  constructor(options?: ModelOptions) {
    this.init(options ?? { ...this.options });
  }

  init(options: ModelOptions) {
    const { initialState, ...rest } = options;
    this.steps = initialState?.steps ?? 0;
    this.score = initialState?.score ?? 0;
    this.tiles = initialState?.tiles ?? [];
    this.options = rest;
    this.isGameOver = false;
    this.oldState = undefined;
    this.updateTileGrid(true);
    if (this.tiles.length === 0) {
      this.popup(this.options.popupStart);
    } else {
      this.tiles.forEach((t) => (t.id = G2048Model.idCounter++));
    }
  }

  move(direction: MoveDirection) {
    if (this.isGameOver) {
      return;
    }
    const stateBeforeMove = this.dumpState();
    this.doMoveTiles(this.MoveArgsMap[direction]);
    if (G2048Model.isTilesPositionEqual(stateBeforeMove.tiles, this.tiles)) {
      return;
    }
    this.steps++;
    this.oldState = stateBeforeMove;
    this.updateTileGrid();
    this.popup(this.options.popupMoved);
  }

  back() {
    if (this.oldState) {
      Object.assign(this, this.oldState);
      this.oldState = undefined;
      this.isGameOver = false;
      this.updateTileGrid();
    }
  }

  dumpState(): ModelState {
    return {
      score: this.score,
      steps: this.steps,
      tiles: this.tiles.map((t) => ({ ...t })),
    };
  }

  dump(): ModelOptions {
    return {
      ...this.options,
      initialState: this.dumpState(),
    };
  }

  canMove() {
    const length = this.options.boardWidth;
    for (let i = 0; i < length; i++) {
      for (let j = 0; j < length; j++) {
        const value = this.tileGrid[i][j]?.value;
        if (
          (i < length - 1 && value === this.tileGrid[i + 1][j]?.value) ||
          (j < length - 1 && value === this.tileGrid[i][j + 1]?.value)
        ) {
          return true;
        }
      }
    }
    return false;
  }

  canBack() {
    return !!this.oldState;
  }

  private popup(count: number) {
    if (count <= 0) {
      return;
    }
    const emptyPositions = this.tileGrid.flatMap((row, y) =>
      row.flatMap((item, x) => (item === null ? [{ x, y }] : []))
    );
    if (emptyPositions.length < count) {
      this.isGameOver = true;
      return;
    }
    arrayShuffle(emptyPositions, count).forEach((pos) => {
      const t: TileState = {
        id: G2048Model.idCounter++,
        value: Math.random() < 0.9 ? 2 : 4,
        ...pos,
      };
      this.tiles.push(t);
      this.tileGrid[pos.y][pos.x] = t;
    });
    if (emptyPositions.length === count && !this.canMove()) {
      this.isGameOver = true;
    }
  }

  private updateTileGrid(shouldRecreate = false) {
    if (!shouldRecreate) {
      this.tileGrid.forEach((row) => row.fill(null));
    } else {
      const length = this.options.boardWidth;
      this.tileGrid = Array.from({ length }, () =>
        Array.from({ length }, () => null)
      );
    }
    this.tiles.forEach((t) => (this.tileGrid[t.y][t.x] = t));
  }

  private doMoveTiles({ axis, isReverse, getTilesInLine }: MoveFuncArgs) {
    const length = this.options.boardWidth;
    for (let i = 0; i < length; i++) {
      let tiles = getTilesInLine(i).filter((t) => t !== null);
      if (tiles.length > 0) {
        let offset = 0;
        if (isReverse) {
          tiles = this.mergeTilesOnLine(tiles.reverse()).reverse();
        } else {
          tiles = this.mergeTilesOnLine(tiles);
          offset = length - tiles.length;
        }
        tiles.forEach((t, index) => (t[axis] = index + offset));
      }
    }
    this.tiles = this.tiles.filter((t) => t.value > 0);
  }

  private mergeTilesOnLine(tiles: TileState[]) {
    for (let i = tiles.length - 1; i > 0; i--) {
      const curr = tiles[i];
      const prev = tiles[i - 1];
      if (curr.value === prev.value) {
        prev.value += curr.value;
        curr.value = 0;
        this.score += prev.value;
        i--;
      }
    }
    return tiles.filter((t) => t.value > 0);
  }
}

export function tilesToBoard(tiles: TileState[], length: number) {
  const board = Array.from({ length }, () => Array.from({ length }, () => 0));
  tiles.forEach((t) => (board[t.y][t.x] = t.value));
  return board;
}

export function boardToTiles(board: number[][]): TileState[] {
  const tiles: TileState[] = [];
  const length = board.length;
  for (let y = 0; y < length; y++) {
    for (let x = 0; x < length; x++) {
      const value = board[y][x];
      if (value !== 0) {
        tiles.push({ x, y, value });
      }
    }
  }
  return tiles;
}
