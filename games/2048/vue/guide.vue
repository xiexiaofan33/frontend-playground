<script setup lang="ts">
import { mode } from '../res/configs.json'
const open = defineModel({ default: false })
</script>

<template>
  <details :open="open">
    <summary
      class="m-2 list-none inline-flex items-center rounded-full p-3 hover:shadow-sm"
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4m0-4h.01" />
        </g>
      </svg>
    </summary>
    <div class="rounded-md border border-gray-300 p-5 bg-white">
      <div class="mb-4 font-bold">模式说明</div>
      <table class="w-full mb-6 text-center text-sm">
        <thead>
          <tr class="border-b border-gray-300">
            <th class="p-2 align-middle">模式</th>
            <th class="p-2 align-middle">初始方块数</th>
            <th class="p-2 align-middle">移动后新增</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in mode" class="border-b border-gray-300">
            <td class="p-2 align-middle">{{ item.label }}</td>
            <td class="p-2 align-middle">{{ item.popupStart }}</td>
            <td class="p-2 align-middle">{{ item.popupMoved }}</td>
          </tr>
        </tbody>
      </table>

      <div class="mb-4 font-bold">结束判断</div>
      <div class="mb-3 text-sm">触发以下任一条件时，游戏结束：</div>
      <ul class="space-y-2 pl-4 text-sm">
        <li class="list-disc">每次移动后，棋盘剩余空位数不够弹出新方块</li>
        <li class="list-disc">弹出方块后，棋盘已满且无法再进行移动合并</li>
      </ul>
    </div>
  </details>
</template>
