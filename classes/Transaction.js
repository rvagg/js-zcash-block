const multihashing = require('multihashing')
const { decodeProperties, toHashHex } = require('bitcoin-block/classes/class-utils')
const { COIN } = require('./class-utils')

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
  constructor (overwintered, version, versiongroupid, vin, vout, locktime, expiryheight, valueBalanceZat, vShieldedSpend, vShieldedOutput, vjoinsplit, joinSplitPubKey, joinSplitSig, bindingSig, txid) {
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
_customDecodeHash
`)

// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L576-L600
ZcashTransaction._customDecodeVersionAndGroup = function (decoder, properties, state) {
  state.transactionStartPos = decoder.currentPosition()
  const txheader = decoder.readUInt32LE()
  state.fOverwintered = Boolean(txheader >> 31)
  properties.push(state.fOverwintered)
  state.nVersion = txheader & 0x7FFFFFFF
  properties.push(state.nVersion)
  state.nVersionGroupId = 0
  if (state.fOverwintered) {
    state.nVersionGroupId = decoder.readUInt32LE()
  }
  properties.push(state.nVersionGroupId)
  if (state.fOverwintered && !(isOverwinterV3(state) || isSaplingV4(state))) {
    throw new Error('Unknown transaction format')
  }
}

function isOverwinterV3 (state) {
  return state.fOverwintered &&
    state.nVersionGroupId === OVERWINTER_VERSION_GROUP_ID &&
    state.nVersion === OVERWINTER_TX_VERSION
}

function isSaplingV4 (state) {
  return state.fOverwintered &&
    state.nVersionGroupId === SAPLING_VERSION_GROUP_ID &&
    state.nVersion === SAPLING_TX_VERSION
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
  let joinSplitPubKey
  let joinSplitSig
  if (state.nVersion >= 2) {
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
  let bindingSig
  if (isSaplingV4(state) && !(vShieldedSpend.length === 0 && vShieldedOutput.length === 0)) {
    bindingSig = decoder.readType('binding_sig_t')
  }
  properties.push(bindingSig)
}

ZcashTransaction._customDecodeHash = function (decoder, properties, state) {
  const start = state.transactionStartPos
  const end = decoder.currentPosition()
  const hashBytes = decoder.absoluteSlice(start, end - start)
  // double hash
  let digest = multihashing.digest(hashBytes, 'sha2-256')
  digest = multihashing.digest(digest, 'sha2-256')
  properties.push(digest)
}

module.exports = ZcashTransaction
module.exports.COIN = COIN
