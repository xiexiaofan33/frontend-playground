<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { useBoardEvent } from './use'
import Cell from './cell.vue'
import type { CellAction, CellState } from '../model'
import type { SettingOptions } from '../helper'

const props = defineProps<{
  settings: SettingOptions
  cellGrid: CellState[][]
  getAroundCells: (cell: CellState) => CellState[]
}>()

const emit = defineEmits<{
  operate: [cell: CellState, action: CellAction, openAround?: boolean]
}>()

const boardRef = useTemplateRef<HTMLElement>('boardRef')
const { pointerPosition, enableHighlight } = useBoardEvent(boardRef, action => {
  const cell = hoveredCell.value
  if (cell) {
    const openAround =
      action === 'flag' && cell.open ? false : props.settings.fastMode
    action = action === 'open' && props.settings.flagMode ? 'flag' : action
    emit('operate', cell, action, openAround)
  }
})

const hoveredCell = computed(() => {
  const { x, y } = pointerPosition.value
  const { size, gap } = props.settings
  const cellPitch = size + gap
  const row = Math.floor(y / cellPitch)
  const col = Math.floor(x / cellPitch)
  if (
    gap === 0 ||
    (x - col * cellPitch <= size && y - row * cellPitch <= size)
  ) {
    return props.cellGrid[row]?.[col]
  }
})

const highlightCells = computed(() => {
  const cell = hoveredCell.value
  if (!cell || cell.flag || !enableHighlight.value) {
    return
  }
  if (!cell.open) {
    return [cell]
  }
  return props.getAroundCells(cell).filter(c => !c.open && !c.flag)
})
</script>

<template>
  <div
    ref="boardRef"
    :style="{
      '--gap': `${settings.gap}px`,
      '--size': `${settings.size}px`,
      '--radius': `${settings.radius}px`,
    }"
    class="flex max-w-full flex-col gap-y-[var(--gap)] overflow-auto"
  >
    <div v-for="(row, y) in cellGrid" :key="y" class="flex gap-x-[var(--gap)]">
      <div
        v-for="(cell, x) in row"
        :key="x"
        class="size-[var(--size)] text-[length:var(--size)] shrink-0"
      >
        <Cell
          v-bind="cell"
          :colorKey="settings.colorKey"
          :highlight="highlightCells?.includes(cell)"
        />
      </div>
    </div>
  </div>
</template>
