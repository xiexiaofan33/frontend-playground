<script setup lang="ts">
import { computed } from 'vue'
import { themeHelper, type BgColorKey } from '../helper'
import type { CellState } from '../model'

const { colorKey, highlight, ...cell } = defineProps<
  CellState & { colorKey: BgColorKey; highlight?: boolean }
>()

const state = computed<{
  txt: string | number
  cls: string
  styles?: Record<string, string>
}>(() => {
  if (!cell.open) {
    return {
      txt: cell.flag ? themeHelper.getEmoji('flag') : '',
      cls: themeHelper.getBgColor(colorKey, highlight),
    }
  }
  if (cell.boom) {
    return {
      txt: themeHelper.getEmoji('boom'),
      cls: 'bg-red-600 border-transparent',
    }
  }
  if (cell.flag) {
    return {
      txt: themeHelper.getEmoji('flag'),
      cls: cell.mine
        ? themeHelper.getBgColor(colorKey)
        : 'bg-red-300 border-transparent',
    }
  }
  if (cell.mine) {
    return {
      txt: themeHelper.getEmoji('mine'),
      cls: themeHelper.getBgColor(colorKey, true),
    }
  }

  return {
    txt: cell.aroundMineCount ?? '',
    cls: themeHelper.getBgColor(colorKey, true),
    styles: { color: themeHelper.getFgColor(cell.aroundMineCount!) },
  }
})
</script>

<template>
  <div
    :class="[
      'flex size-full items-center justify-center rounded-[var(--radius)] border bg-gradient-to-br text-[50%] transition-[background-color] font-bold',
      state.cls,
    ]"
    :style="state.styles"
  >
    {{ state.txt }}
  </div>
</template>
