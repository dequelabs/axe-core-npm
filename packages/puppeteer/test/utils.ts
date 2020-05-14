import { Spec } from 'axe-core'
import * as fsOrig from 'fs'
import * as path from 'path'
import { promisify } from 'util'

const fs = {
  readFile: promisify(fsOrig.readFile)
}

export function fixtureFilePath(filename: string): string {
  return path.resolve(__dirname, 'fixtures', filename)
}

export async function customConfig() {
  const configFile = fixtureFilePath('custom-rule-config.json')
  const config = JSON.parse(
    await fs.readFile(configFile, 'utf8')
  ) as Spec
  return config
}
