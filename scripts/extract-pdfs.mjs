import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
/** @type {(buf: Buffer) => Promise<{ text: string }>} */
const pdf = require('pdf-parse')

const files = [
  'C:/Users/Bülent/Downloads/Kira_Sozlesmesi.pdf',
  'C:/Users/Bülent/Downloads/ALIM-SATIM.pdf',
  'C:/Users/Bülent/Downloads/YETKI-SOZLESMESI.pdf',
  'C:/Users/Bülent/Downloads/YER-GOSTERME-TUTANAGI.pdf',
]

for (const path of files) {
  try {
    const buf = fs.readFileSync(path)
    const data = await pdf(buf)
    console.log('\n\n==========', path, '==========\n')
    console.log(data.text.slice(0, 25000))
  } catch (e) {
    console.error(path, e.message)
  }
}
