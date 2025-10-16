/**
 * 随机打乱数组并截取指定长度返回
 */
export function arrayShuffle<T>(array: T[], length?: number) {
  const sourceLength = array.length
  const targetLength = length
    ? Math.max(0, Math.min(length, sourceLength))
    : sourceLength

  if (sourceLength === 0 || targetLength === 0) return []

  if (targetLength === 1) {
    const randomIndex = Math.floor(Math.random() * sourceLength)
    return [array[randomIndex]]
  }

  for (let i = 0; i < targetLength; i++) {
    const j = i + Math.floor(Math.random() * (sourceLength - i))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.slice(0, targetLength)
}

/**
 * 生成一个介于 min 和 max 之间的随机整数
 * 包含 min、不包含 max
 */
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min
}
