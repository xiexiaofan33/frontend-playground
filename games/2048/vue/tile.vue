<script setup lang="ts">
import { ref, watch } from 'vue'

const { value, popupAnimate = 'animate-tile-popup' } = defineProps<{
  value: number
  popupAnimate?: string
}>()

const animateCls = ref(popupAnimate)
watch(
  () => value,
  () => (animateCls.value = 'animate-tile-merge'),
)
</script>

<template>
  <div
    :class="[
      'tile-base flex size-full items-center justify-center rounded-sm font-bold',
      `tile-${value}`,
      animateCls,
    ]"
    @animationend="animateCls = ''"
  >
    {{ value }}
  </div>
</template>
