import * as fs from 'fs'
import * as path from 'path'
import * as axe from 'axe-core'

const saveOutcome = (outcome: axe.Result[], fileName: string, dir: string) => {
  return new Promise((resolve, reject) => {
    if (!path.isAbsolute(dir)) {
      dir = path.join(process.cwd(), dir)
    }

    const filePath = path.join(dir, fileName)
    fs.writeFile(filePath, JSON.stringify(outcome, null, '  '), 'utf8', err => {
      if (err) {
        reject(err)
      } else {
        resolve(filePath)
      }
    })
  })
}

export default saveOutcome
