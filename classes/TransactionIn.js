const { decodeProperties, toHashHex, isHexString, fromHashHex } = require('bitcoin-block/classes/class-utils')
const { scriptToAsmStr } = require('bitcoin-block/classes/script')
const ZcashOutPoint = require('./OutPoint')

/**
 * A class representation of a Zcash TransactionIn, multiple of which are contained within each {@link ZcashTransaction}.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/TransactionIn')`.
 *
 * @property {ZcashOutPoint} prevout
 * @property {Uint8Array|Buffer} scriptSig - an arbitrary length byte array
 * @property {number} sequence
 * @class
 */
class ZcashTransactionIn {
  /**
   * Instantiate a new `ZcashTransactionIn`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {ZcashOutPoint} prevout
   * @param {Uint8Array|Buffer} scriptSig
   * @param {number} sequence
   * @constructs ZcashTransactionIn
   */
  constructor (prevout, scriptSig, sequence) {
    this.prevout = prevout
    this.scriptSig = scriptSig
    this.sequence = sequence
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   *
   * The serailizable form converts this object to `{ coinbase: scriptSig, sequence: sequence }` to match the Zcash API output.
   */
  toJSON (_, coinbase) {
    let obj
    if (coinbase) {
      obj = {
        coinbase: this.scriptSig.toString('hex'),
        sequence: this.sequence
      }
    } else {
      obj = {
        txid: toHashHex(this.prevout.hash),
        vout: this.prevout.n,
        scriptSig: {
          asm: scriptToAsmStr(this.scriptSig, true),
          hex: this.scriptSig.toString('hex')
        },
        sequence: this.sequence
      }
    }
    return obj
  }
}

ZcashTransactionIn.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashTransactionIn porcelain must be an object')
  }
  if (typeof porcelain.sequence !== 'number') {
    throw new TypeError('sequence property must be a number')
  }

  if (porcelain.coinbase) {
    if (typeof porcelain.coinbase !== 'string' || !isHexString(porcelain.coinbase)) {
      throw new Error('coinbase property should be a hex string')
    }
    const outpoint = new ZcashOutPoint(Buffer.alloc(32), 0xffffffff) // max uint32 is "null"
    return new ZcashTransactionIn(outpoint, Buffer.from(porcelain.coinbase, 'hex'), porcelain.sequence)
  }
  if (typeof porcelain.txid !== 'string' || !isHexString(porcelain.txid, 64)) {
    throw new Error('txid property should be a 64-character hex string')
  }
  if (typeof porcelain.vout !== 'number') {
    throw new TypeError('vout property must be a number')
  }
  if (typeof porcelain.scriptSig !== 'object') {
    throw new TypeError('scriptSig property must be an object')
  }
  if (typeof porcelain.scriptSig.hex !== 'string' || !isHexString(porcelain.scriptSig.hex)) {
    throw new TypeError('scriptSig.hex property must be a hex string')
  }

  const outpoint = new ZcashOutPoint(fromHashHex(porcelain.txid), porcelain.vout)
  return new ZcashTransactionIn(outpoint, Buffer.from(porcelain.scriptSig.hex, 'hex'), porcelain.sequence)
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashTransactionIn._nativeName = 'CTxIn'
ZcashTransactionIn._decodePropertiesDescriptor = decodeProperties(`
COutPoint prevout;
CScript scriptSig;
uint32_t nSequence;
`)

ZcashTransactionIn._encodePropertiesDescriptor = decodeProperties(`
COutPoint prevout;
CScript scriptSig;
uint32_t sequence;
`)

module.exports = ZcashTransactionIn
