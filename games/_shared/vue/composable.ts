import {
  useEventListener,
  tryOnUnmounted,
  usePointerSwipe,
  type UseSwipeDirection,
  type MaybeRefOrGetter,
} from '@vueuse/core'

export type MoveCommand = Exclude<UseSwipeDirection, 'none'>

const defaultMoveCommandMap: Record<string, MoveCommand> = {
  ArrowUp: 'up',
  ArrowLeft: 'left',
  ArrowDown: 'down',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
}

export function useMoveCommandCallback(
  options: {
    enableKeyboardPress?: boolean
    enablePointerSwipe?: boolean
    commandMap?: Record<string, MoveCommand>
    element?: MaybeRefOrGetter<HTMLElement | null | undefined>
    onMoved?: (command: MoveCommand) => void
  } = {},
) {
  const {
    enableKeyboardPress = true,
    enablePointerSwipe = true,
    commandMap = defaultMoveCommandMap,
    element,
    onMoved,
  } = options

  const stops: Array<() => void> = []
  if (enableKeyboardPress) {
    stops.push(
      useEventListener('keydown', event => {
        const cmd = commandMap[event.key]
        if (cmd) {
          event.preventDefault()
          onMoved?.(cmd)
        }
      }),
    )
  }
  if (enablePointerSwipe) {
    const { stop } = usePointerSwipe(element, {
      threshold: 30,
      onSwipeEnd(_, cmd) {
        if (cmd !== 'none') {
          onMoved?.(cmd)
        }
      },
    })
    stops.push(stop)
  }

  const stop = () => stops.forEach(s => s())
  return {
    stop,
  }
}

export function usePagehideCallback(callback: () => void) {
  let hasCalled = false
  const handler = () => {
    if (!hasCalled) {
      hasCalled = true
      callback()
    }
  }
  useEventListener('pagehide', handler)
  tryOnUnmounted(handler)
}
