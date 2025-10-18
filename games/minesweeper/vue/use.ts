import {
  computed,
  reactive,
  readonly,
  ref,
  toRefs,
  toValue,
  type MaybeRef,
} from 'vue'
import {
  useElementBounding,
  useEventListener,
  useLocalStorage,
  useTimestamp,
} from '@vueuse/core'
import { MinesweeperModel, type ModelOptions, type CellAction } from '../model'
import { getDefaultSettings, type SettingOptions } from '../helper'

export function useMinesweeperModel(options?: ModelOptions) {
  const model = reactive(new MinesweeperModel(options))
  const { options: modelOptions, stage, timer } = toRefs(model)

  const minesRemaining = computed(() => {
    return modelOptions.value.m - model.flagIndexSet.size
  })

  const now = useTimestamp()
  const timerMs = computed(() => {
    if (stage.value === 'ready') {
      return 0
    }
    const { startAt, duration = 0 } = timer.value
    if (stage.value === 'playing') {
      const base = startAt ?? now.value
      return now.value - base + duration
    }

    return duration
  })

  return {
    minesRemaining,
    options: readonly(modelOptions),
    timerMs: readonly(timerMs),
    stage: readonly(stage),
    init: model.init.bind(model),
    dump: model.dump.bind(model),
    restart: model.restart.bind(model),
    operate: model.operate.bind(model),
    getCellGrid: model.getCellGrid.bind(model),
    getAroundCells: model.getAroundCells.bind(model),
  }
}

export function useBoardEvent(
  boardRef: MaybeRef<HTMLElement | null | undefined>,
  handler: (action: CellAction) => void,
) {
  const enableHighlight = ref(false)
  const pointerPosition = ref({ x: 0, y: 0 })
  const board = computed(() => toValue(boardRef))

  const { top, left, width, height } = useElementBounding(board)
  useEventListener(board, 'pointerdown', event => {
    const target = board.value
    if (!target) {
      return
    }
    const getPos = (e: PointerEvent) => ({
      x: e.clientX - left.value + target.scrollLeft,
      y: e.clientY - top.value + target.scrollTop,
    })
    const isRightClick = event.button === 2
    enableHighlight.value = !isRightClick
    pointerPosition.value = getPos(event)
    document.body.addEventListener('pointermove', onPointermove)
    document.body.addEventListener('pointerup', onPointerup)
    document.body.addEventListener('pointercancel', onPointerup)

    function onPointermove(event: PointerEvent) {
      const { x, y } = getPos(event)
      if (x >= 0 && x < width.value && y >= 0 && y < height.value) {
        pointerPosition.value = { x, y }
        enableHighlight.value = !isRightClick
      } else {
        enableHighlight.value = false
      }
    }

    function onPointerup() {
      enableHighlight.value = false
      document.body.removeEventListener('pointermove', onPointermove)
      document.body.removeEventListener('pointerup', onPointerup)
      document.body.removeEventListener('pointercancel', onPointerup)
    }
  })

  const operateHandlers: [keyof HTMLElementEventMap, CellAction][] = [
    ['click', 'open'],
    ['contextmenu', 'flag'],
    ['dblclick', 'open-around'],
  ]
  operateHandlers.forEach(([type, action]) => {
    useEventListener(board, type, event => {
      event.preventDefault()
      handler(action)
    })
  })

  return {
    enableHighlight: readonly(enableHighlight),
    pointerPosition: readonly(pointerPosition),
  }
}

export function useMinesweeperSettings(
  storageKey = 'g-minesweeper-settings',
  initialValue = getDefaultSettings(),
) {
  const settings = useLocalStorage<SettingOptions>(storageKey, initialValue, {
    mergeDefaults: true,
  })

  function update(newSettings: Partial<SettingOptions>) {
    settings.value = { ...settings.value, ...newSettings }
  }

  function reset() {
    settings.value = { ...initialValue }
  }

  return {
    settings: readonly(settings),
    update,
    reset,
  }
}
