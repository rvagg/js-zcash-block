const { decodeProperties, toHashHex, dblSha2256, isHexString } = require('bitcoin-block/classes/class-utils')
const { COIN } = require('./class-utils')
const ZcashTransactionIn = require('./TransactionIn')
const ZcashTransactionOut = require('./TransactionOut')
const ZcashOutputDescription = require('./OutputDescription')
const ZcashSpendDescription = require('./SpendDescription')
const ZcashJoinSplitDescription = require('./JoinSplitDescription')

const OVERWINTER_TX_VERSION = 3
const SAPLING_TX_VERSION = 4
const OVERWINTER_VERSION_GROUP_ID = 0x03C48270
const SAPLING_VERSION_GROUP_ID = 0x892F2085
const NULL_HASH = Buffer.alloc(32)

/**
 * A class representation of a Zcash Transaction, multiple of which are contained within each {@link ZcashBlock}.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/Transaction')`.
 *
 * @property {boolean} overwintered
 * @property {number} version
 * @property {number} versiongroupid
 * @property {Array.<ZcashTransactionIn>} vin
 * @property {Array.<ZcashTransactionIn>} vout
 * @property {number} locktime
 * @property {number|null} expiryheight - only present in certain block formats
 * @property {BigInt|null} valueBalanceZat - only present in certain block formats
 * @property {Array.<ZcashSpendDescription>|null} vShieldedSpend - only present in certain block formats
 * @property {Array.<ZcashOutputDescription>|null} vShieldedOutput - only present in certain block formats
 * @property {Uint8Array|Buffer|null} joinSplitPubKey - a 256-bit hash - only present in certain block formats
 * @property {Array.<ZcashJoinSplitDescription>|null} vjoinsplit - only present in certain block formats
 * @property {Uint8Array|Buffer|null} joinSplitSig - a 512-bit signature - only present in certain block formats
 * @property {Uint8Array|Buffer|null} bindingSig - a 512-bit signature - only present in certain block formats
 * @property {Uint8Array|Buffer} txid - 256-bit hash, a double SHA2-256 hash of all bytes making up this block (calculated)
 * @class
 */
class ZcashTransaction {
  /**
   * Instantiate a new `ZcashTransaction`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @property {boolean} overwintered
   * @property {number} version
   * @property {number} versiongroupid
   * @property {Array.<ZcashTransactionIn>} vin
   * @property {Array.<ZcashTransactionIn>} vout
   * @property {number} locktime
   * @property {number|null} expiryheight
   * @property {BigInt|null} valueBalanceZat
   * @property {Array.<ZcashSpendDescription>|null} vShieldedSpend
   * @property {Array.<ZcashOutputDescription>|null} vShieldedOutput
   * @property {Uint8Array|Buffer|null} joinSplitPubKey
   * @property {Array.<ZcashJoinSplitDescription>|null} vjoinsplit
   * @property {Uint8Array|Buffer|null} joinSplitSig
   * @property {Uint8Array|Buffer|null} bindingSig
   * @property {Uint8Array|Buffer} txid
   * @constructs ZcashTransaction
   */
  constructor (overwintered, version, versiongroupid, vin, vout, locktime, expiryheight, valueBalanceZat, vShieldedSpend, vShieldedOutput, vjoinsplit, joinSplitPubKey, joinSplitSig, bindingSig, rawBytes, txid) {
    this.overwintered = overwintered
    this.version = version
    this.versiongroupid = versiongroupid
    this.vin = vin
    this.vout = vout
    this.locktime = locktime
    this.expiryheight = expiryheight
    this.valueBalanceZat = valueBalanceZat
    this.vShieldedSpend = vShieldedSpend
    this.vShieldedOutput = vShieldedOutput
    this.joinSplitPubKey = joinSplitPubKey
    this.vjoinsplit = vjoinsplit
    this.joinSplitSig = joinSplitSig
    this.bindingSig = bindingSig
    this.rawBytes = rawBytes
    this.txid = txid
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   */
  toJSON () {
    const coinbase = this.isCoinbase()

    const obj = {
      txid: toHashHex(this.txid),
      overwintered: this.overwintered,
      version: this.version,
      locktime: this.locktime,
      vjoinsplit: this.vjoinsplit.map((js) => js.toJSON()),
      vin: this.vin.map((vin) => vin.toJSON(null, coinbase)),
      vout: this.vout.map((vout, n) => vout.toJSON(n))
    }

    if (this.overwintered) {
      obj.expiryheight = this.expiryheight
      obj.versiongroupid = this.versiongroupid.toString(16).padStart(8, '0')
    }

    if (this.valueBalanceZat !== null) {
      obj.valueBalance = (Number(this.valueBalanceZat) / COIN)
      obj.valueBalanceZat = this.valueBalanceZat
      obj.vShieldedSpend = this.vShieldedSpend.map((ss) => ss.toJSON())
      obj.vShieldedOutput = this.vShieldedOutput.map((so) => so.toJSON())
    }

    if (this.joinSplitSig && this.joinSplitPubKey) {
      obj.joinSplitSig = this.joinSplitSig.toString('hex')
      obj.joinSplitPubKey = this.joinSplitPubKey.toString('hex')
    }

    if (this.bindingSig) {
      obj.bindingSig = this.bindingSig.toString('hex')
    }

    return obj
  }

  /**
  * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
  * useful for simplified inspection.
  */
  toPorcelain () {
    return this.toJSON()
  }

  isCoinbase () {
    return this.vin &&
      this.vin.length === 1 &&
      this.vin[0].prevout &&
      this.vin[0].prevout &&
      NULL_HASH.equals(this.vin[0].prevout.hash)
  }
}

ZcashTransaction.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashTransaction porcelain must be an object')
  }
  if (typeof porcelain.overwintered !== 'boolean') {
    throw new TypeError('overwintered property must be a boolean')
  }
  if (typeof porcelain.version !== 'number') {
    throw new TypeError('version property must be a number')
  }
  if (porcelain.overwintered && typeof porcelain.versiongroupid !== 'string') {
    throw new TypeError('versiongroupid property must be a string')
  }
  const versiongroupid = !porcelain.overwintered ? 0 : parseInt(porcelain.versiongroupid, 16)
  if (typeof porcelain.locktime !== 'number') {
    throw new TypeError('locktime property must be a number')
  }
  if (porcelain.overwintered && typeof porcelain.expiryheight !== 'number') {
    throw new TypeError('expiryheight property must be a number')
  }
  const expiryheight = !porcelain.overwintered ? 0 : porcelain.expiryheight
  if (!Array.isArray(porcelain.vin)) {
    throw new TypeError('vin property must be an array')
  }
  if (!Array.isArray(porcelain.vout)) {
    throw new TypeError('vin property must be an array')
  }

  const vin = porcelain.vin.map(ZcashTransactionIn.fromPorcelain)
  const vout = porcelain.vout.map(ZcashTransactionOut.fromPorcelain)

  let valueBalanceZat = null
  let vShieldedSpend = null
  let vShieldedOutput = null

  if (typeof porcelain.valueBalanceZat === 'number') {
    valueBalanceZat = porcelain.valueBalanceZat
  }
  if (Array.isArray(porcelain.vShieldedSpend)) {
    vShieldedSpend = porcelain.vShieldedSpend.map(ZcashSpendDescription.fromPorcelain)
  }
  if (Array.isArray(porcelain.vShieldedOutput)) {
    vShieldedOutput = porcelain.vShieldedOutput.map(ZcashOutputDescription.fromPorcelain)
  }

  let vjoinsplit = []
  let joinSplitPubKey = null
  let joinSplitSig = null

  if (Array.isArray(porcelain.vjoinsplit)) {
    vjoinsplit = porcelain.vjoinsplit.map(ZcashJoinSplitDescription.fromPorcelain)
  }
  if (isHexString(porcelain.joinSplitPubKey)) {
    joinSplitPubKey = Buffer.from(porcelain.joinSplitPubKey, 'hex')
  }
  if (isHexString(porcelain.joinSplitSig)) {
    joinSplitSig = Buffer.from(porcelain.joinSplitSig, 'hex')
  }

  let bindingSig = null

  if (isHexString(porcelain.bindingSig)) {
    bindingSig = Buffer.from(porcelain.bindingSig, 'hex')
  }

  const transaction = new ZcashTransaction(
    porcelain.overwintered,
    porcelain.version,
    versiongroupid,
    vin,
    vout,
    porcelain.locktime,
    expiryheight,
    valueBalanceZat,
    vShieldedSpend,
    vShieldedOutput,
    vjoinsplit,
    joinSplitPubKey,
    joinSplitSig,
    bindingSig)

  // calculate the hash for this block
  // this comes from ../bitcoin-block, if it's not instantiated via there then it won't be available
  if (typeof transaction.encode !== 'function') {
    throw new Error('Transaction#encode() not available')
  }
  const rawBytes = transaction.encode()
  transaction.rawBytes = rawBytes.toString('hex')
  transaction.txid = dblSha2256(rawBytes)
  return transaction
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashTransaction._nativeName = 'CTransaction'
ZcashTransaction._decodePropertiesDescriptor = decodeProperties(`
_customDecodeVersionAndGroup
const std::vector<CTxIn> vin;
const std::vector<CTxOut> vout;
const uint32_t nLockTime;
_customDecodeExpiryHeight
_customDecodeBalanceAndShielded
_customDecodeJoinSplit
_customDecodeBindingSig
_customDecodeBytes
_customDecodeHash
`)

// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L576-L600
ZcashTransaction._customDecodeVersionAndGroup = function (decoder, properties, state) {
  state.transactionStartPos = decoder.currentPosition()
  const txheader = decoder.readUInt32LE()
  state.overwintered = Boolean(txheader >> 31)
  properties.push(state.overwintered)
  state.version = txheader & 0x7FFFFFFF
  properties.push(state.version)
  state.versiongroupid = 0
  if (state.overwintered) {
    state.versiongroupid = decoder.readUInt32LE()
  }
  properties.push(state.versiongroupid)
  if (state.overwintered && !(isOverwinterV3(state) || isSaplingV4(state))) {
    throw new Error('Unknown transaction format')
  }
}

function isOverwinterV3 (state) {
  return state.overwintered &&
    state.versiongroupid === OVERWINTER_VERSION_GROUP_ID &&
    state.version === OVERWINTER_TX_VERSION
}

function isSaplingV4 (state) {
  return state.overwintered &&
    state.versiongroupid === SAPLING_VERSION_GROUP_ID &&
    state.version === SAPLING_TX_VERSION
}

ZcashTransaction._customDecodeExpiryHeight = function (decoder, properties, state) {
  let expiryheight = 0
  if (isOverwinterV3(state) || isSaplingV4(state)) {
    expiryheight = decoder.readUInt32LE()
  }
  properties.push(expiryheight)
}

ZcashTransaction._customDecodeBalanceAndShielded = function (decoder, properties, state) {
  let valueBalanceZat = null
  let vShieldedSpend = null
  let vShieldedOutput = null
  if (isSaplingV4(state)) {
    valueBalanceZat = decoder.readType('CAmount') // decoder.readBigInt64LE() // CAmount
    vShieldedSpend = decoder.readType('std::vector<SpendDescription>')
    vShieldedOutput = decoder.readType('std::vector<OutputDescription>')
  }
  properties.push(valueBalanceZat)
  properties.push(vShieldedSpend)
  properties.push(vShieldedOutput)
}

ZcashTransaction._customDecodeJoinSplit = function (decoder, properties, state) {
  let vjoinsplit = []
  let joinSplitPubKey = null
  let joinSplitSig = null
  if (state.version >= 2) {
    vjoinsplit = decoder.readType('std::vector<JSDescription>')
    if (vjoinsplit.length > 0) {
      joinSplitPubKey = decoder.readType('uint256')
      joinSplitSig = decoder.readType('joinsplit_sig_t')
    }
  }
  properties.push(vjoinsplit)
  properties.push(joinSplitPubKey)
  properties.push(joinSplitSig)
}

ZcashTransaction._customDecodeBindingSig = function (decoder, properties, state) {
  const vShieldedSpend = properties[8]
  const vShieldedOutput = properties[9]
  let bindingSig = null
  if (isSaplingV4(state) && !(vShieldedSpend.length === 0 && vShieldedOutput.length === 0)) {
    bindingSig = decoder.readType('binding_sig_t')
  }
  properties.push(bindingSig)
}

ZcashTransaction._customDecodeBytes = function (decoder, properties, state) {
  const start = state.transactionStartPos
  const end = decoder.currentPosition()
  const rawBytes = decoder.absoluteSlice(start, end - start)
  properties.push(rawBytes)
}

ZcashTransaction._customDecodeHash = function (decoder, properties, state) {
  const hashBytes = properties[properties.length - 1] // rawBytes
  const digest = dblSha2256(hashBytes)
  properties.push(digest)

  /* debugging data for generating test fixtures focused on transactions
  const start = state.transactionStartPos
  const end = decoder.currentPosition()
  require('fs').appendFileSync('tx.log', `  ['${digest.toString('hex')}', ${start}, ${end}],\n`, 'utf8')
  */
}

ZcashTransaction._encodePropertiesDescriptor = decodeProperties(`
_customEncodeVersionAndGroup
const std::vector<CTxIn> vin;
const std::vector<CTxOut> vout;
const uint32_t locktime;
_customEncodeExpiryHeight
_customEncodeBalanceAndShielded
_customEncodeJoinSplit
_customEncodeBindingSig
`)

ZcashTransaction._customEncodeVersionAndGroup = function * (transaction, encoder, args) {
  if (transaction.overwintered) {
    let header = transaction.version
    // When serializing Overwintered tx, the 4 byte header is the combination of fOverwintered and nVersion
    header |= (1 << 31)
    const buf = Buffer.alloc(8)
    buf.writeInt32LE(header) // TODO: this is supposed to be a uint but 1<<31 can make it signed ... check
    buf.writeUInt32LE(transaction.versiongroupid, 4)
    yield buf
  } else {
    const buf = Buffer.alloc(4)
    buf.writeUInt32LE(transaction.version)
    yield buf
  }
}

ZcashTransaction._customEncodeExpiryHeight = function * (transaction, encoder, args) {
  if (isOverwinterV3(transaction) || isSaplingV4(transaction)) {
    const buf = Buffer.alloc(4)
    buf.writeUInt32LE(transaction.expiryheight)
    yield buf
  }
}

ZcashTransaction._customEncodeBalanceAndShielded = function * (transaction, encoder, args) {
  if (isSaplingV4(transaction)) {
    yield * encoder('CAmount', transaction.valueBalanceZat, args)
    yield * encoder('std::vector<SpendDescription>', transaction.vShieldedSpend, args)
    yield * encoder('std::vector<OutputDescription>', transaction.vShieldedOutput, args)
  }
}

ZcashTransaction._customEncodeJoinSplit = function * (transaction, encoder, args) {
  if (transaction.version >= 2) {
    yield * encoder('std::vector<JSDescription>', transaction.vjoinsplit, args)
    if (transaction.vjoinsplit.length > 0) {
      yield * encoder('uint256', transaction.joinSplitPubKey, args)
      yield * encoder('joinsplit_sig_t', transaction.joinSplitSig, args)
    }
  }
}

ZcashTransaction._customEncodeBindingSig = function * (transaction, encoder, args) {
  // if (isSaplingV4(transaction) && !(transaction.vShieldedSpend.length === 0 && transaction.vShieldedOutput.length === 0)) {
  if (Buffer.isBuffer(transaction.bindingSig)) {
    yield * encoder('binding_sig_t', transaction.bindingSig, args)
  }
}

module.exports = ZcashTransaction
module.exports.COIN = COIN
