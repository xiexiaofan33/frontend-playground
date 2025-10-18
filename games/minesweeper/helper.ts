import { defaultSettings } from './res/configs.json'
import themePreset from './res/theme.json'

export type EmojiKey = keyof (typeof themePreset)['emojis']
export type BgColorKey = keyof (typeof themePreset)['bgColors']
export type FgColorKey = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export interface ThemeConfig {
  emojis: Record<EmojiKey, string>
  fgColors: Record<FgColorKey, string>
  bgColors: Record<BgColorKey, [string /**default */, string /**highlight */]>
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj)
    for (const key of Object.getOwnPropertyNames(obj)) {
      // @ts-ignore index signature for runtime walk
      const val = (obj as any)[key]
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        deepFreeze(val)
      }
    }
  }
  return obj
}

class ThemeHelper {
  private config: ThemeConfig
  private bgColorKeys: BgColorKey[]

  constructor(config: ThemeConfig) {
    this.config = config
    this.bgColorKeys = Object.keys(config.bgColors) as BgColorKey[]
  }

  static validate(config: ThemeConfig) {
    // Ensure each bgColors entry is a length-2 tuple of strings
    for (const k of Object.keys(config.bgColors) as BgColorKey[]) {
      const v = config.bgColors[k]
      if (
        !Array.isArray(v) ||
        v.length !== 2 ||
        typeof v[0] !== 'string' ||
        typeof v[1] !== 'string'
      ) {
        throw new Error(
          `Invalid bgColors[${String(k)}], expected [string, string]`,
        )
      }
    }
    // Ensure there are fgColors entries for 0..8 (string keys)
    const fgKeys = Object.keys(config.fgColors)
    for (let i = 0; i <= 8; i++) {
      if (!(String(i) in config.fgColors)) {
        throw new Error(`Missing fgColors key: ${i}`)
      }
    }
    // Ensure default colorKey in configs is valid
    const defaultColorKey = defaultSettings?.colorKey as unknown as BgColorKey
    if (!(defaultColorKey in config.bgColors)) {
      throw new Error(
        `defaultSettings.colorKey (${String(defaultColorKey)}) is not a valid BgColorKey`,
      )
    }
  }

  getEmoji(key: EmojiKey) {
    return this.config.emojis[key]
  }

  getBgColor(key: BgColorKey, isHighlight?: boolean) {
    const [highlight, normal] = this.config.bgColors[key]
    return isHighlight ? highlight : normal
  }

  getFgColor(key: FgColorKey) {
    return this.config.fgColors[key]
  }

  getAllBgColorKeys() {
    return [...this.bgColorKeys]
  }

  getRandomBgColorKey(exclude?: BgColorKey) {
    if (this.bgColorKeys.length <= 1) {
      return this.bgColorKeys[0]
    }
    const keys = this.bgColorKeys.filter(key => key !== exclude)
    const picked = Math.floor(Math.random() * keys.length)
    return keys[picked]
  }
}

const frozenTheme: ThemeConfig = deepFreeze(
  themePreset as unknown as ThemeConfig,
)

ThemeHelper.validate(frozenTheme)
export const themeHelper = new ThemeHelper(frozenTheme)

/**
 * ----------------------------------------------------------------------------
 * Settings
 * ----------------------------------------------------------------------------
 */
type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type SettingOptions = Prettify<
  Omit<typeof defaultSettings, 'colorKey'> & {
    colorKey: BgColorKey
  }
>

export function getDefaultSettings() {
  return { ...defaultSettings } as SettingOptions
}
