const fs = require('fs').promises
const path = require('path')
const test = require('./test')

async function run () {
  const name = (await fs.readdir(path.join(__dirname, 'fixtures')))
    .map((f) => f.endsWith('.hex') && f.substring(0, f.length - 4))
    .filter(Boolean)
  const fixtures = []

  for (const hash of name) {
    fixtures.push({
      hash,
      block: Buffer.from(await fs.readFile(path.join(__dirname, 'fixtures', `${hash}.hex`), 'utf8'), 'hex'),
      data: require(path.join(__dirname, 'fixtures', `${hash}.json`))
    })
  }

  return test(fixtures)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
}).then(() => {
  console.log('😀👌')
})
