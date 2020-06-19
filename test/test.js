const assert = require('assert')
const { toHashHex, dblSha2256 } = require('bitcoin-block/classes/class-utils')
const { ZcashBlock, ZcashTransaction, HEADER_BYTES } = require('../')

// the blocks in ./fixtures are a random(ish) sample of blocks from the beginning (including the
// genesis block) to the date of authoring (August 2019), so they cover a good range of formats

function cleanExpectedBlock (obj) {
  // clean up expected data, removing pieces we can't get without additional context
  delete obj.anchor // depends on past blocks
  delete obj.chainhistoryroot // depends on the chain
  delete obj.chainwork // depends on the chain
  delete obj.confirmations // depends on chain context
  delete obj.height // depends on chain, although it may be discernable from the coinbase?
  delete obj.mediantime // depends on past blocks
  delete obj.nextblockhash // content-addressing just doesn't work this way
  delete obj.valuePools // depends on chain
  return obj
}

function cleanTransaction (obj) {
  // TODO: upstream these to zcash
  delete obj.joinSplitPubKey
  delete obj.joinSplitSig
  return obj
}

// round difficulty to 2 decimal places, it's a calculated value
function roundDifficulty (obj) {
  const ret = Object.assign({}, obj)
  ret.difficulty = Math.round(obj.difficulty * 100) / 100
  return ret
}

function verifyHeader (hash, block, expectedComplete) {
  const headerData = block.slice(0, HEADER_BYTES)
  const decodedHeader = ZcashBlock.decodeHeaderOnly(headerData)

  // just the pieces we expect from a header
  const expected = cleanExpectedBlock(Object.assign({}, expectedComplete))
  delete expected.tx
  delete expected.size
  assert.deepStrictEqual(roundDifficulty(decodedHeader.toPorcelain()), roundDifficulty(expected))

  // re-encode
  const encodedHeader = decodedHeader.encode()
  assert.strictEqual(encodedHeader.toString('hex'), headerData.toString('hex'), 're-encoded block header')

  const ebhash = toHashHex(dblSha2256(encodedHeader))
  assert.strictEqual(ebhash, hash, 'header encode hash')

  // instantiate new
  const newHeader = ZcashBlock.fromPorcelain(Object.assign({}, decodedHeader.toPorcelain()))
  assert.deepStrictEqual(roundDifficulty(newHeader.toPorcelain()), roundDifficulty(expected))
  // encode newly instantiated
  const encodedNewHeader = newHeader.encode()
  assert.strictEqual(encodedNewHeader.toString('hex'), headerData.toString('hex'), 're-instantiated and encoded block header')
}

function toMinimalExpected (obj) {
  const ret = Object.assign({}, obj)
  ret.tx = obj.tx.map((tx) => tx.txid)
  return ret
}

function verifyMinimalForm (decoded, expected) {
  const porcelainMin = decoded.toPorcelain('min')
  const minimalExpected = toMinimalExpected(expected)
  assert.deepStrictEqual(roundDifficulty(porcelainMin), roundDifficulty(minimalExpected))
}

function verifyMaximalForm (decoded, expected) {
  const porcelain = decoded.toPorcelain()
  porcelain.tx.forEach(cleanTransaction)
  assert.deepStrictEqual(roundDifficulty(porcelain), roundDifficulty(expected))
}

function verifyTransaction (tx, expectedTx, i) {
  assert.strictEqual(toHashHex(tx.txid), expectedTx.txid)

  // porcelain form correct?
  const serializableTx = cleanTransaction(tx.toPorcelain())
  assert.deepStrictEqual(serializableTx, expectedTx)

  const encodedTx = tx.encode()
  const etxhash = toHashHex(dblSha2256(encodedTx))
  if (etxhash !== expectedTx.txid) {
    console.log('exp', tx.rawBytes.toString('hex'))
    console.log('act', encodedTx.toString('hex'))
  }
  assert.strictEqual(etxhash, expectedTx.txid, `transaction encode hash ${i}`)
  // assert.strictEqual(encodedTx.toString('hex'), expectedTx.hex, `transaction encode raw ${i}`)

  verifyTransactionRoundTrip(tx, expectedTx, i)
}

function verifyTransactionRoundTrip (tx, expectedTx, i) {
  // instantiate new
  const newTransaction = ZcashTransaction.fromPorcelain(Object.assign({}, tx.toPorcelain()))
  const serializableTx = cleanTransaction(newTransaction.toPorcelain())
  assert.deepStrictEqual(roundDifficulty(serializableTx), roundDifficulty(expectedTx))
  // encode newly instantiated
  const encodedNew = newTransaction.encode()
  if (encodedNew.toString('hex') !== newTransaction.rawBytes) {
    console.log('act:', encodedNew.toString('hex'))
    console.log('exp:', newTransaction.rawBytes)
  }
  assert.strictEqual(encodedNew.toString('hex'), newTransaction.rawBytes, `re-instantiated and encoded transaction (${i})`)
}

function verifyMerkleRoot (decoded, expected) {
  const merkleRoot = toHashHex(decoded.calculateMerkleRoot())
  assert.strictEqual(merkleRoot, expected.merkleroot, 'calculated merkle root')
}

function test (hash, block, expected) {
  cleanExpectedBlock(expected)

  // ---------------------------------------------------------------------------
  // verify _only_ the first 1487 bytes and that we can parse basic data
  verifyHeader(hash, block, expected)

  const decoded = ZcashBlock.decode(block, true)

  // ---------------------------------------------------------------------------
  // test the serialized minimum form, where the `tx` array is just the txids
  verifyMinimalForm(decoded, expected)

  // ---------------------------------------------------------------------------
  // sift through each transaction, checking their properties individually and
  // in detail, doing this before testing maximal form shows up errors early and
  // pin-points them
  for (let i = 0; i < expected.tx.length; i++) {
    const tx = decoded.tx[i]
    const expectedTx = expected.tx[i]

    verifyTransaction(tx, expectedTx, i)
  }

  // ---------------------------------------------------------------------------
  // test the serialized maximum form, where the `tx` array the full transaction
  // data, potentially huge
  verifyMaximalForm(decoded, expected)

  // ---------------------------------------------------------------------------
  // check that we can properly calculate the transaction merkle root, this
  // doesn't include witness data
  verifyMerkleRoot(decoded, expected)
}

module.exports = test
