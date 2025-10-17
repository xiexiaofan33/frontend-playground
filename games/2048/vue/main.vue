<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import { mode as modeConfigs } from '../res/configs.json'
import { useG2048 } from './use'
import Board from './board.vue'
import Guide from './guide.vue'

const boardRef = useTemplateRef<HTMLElement>('boardRef')
const scoreIncToastRef = useTemplateRef<HTMLElement>('scoreIncToastRef')
const scoreIncToastParent = computed(() => scoreIncToastRef.value?.parentNode)

const modeIndex = ref(0)
const modeProps = computed(() => modeConfigs[modeIndex.value])
const popupAnimate = ref('')

const { isGameOver, steps, ...model } = useG2048(boardRef, {
  ...modeProps.value,
  onMoveEffect() {
    popupAnimate.value = 'animate-tile-popup'
  },
})

const score = ref(model.score.value)
watch(model.score, (value, oldValue) => {
  if (oldValue === undefined || oldValue >= value) {
    score.value = value
    return
  }
  let startAt: number
  const delta = value - oldValue
  const loop = (timestamp: number) => {
    startAt = startAt ?? timestamp
    const percent = Math.min((timestamp - startAt) / 300 /**ms */, 1)
    score.value = oldValue + Math.floor(delta * percent)
    if (percent < 1) {
      requestAnimationFrame(loop)
    }
  }
  requestAnimationFrame(loop)

  if (scoreIncToastRef.value && scoreIncToastParent.value) {
    let scoreInc = scoreIncToastRef.value.cloneNode(true) as HTMLElement | null
    if (scoreInc) {
      scoreInc.textContent = `+${delta}`
      scoreInc.classList.replace('hidden', 'animate-score-sliding')
      scoreInc.addEventListener('animationend', () => {
        scoreInc?.remove()
        scoreInc = null
      })
      scoreIncToastParent.value.appendChild(scoreInc)
    }
  }
})

onMounted(async () => {
  const hasReloaded = await model.tryReloadLastState()
  if (!hasReloaded) {
    newGame()
  }
  const width = model.options.value.boardWidth
  if (width !== modeProps.value.boardWidth) {
    const value = modeConfigs.findIndex(item => item.boardWidth === width)
    modeIndex.value = value !== -1 ? value : 0
  }
})

function newGame() {
  model.init(modeProps.value)
  popupAnimate.value = 'animate-tile-popup-start'
}
</script>

<template>
  <div class="g-2048 text-center" :style="{ '--n': modeProps.boardWidth }">
    <div class="fixed inset-0 bg-[#fffaf0]" />

    <div class="relative select-none inline-flex flex-col gap-3 p-5 py-10">
      <div class="flex items-stretch gap-2 text-white text-sm">
        <div class="tile-2048 flex w-32 items-center justify-center rounded-md">
          <div class="text-3xl font-bold">2048</div>
        </div>
        <div class="ml-auto w-24 rounded-md bg-[#9b8776] p-1 text-[#eee4da]">
          <div>最佳</div>
          <div class="text-lg font-bold">{{ model.bestScore }}</div>
        </div>
        <div class="relative w-24 rounded-md bg-[#9b8776] p-1">
          <div>得分</div>
          <div class="text-lg font-bold">{{ score }}</div>
          <div
            ref="scoreIncToastRef"
            class="absolute right-1 bottom-0 hidden text-lg font-bold"
          />
        </div>
      </div>

      <div class="flex gap-2">
        <div class="self-center text-sm underline underline-offset-4">
          移动方块🎯组合出&nbsp;2048
        </div>
        <button
          class="ml-auto w-24 h-12 flex items-center justify-center rounded-md bg-[#776359] text-lg font-bold text-white outline-none"
          @click="newGame"
        >
          新游戏
        </button>
      </div>

      <div class="relative mx-auto">
        <Board
          ref="boardRef"
          :count="modeProps.boardWidth ** 2"
          :popupAnimate="popupAnimate"
          :tiles="model.tiles.value"
        />
        <Transition name="gg">
          <div
            v-if="isGameOver"
            class="absolute inset-0 flex flex-col items-center justify-center bg-white/60"
          >
            <div class="mb-6 text-5xl font-bold">Game Over</div>
            <button
              class="w-24 h-12 flex items-center justify-center rounded-md bg-[#776359] text-lg font-bold text-white outline-none"
              @click="newGame"
            >
              再来
            </button>
          </div>
        </Transition>
      </div>

      <div class="relative grid grid-cols-3">
        <label for="mode-select" class="sr-only">模式选择</label>
        <select
          v-model="modeIndex"
          id="mode-select"
          class="w-24 py-2 px-4 text-sm outline-none rounded-md hover:shadow-sm"
          @change="newGame"
        >
          <option
            v-for="(item, index) in modeConfigs"
            :key="index"
            :value="index"
          >
            {{ item.label }}
          </option>
        </select>
        <button
          :disabled="!model.canBack()"
          class="place-self-center flex h-10 w-16 items-center justify-center rounded-md transition outline-none hover:shadow-sm disabled:opacity-40 disabled:hover:shadow-none"
          title="撤销上次移动"
          @click="model.back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.2em"
            height="1.2em"
            viewBox="0 0 24 24"
          >
            <!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE -->
            <g
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9a9 9 0 0 0-6 2.3L3 13" />
            </g>
          </svg>
        </button>
        <div
          class="place-self-end h-full pr-1 flex items-center justify-center font-mono text-sm"
          title="移动次数"
        >
          moves: {{ steps }}
        </div>
      </div>

      <Guide class="text-left border-t border-dotted border-gray-300" />
    </div>
  </div>
</template>

<style>
@import '../res/main.css';
</style>
