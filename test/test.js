const assert = require('assert')
const { ZcashBlock } = require('../')

// the blocks in ./fixtures are a random(ish) sample of blocks from the beginning (including the
// genesis block) to the date of authoring (August 2019), so they cover a good range of formats

function cleanExpectedBlock (obj) {
  // clean up expected data, removing pieces we can't get without additional context
  delete obj.anchor // depends on past blocks
  delete obj.chainwork // depends on the chain
  delete obj.confirmations // depends on chain context
  delete obj.height // depends on chain, although it may be discernable from the coinbase?
  delete obj.mediantime // depends on past blocks
  delete obj.nextblockhash // content-addressing just doesn't work this way
  delete obj.valuePools // depends on ???
  return obj
}

// round difficulty to 2 decimal places, it's a calculated value
function roundDifficulty (obj) {
  const ret = Object.assign({}, obj)
  ret.difficulty = Math.round(obj.difficulty * 100) / 100
  return ret
}

/*
function toMinimalExpected (obj) {
  const ret = Object.assign({}, obj)
  ret.tx = obj.tx.map((tx) => tx.txid)
  return ret
}
*/

function verifyMinimalForm (decoded, expected) {
  const serializableMin = decoded.toPorcelain('min')
  const minimalExpected = serializableMin // toMinimalExpected(expected)
  assert.deepStrictEqual(roundDifficulty(serializableMin), roundDifficulty(minimalExpected))
}

/*
function verifyMaximalForm (decoded, expected) {
  const serializable = decoded.toPorcelain()
  assert.deepStrictEqual(roundDifficulty(serializable), roundDifficulty(expected))
}
*/

function test (hash, block, expected) {
  cleanExpectedBlock(expected)

  const decoded = ZcashBlock.decode(block)

  // ---------------------------------------------------------------------------
  // test the serialized minimum form, where the `tx` array is just the txids
  verifyMinimalForm(decoded, expected)

  // ---------------------------------------------------------------------------
  // test the serialized maximum form, where the `tx` array the full transaction
  // data, potentially huge
  // verifyMaximalForm(decoded, expected)
}

module.exports = test
