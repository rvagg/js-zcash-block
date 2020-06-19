const multihashing = require('multihashing')
const {
  HEADER_BYTES,
  decodeProperties,
  toHashHex,
  fromHashHex,
  isHexString,
  dblSha2256,
  merkleRoot
} = require('bitcoin-block/classes/class-utils')

const GENESIS_BITS = 0x1f07ffff

/**
 * A class representation of a Zcash Block, parent for all of the data included in the raw block data
 * in addition to some information that can be calculated based on that data. Properties are intended to
 * match the names that are provided by the Zcash API (hence the casing and some strange names).
 *
 * Exported as the main object, available as `require('zcash-block')`.
 *
 * @property {number} version - positive integer
 * @property {Uint8Array|Buffer} previousblockhash - 256-bit hash
 * @property {Uint8Array|Buffer} merkleroot - 256-bit hash
 * @property {Uint8Array|Buffer} finalsaplingroot - 256-bit hash
 * @property {number} time - seconds since epoch
 * @property {number} bits
 * @property {Uint8Array|Buffer} nonce - 256-bit hash
 * @property {Uint8Array|Buffer} solution
 * @property {Uint8Array|Buffer} hash - 256-bit hash, a double SHA2-256 hash of all bytes making up this block (calculated)
 * @property {Array.<ZcashTransaction>} tx
 * @property {number} difficulty - the difficulty for this block (calculated)
 * @class
 */

class ZcashBlock {
  /**
   * Instantiate a new `ZcashBlock`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {number} version
   * @param {Uint8Array|Buffer} previousblockhash
   * @param {Uint8Array|Buffer} merkleroot
   * @param {Uint8Array|Buffer} finalsaplingroot
   * @param {number} time
   * @param {number} bits
   * @param {Uint8Array|Buffer} nonce
   * @param {Uint8Array|Buffer} solution
   * @param {Uint8Array|Buffer} hash
   * @param {Array.<ZcashTransaction>} tx
   * @constructs ZcashBlock
   */
  constructor (version, previousblockhash, merkleroot, finalsaplingroot, time, bits, nonce, solution, hash, tx, size) {
    this.version = version
    this.previousblockhash = previousblockhash
    this.merkleroot = merkleroot
    this.finalsaplingroot = finalsaplingroot
    this.time = time
    this.bits = bits
    this.nonce = nonce
    this.solution = solution
    this.hash = hash
    this.tx = tx
    this.size = size

    let difficulty = null
    Object.defineProperty(this, 'difficulty', {
      enumerable: true,
      get: function () {
        if (difficulty === null) {
          const genesisTargetDifficulty = targetDifficulty(GENESIS_BITS)
          const currentTargetDifficulty = targetDifficulty(this.bits)
          difficulty = genesisTargetDifficulty / currentTargetDifficulty
        }
        return difficulty
      }
    })
  }

  toJSON (_, type) {
    const obj = {
      hash: toHashHex(this.hash),
      version: this.version,
      merkleroot: toHashHex(this.merkleroot),
      finalsaplingroot: toHashHex(this.finalsaplingroot),
      time: this.time,
      nonce: toHashHex(this.nonce),
      solution: this.solution.toString('hex'),
      bits: Number(this.bits).toString(16),
      difficulty: this.difficulty
    }

    const previousblockhash = toHashHex(this.previousblockhash)
    if (!/^0+$/.test(previousblockhash)) { // not genesis block?
      obj.previousblockhash = previousblockhash
    }

    if (type === 'header' || this.size === undefined || !this.tx) {
      return obj
    }

    obj.size = this.size
    if (type === 'min') {
      obj.tx = this.tx.map((tx) => toHashHex(tx.txid))
    } else {
      obj.tx = this.tx.map((tx) => tx.toJSON())
    }

    return obj
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   */
  toPorcelain (type) {
    return this.toJSON(null, type)
  }

  calculateMerkleRoot () {
    if (!this.tx || !this.tx.length) {
      throw new Error('Cannot calculate merkle root without transactions')
    }
    const hashes = this.tx.map((tx) => tx.txid)
    return merkleRoot(hashes)
  }
}

ZcashBlock.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashBlock porcelain must be an object')
  }
  if (porcelain.previousblockhash != null) {
    if (typeof porcelain.previousblockhash !== 'string' || !isHexString(porcelain.previousblockhash, 64)) {
      throw new Error('previousblockhash property should be a 64-character hex string')
    }
  } // else assume genesis
  if (typeof porcelain.version !== 'number') {
    throw new TypeError('version property must be a number')
  }
  if (typeof porcelain.merkleroot !== 'string' || !isHexString(porcelain.merkleroot, 64)) {
    throw new Error('merkleroot property should be a 64-character hex string')
  }
  if (typeof porcelain.finalsaplingroot !== 'string' || !isHexString(porcelain.finalsaplingroot, 64)) {
    throw new Error('finalsaplingroot property should be a 64-character hex string')
  }
  if (typeof porcelain.time !== 'number') {
    throw new TypeError('time property must be a number')
  }
  if (typeof porcelain.nonce !== 'string' || !isHexString(porcelain.nonce, 64)) {
    throw new Error('nonce property should be a 64-character hex string')
  }
  if (typeof porcelain.bits !== 'string' && !/^[0-9a-f]+$/.test(porcelain.bits)) {
    throw new TypeError('bits property must be a hex string')
  }
  if (typeof porcelain.solution !== 'string' || !isHexString(porcelain.solution, 1344 * 2)) {
    throw new Error(`solution property should be a ${1344 * 2}-character hex string`)
  }
  let tx
  /*
  if (porcelain.tx) {
    if (!Array.isArray(porcelain.tx)) {
      throw new TypeError('tx property must be an array')
    }
    tx = porcelain.tx.map(ZcashTransaction.fromPorcelain)
  }
  */

  const block = new ZcashBlock(
    porcelain.version,
    porcelain.previousblockhash ? fromHashHex(porcelain.previousblockhash) : Buffer.alloc(32),
    fromHashHex(porcelain.merkleroot),
    fromHashHex(porcelain.finalsaplingroot),
    porcelain.time,
    parseInt(porcelain.bits, 16),
    fromHashHex(porcelain.nonce),
    Buffer.from(porcelain.solution, 'hex'),
    null, // hash
    tx
  )

  // calculate the hash for this block
  // this comes from ../zcash-block, if it's not instantiated via there then it won't be available
  if (typeof block.encode !== 'function') {
    throw new Error('Block#encode() not available')
  }
  const rawData = block.encode()
  block.hash = dblSha2256(rawData.slice(0, HEADER_BYTES))
  if (tx) {
    block.size = rawData.length
    block._calculateStrippedSize()
    block._calculateWeight()
  }

  return block
}

function targetDifficulty (bits) {
  var target = bits & 0xffffff
  var mov = 8 * ((bits >>> 24) - 3)
  while (mov-- > 0) {
    target *= 2
  }
  return target
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashBlock._nativeName = 'CBlockHeader'
// https://github.com/zcash/zcash/blob/fa1b656482a38d3a6c97950b35521a9c45da1e9c/src/primitives/block.h#L26
ZcashBlock._decodePropertiesDescriptor = decodeProperties(`
_customDecoderMarkStart
int32_t nVersion;
uint256 hashPrevBlock;
uint256 hashMerkleRoot;
uint256 hashFinalSaplingRoot;
uint32_t nTime;
uint32_t nBits;
uint256 nNonce;
std::vector<unsigned char> nSolution;
_customDecodeHash
std::vector<CTransaction> transactions;
_customDecodeSize
`)

ZcashBlock._customDecoderMarkStart = function (decoder, properties, state) {
  state.blockStartPos = decoder.currentPosition()
}

ZcashBlock._customDecodeHash = function (decoder, properties, state) {
  const start = state.blockStartPos
  const end = decoder.currentPosition()
  const hashBytes = decoder.absoluteSlice(start, end - start)
  // double hash
  let digest = multihashing.digest(hashBytes, 'sha2-256')
  digest = multihashing.digest(digest, 'sha2-256')
  properties.push(digest)
}

ZcashBlock._customDecodeSize = function (decoder, properties, state) {
  const start = state.blockStartPos
  const end = decoder.currentPosition()
  const size = end - start
  properties.push(size)
}

ZcashBlock._encodePropertiesDescriptor = decodeProperties(`
int32_t version;
uint256 previousblockhash;
uint256 merkleroot;
uint256 finalsaplingroot;
uint32_t time;
uint32_t bits;
uint256 nonce;
std::vector<unsigned char> solution;
_customEncodeTransactions
`)

ZcashBlock._customEncodeTransactions = function * (block, encoder, args) {
  if (Array.isArray(block.tx)) {
    yield * encoder('std::vector<CTransaction>', block.tx, args)
  }
}

class ZcashBlockHeaderOnly extends ZcashBlock {}
ZcashBlockHeaderOnly._nativeName = 'CBlockHeader__Only'
// properties is the same, minus the last two for transactions & size
ZcashBlockHeaderOnly._decodePropertiesDescriptor = decodeProperties(`
_customDecoderMarkStart
int32_t nVersion;
uint256 hashPrevBlock;
uint256 hashMerkleRoot;
uint256 hashFinalSaplingRoot;
uint32_t nTime;
uint32_t nBits;
uint256 nNonce;
std::vector<unsigned char> nSolution;
_customDecodeHash
`)
ZcashBlockHeaderOnly._customDecoderMarkStart = ZcashBlock._customDecoderMarkStart
ZcashBlockHeaderOnly._customDecodeHash = ZcashBlock._customDecodeHash

ZcashBlockHeaderOnly._encodePropertiesDescriptor = decodeProperties(`
int32_t version;
uint256 previousblockhash;
uint256 merkleroot;
uint256 finalsaplingroot;
uint32_t time;
uint32_t bits;
uint256 nonce;
std::vector<unsigned char> solution;
`)

module.exports = ZcashBlock
module.exports.ZcashBlockHeaderOnly = ZcashBlockHeaderOnly
