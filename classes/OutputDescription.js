const { decodeProperties, toHashHex, isHexString, fromHashHex } = require('bitcoin-block/classes/class-utils')

/**
 * A class representation of a Zcash output description.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/OutputDescription')`.
 *
 * @property {Uint8Array|Buffer} cv - a 256-bit block representing the value commitment
 * @property {Uint8Array|Buffer} cm - a 256-bit block representing the note commitment for the output note
 * @property {Uint8Array|Buffer} ephemeralKey - a 256-bit Jubjub public key
 * @property {Uint8Array|Buffer} encCiphertext - a 580 byte ciphertext component for the encrypted output note
 * @property {Uint8Array|Buffer} outCiphertext - a 80 byte ciphertext component for the encrypted output note
 * @property {Uint8Array|Buffer} proof - a GrothProof encoded directly as 192 bytes of binary data
 * @class
 */
class ZcashOutputDescription {
  /**
   * Instantiate a new `ZcashOutputDescription`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {Uint8Array|Buffer} cv
   * @param {Uint8Array|Buffer} cm
   * @param {Uint8Array|Buffer} ephemeralKey
   * @param {Uint8Array|Buffer} encCiphertext
   * @param {Uint8Array|Buffer} outCiphertext
   * @param {Uint8Array|Buffer} proof
   * @constructs ZcashOutputDescription
   */
  constructor (cv, cmu, ephemeralKey, encCiphertext, outCiphertext, proof) {
    this.cv = cv
    this.cmu = cmu
    this.ephemeralKey = ephemeralKey
    this.encCiphertext = encCiphertext
    this.outCiphertext = outCiphertext
    this.proof = proof
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   */
  toJSON () {
    return {
      cv: toHashHex(this.cv),
      cmu: toHashHex(this.cmu),
      ephemeralKey: toHashHex(this.ephemeralKey),
      encCiphertext: this.encCiphertext.toString('hex'),
      outCiphertext: this.outCiphertext.toString('hex'),
      proof: this.proof.toString('hex')
    }
  }
}

ZcashOutputDescription.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashOutputDescription porcelain must be an object')
  }
  if (typeof porcelain.cv !== 'string' || !isHexString(porcelain.cv, 64)) {
    throw new Error('cv property should be a 64-character hex string')
  }
  if (typeof porcelain.cmu !== 'string' || !isHexString(porcelain.cmu, 64)) {
    throw new Error('cmu property should be a 64-character hex string')
  }
  if (typeof porcelain.ephemeralKey !== 'string' || !isHexString(porcelain.ephemeralKey, 64)) {
    throw new Error('ephemeralKey property should be a 64-character hex string')
  }
  if (typeof porcelain.encCiphertext !== 'string' || !isHexString(porcelain.encCiphertext, 580 * 2)) {
    throw new Error(`encCiphertext property should be a ${580 * 2}-character hex string`)
  }
  if (typeof porcelain.outCiphertext !== 'string' || !isHexString(porcelain.outCiphertext, 80 * 2)) {
    throw new Error(`outCiphertext property should be a ${80 * 2}-character hex string`)
  }
  if (typeof porcelain.proof !== 'string' || !isHexString(porcelain.proof, (48 + 96 + 48) * 2)) {
    throw new Error(`proof property should be a ${(48 + 96 + 48) * 2}-character hex string`)
  }

  return new ZcashOutputDescription(
    fromHashHex(porcelain.cv),
    fromHashHex(porcelain.cmu),
    fromHashHex(porcelain.ephemeralKey),
    Buffer.from(porcelain.encCiphertext, 'hex'),
    Buffer.from(porcelain.outCiphertext, 'hex'),
    Buffer.from(porcelain.proof, 'hex'))
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashOutputDescription._nativeName = 'OutputDescription'
// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L48
ZcashOutputDescription._decodePropertiesDescriptor = decodeProperties(`
uint256 cv;                     //!< A value commitment to the value of the output note.
uint256 cm;                     //!< The note commitment for the output note.
uint256 ephemeralKey;           //!< A Jubjub public key.
libzcash::SaplingEncCiphertext encCiphertext; //!< A ciphertext component for the encrypted output note.
libzcash::SaplingOutCiphertext outCiphertext; //!< A ciphertext component for the encrypted output note.
libzcash::GrothProof zkproof;   //!< A zero-knowledge proof using the output circuit.
`)

ZcashOutputDescription._encodePropertiesDescriptor = decodeProperties(`
uint256 cv
uint256 cmu
uint256 ephemeralKey
libzcash::SaplingEncCiphertext encCiphertext
libzcash::SaplingOutCiphertext outCiphertext
libzcash::GrothProof proof
`)

module.exports = ZcashOutputDescription
