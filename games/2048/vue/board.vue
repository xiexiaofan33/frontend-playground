<script setup lang="ts">
import Tile from './tile.vue'
import type { TileState } from '../model'

defineProps<{
  count: number
  popupAnimate: string
  tiles: Readonly<TileState[]>
}>()
</script>

<template>
  <div
    class="relative w-fit rounded-md bg-[#9b8776] p-[var(--gap)]"
    @touchmove.prevent
  >
    <div class="grid grid-cols-[repeat(var(--n),1fr)] gap-[var(--gap)]">
      <div
        v-for="_ in count"
        class="size-[var(--size)] rounded-sm bg-[#bdac97]"
      />
      <div class="absolute inset-[var(--gap)] text-[length:var(--size)]">
        <div
          v-for="{ id, x, y, value } in tiles"
          :key="id"
          :style="{
            '--x': `calc(var(--size) * ${x} + var(--gap) * ${x})`,
            '--y': `calc(var(--size) * ${y} + var(--gap) * ${y})`,
          }"
          class="absolute size-[var(--size)] translate-x-[var(--x)] translate-y-[var(--y)] transition-transform"
        >
          <Tile :value="value" :popup-animate="popupAnimate" />
        </div>
      </div>
    </div>
  </div>
</template>
