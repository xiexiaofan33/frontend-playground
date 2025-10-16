import { reactive, readonly, toRefs, watch, type MaybeRef } from 'vue'
import { useLocalStorage, useThrottleFn } from '@vueuse/core'
import {
  useMoveCommandCallback,
  usePagehideCallback,
  type MoveCommand,
} from '../../_shared/vue'
import { G2048Model } from '../model'

export interface UseG2048Options {
  saveWhenExit?: boolean
  lastStateKey?: string
  bestScoreKey?: string
  moveThrottle?: number
  onMoveEffect?: (command: MoveCommand) => void
}

export function useG2048(
  element: MaybeRef<HTMLElement | null | undefined>,
  options: UseG2048Options = {},
) {
  const {
    saveWhenExit = true,
    lastStateKey = '2048-last-state',
    bestScoreKey = '2048-best-score',
    moveThrottle = 50,
    onMoveEffect,
  } = options

  const model = reactive(new G2048Model())
  const {
    options: modelOptions,
    isGameOver,
    score,
    steps,
    tiles,
  } = toRefs(model)

  useMoveCommandCallback({
    element,
    onMoved: useThrottleFn((cmd: MoveCommand) => {
      model.move(cmd)
      onMoveEffect?.(cmd)
    }, moveThrottle),
  })

  usePagehideCallback(() => {
    if (saveWhenExit && !isGameOver.value) {
      const storage = JSON.stringify(model.dump())
      localStorage.setItem(lastStateKey, storage)
    }
  })

  const bestScore = useLocalStorage(bestScoreKey, score.value)
  watch(score, value => (bestScore.value = Math.max(bestScore.value, value)))

  const tryReloadLastState = async () => {
    try {
      const storage = localStorage.getItem(lastStateKey)
      if (storage) {
        const parsed = JSON.parse(storage)
        model.init(parsed)
        return true
      }
    } catch (e) {
      console.error('Failed to load game state:', e)
    } finally {
      localStorage.removeItem(lastStateKey)
    }
    return false
  }

  return {
    options: readonly(modelOptions),
    isGameOver: readonly(isGameOver),
    score: readonly(score),
    steps: readonly(steps),
    tiles: readonly(tiles),
    bestScore: readonly(bestScore),
    init: model.init.bind(model),
    move: model.move.bind(model),
    back: model.back.bind(model),
    canBack: model.canBack.bind(model),
    tryReloadLastState,
  }
}
