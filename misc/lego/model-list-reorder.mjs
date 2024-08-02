#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises'

const main = async () => {

  const file = './lego/model-list.txt'
  const txt = await readFile(file, { encoding: 'utf-8' })
  const numbers = txt.split(/\s+/).filter(x => !!x)
  const map = new Map()
  for (const x of numbers) {
    if (map.has(x)) {
      const count = map.get(x) + 1
      map.set(x, count)
      console.log(`duplicate(${count}): ${x}`)
    } else {
      map.set(x, 1)
    }
  }

  const ordered = [...map.keys()]
  ordered.sort((a, b) => a < b ? -1 : 1)

  const txt_ordered = ordered.join('\n')
  await writeFile(file, txt_ordered)

  console.log(`reordered entries, duplicates (${numbers.length - ordered.length})`)
}

main()
