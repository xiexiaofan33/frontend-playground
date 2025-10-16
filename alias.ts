import { lstatSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('.', import.meta.url))

export const ROOT_DIR = r()
export const GAME_DIR = r('games')

export const gameAlias = globSubDirAlias(GAME_DIR)

function r(p = '', base = root) {
  return resolve(base, p).replace(/\\/g, '/')
}

function globSubDirAlias(dir: string, prefix = '@') {
  try {
    return Object.fromEntries(
      readdirSync(dir)
        .filter(p => lstatSync(r(p, dir)).isDirectory())
        .map(sub => [`${prefix}/${sub}`, `${dir}/${sub}`]),
    )
  } catch (error) {
    console.error(error)
    return {}
  }
}
