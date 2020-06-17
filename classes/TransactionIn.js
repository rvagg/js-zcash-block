const { decodeProperties, toHashHex } = require('bitcoin-block/classes/class-utils')
const { scriptToAsmStr } = require('bitcoin-block/classes/script')

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

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashTransactionIn._nativeName = 'CTxIn'
ZcashTransactionIn._decodePropertiesDescriptor = decodeProperties(`
COutPoint prevout;
CScript scriptSig;
uint32_t nSequence;
`)

module.exports = ZcashTransactionIn
