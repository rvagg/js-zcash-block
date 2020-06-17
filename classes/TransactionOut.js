const multibase = require('multibase')
const { decodeProperties, dblSha2256, hash160 } = require('bitcoin-block/classes/class-utils')
const { COIN } = require('./class-utils')
const { types, scriptToAsmStr, solver, extractDestinations } = require('bitcoin-block/classes/script')

/**
 * A class representation of a Zcash TransactionOut, multiple of which are contained within each {@link ZcashTransaction}.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/TransactionOut')`.
 *
 * @property {BigInt} value - an amount / value for this TransactionOut
 * @property {Uint8Array|Buffer} scriptPubKey - an arbitrary length byte array
 * @class
 */
class ZcashTransactionOut {
  /**
   * Instantiate a new `ZcashTransactionOut`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {BigInt} value
   * @param {Uint8Array|Buffer} scriptPubKey
   * @constructs ZcashTransactionOut
   */
  constructor (value, scriptPubKey) {
    this.value = Number(value)
    this.scriptPubKey = scriptPubKey
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   *
   * The serialized version includes the raw `value` as `valueZat` while `value` is a proper Zcash coin value.
   */

  toJSON (n) {
    const obj = {
      value: this.value / COIN,
      valueZat: Number(this.value),
      valueSat: Number(this.value)
    }

    if (typeof n === 'number') {
      obj.n = n
    }

    if (this.scriptPubKey) {
      const solution = solver(this.scriptPubKey)
      obj.scriptPubKey = {
        asm: scriptToAsmStr(this.scriptPubKey),
        hex: this.scriptPubKey.toString('hex')
      }
      if (solution.solutions) {
        const dest = extractDestinations(this.scriptPubKey)
        if (dest) {
          obj.scriptPubKey.reqSigs = dest.required
          obj.scriptPubKey.type = solution.type
          obj.scriptPubKey.addresses = dest.addresses.map((a) => encodeAddress(a, solution.type))
        }
      }
      if (!obj.scriptPubKey.type) { // doing this because the bitcoin cli orders it between reqSigs and address
        obj.scriptPubKey.type = solution.type
      }
    }
    return obj
  }
}

function encodeAddress (buf, type) {
  if (type === types.TX_PUBKEYHASH || type === types.TX_PUBKEY) {
    if (type === types.TX_PUBKEY) {
      buf = hash160(buf) // pubkey to a pkhash
    }
    buf = Buffer.concat([Buffer.from([0x1c, 0xb8]), buf]) // PUBKEY_ADDRESS base58Prefix
  } else if (type === types.TX_SCRIPTHASH) {
    buf = Buffer.concat([Buffer.from([0x1c, 0xbd]), buf]) // TX_SCRIPTHASH base58Prefix
  } else {
    throw new Error(`Unsupported type for encodeAddress: ${type}`)
  }
  const hash = dblSha2256(buf)
  buf = Buffer.concat([buf, hash.slice(0, 4)]) // 4 byte "check" at the end
  return multibase.encode('base58btc', buf).toString().slice(1)
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashTransactionOut._nativeName = 'CTxOut'
ZcashTransactionOut._decodePropertiesDescriptor = decodeProperties(`
CAmount nValue;
CScript scriptPubKey;
`)

module.exports = ZcashTransactionOut
