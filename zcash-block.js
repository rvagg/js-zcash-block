const { HEADER_BYTES, COIN } = require('./classes/class-utils')
const ZcashBlock = require('./classes/Block')
const ZcashTransaction = require('./classes/Transaction')
const coding = require('bitcoin-block/coding')(require('./classes/'))
const { toHashHex, fromHashHex, dblSha2256, merkle, merkleRoot } = require('bitcoin-block/classes/class-utils')

ZcashBlock.decode = function decodeBlock (buf, strictLengthUsage) {
  return coding.decodeType(buf, 'CBlockHeader', strictLengthUsage)
}

ZcashBlock.decodeHeaderOnly = function decodeBlockHeaderOnly (buf, strictLengthUsage) {
  return coding.decodeType(buf, 'CBlockHeader__Only', strictLengthUsage)
}

ZcashBlock.prototype.encode = function (...args) {
  return Buffer.concat([...coding.encodeType(this, args)])
}

ZcashBlock.ZcashBlockHeaderOnly.prototype.encode = function (...args) {
  return Buffer.concat([...coding.encodeType(this, args)])
}

ZcashTransaction.decode = function decodeTransaction (buf, strictLengthUsage) {
  return coding.decodeType(buf, 'CTransaction', strictLengthUsage)
}

ZcashTransaction.prototype.encode = function (...args) {
  return Buffer.concat([...coding.encodeType(this, args)])
}

module.exports.ZcashBlock = ZcashBlock
module.exports.ZcashBlockHeaderOnly = ZcashBlock.ZcashBlockHeaderOnly
module.exports.ZcashTransaction = ZcashTransaction
module.exports.HEADER_BYTES = HEADER_BYTES
module.exports.toHashHex = toHashHex
module.exports.fromHashHex = fromHashHex
module.exports.COIN = COIN
module.exports.dblSha2256 = dblSha2256
module.exports.merkle = merkle
module.exports.merkleRoot = merkleRoot
