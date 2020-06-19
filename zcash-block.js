const { HEADER_BYTES } = require('./classes/class-utils')
const ZcashBlock = require('./classes/Block')
const ZcashTransaction = require('./classes/Transaction')
const coding = require('bitcoin-block/coding')(require('./classes/'))

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

ZcashTransaction.prototype.encode = function (...args) {
  return Buffer.concat([...coding.encodeType(this, args)])
}

module.exports.ZcashBlock = ZcashBlock
module.exports.ZcashBlockHeaderOnly = ZcashBlock.ZcashBlockHeaderOnly
module.exports.ZcashTransaction = ZcashTransaction
module.exports.HEADER_BYTES = HEADER_BYTES
