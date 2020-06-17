const ZcashBlock = require('./classes/Block')
const coding = require('bitcoin-block/coding')(require('./classes/'))

ZcashBlock.decode = function decodeBlock (buf, strictLengthUsage) {
  return coding.decodeType(buf, 'CBlockHeader', strictLengthUsage)
}

ZcashBlock.decodeHeaderOnly = function decodeBlockHeaderOnly (buf, strictLengthUsage) {
  return coding.decodeType(buf, 'CBlockHeader__Only', strictLengthUsage)
}

module.exports.ZcashBlock = ZcashBlock
module.exports.ZcashBlockHeaderOnly = ZcashBlock.ZcashBlockHeaderOnly
