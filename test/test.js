const assert = require('assert')
const ZcashBlock = require('../')

// the blocks in ./fixtures are a random(ish) sample of blocks from the beginning (including the
// genesis block) to the date of authoring (August 2019), so they cover a good range of formats
//
module.exports = function test (hash, block, data) {
  const decoded = ZcashBlock.decode(block)
  const serializable = decoded.toSerializable()
  // console.log('decoded', JSON.stringify(serializable, null, 2))

  // check difficulty separately, floating point is hard
  assert.ok(Math.abs(serializable.difficulty - data.difficulty) < 0.00000001, `decoded difficulty=${serializable.difficulty}, expected difficulty=${data.difficulty}`)
  serializable.difficulty = Math.round(serializable.difficulty)
  data.difficulty = Math.round(data.difficulty)

  // can't test these things as they come from having a full blockchain state to work with
  // while we are only working with isolated blocks
  'anchor height chainwork confirmations valuePools nextblockhash'.split(' ').forEach((p) => { delete data[p] })

  assert.deepStrictEqual(serializable, data)
}
