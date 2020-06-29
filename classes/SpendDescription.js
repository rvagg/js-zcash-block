const { decodeProperties, toHashHex, isHexString, fromHashHex } = require('bitcoin-block/classes/class-utils')

/**
 * A class representation of a Zcash spend description.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/SpendDescription')`.
 *
 * @property {Uint8Array|Buffer} cv - a 256-bit value commitment to the value of the input note
 * @property {Uint8Array|Buffer} anchor - a 256-bit Merkle root of the Sapling note commitment tree at some block height in the past
 * @property {Uint8Array|Buffer} nullifier - a 256-bit nullifier of the input note
 * @property {Uint8Array|Buffer} rk - a 256-bit randomized public key for spendAuthSig
 * @property {Uint8Array|Buffer} proof - a GrothProof encoded directly as 192 bytes of binary data
 * @property {Uint8Array|Buffer} spendAuthSig - a 512-bit signature authorizing this spend
 * @class
 */
class ZcashSpendDescription {
  /**
   * Instantiate a new `ZcashSpendDescription`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {Uint8Array|Buffer} cv
   * @param {Uint8Array|Buffer} anchor
   * @param {Uint8Array|Buffer} nullifier
   * @param {Uint8Array|Buffer} rk
   * @param {Uint8Array|Buffer} proof
   * @param {Uint8Array|Buffer} spendAuthSig
   * @constructs ZcashSpendDescription
   */
  constructor (cv, anchor, nullifier, rk, proof, spendAuthSig) {
    this.cv = cv
    this.anchor = anchor
    this.nullifier = nullifier
    this.rk = rk
    this.proof = proof
    this.spendAuthSig = spendAuthSig
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   */
  toJSON () {
    return {
      cv: toHashHex(this.cv),
      anchor: toHashHex(this.anchor),
      nullifier: toHashHex(this.nullifier),
      rk: toHashHex(this.rk),
      proof: this.proof.toString('hex'),
      spendAuthSig: this.spendAuthSig.toString('hex')
    }
  }
}

ZcashSpendDescription.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashSpendDescription porcelain must be an object')
  }
  if (typeof porcelain.cv !== 'string' || !isHexString(porcelain.cv, 64)) {
    throw new Error('cv property should be a 64-character hex string')
  }
  if (typeof porcelain.anchor !== 'string' || !isHexString(porcelain.anchor, 64)) {
    throw new Error('anchor property should be a 64-character hex string')
  }
  if (typeof porcelain.nullifier !== 'string' || !isHexString(porcelain.nullifier, 64)) {
    throw new Error('nullifier property should be a 64-character hex string')
  }
  if (typeof porcelain.rk !== 'string' || !isHexString(porcelain.rk, 64)) {
    throw new Error('rk property should be a 64-character hex string')
  }
  if (typeof porcelain.spendAuthSig !== 'string' || !isHexString(porcelain.spendAuthSig)) {
    throw new Error('spendAuthSig property should be a 64-character hex string')
  }
  if (typeof porcelain.proof !== 'string' || !isHexString(porcelain.proof, (48 + 96 + 48) * 2)) {
    throw new Error(`proof property should be a ${(48 + 96 + 48) * 2}-character hex string`)
  }

  return new ZcashSpendDescription(
    fromHashHex(porcelain.cv),
    fromHashHex(porcelain.anchor),
    fromHashHex(porcelain.nullifier),
    fromHashHex(porcelain.rk),
    Buffer.from(porcelain.proof, 'hex'),
    Buffer.from(porcelain.spendAuthSig, 'hex'))
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashSpendDescription._nativeName = 'SpendDescription'
// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L48
ZcashSpendDescription._decodePropertiesDescriptor = decodeProperties(`
uint256 cv;                    //!< A value commitment to the value of the input note.
uint256 anchor;                //!< A Merkle root of the Sapling note commitment tree at some block height in the past.
uint256 nullifier;             //!< The nullifier of the input note.
uint256 rk;                    //!< The randomized public key for spendAuthSig.
libzcash::GrothProof zkproof;  //!< A zero-knowledge proof using the spend circuit.
spend_auth_sig_t spendAuthSig; //!< A signature authorizing this spend.
`)

ZcashSpendDescription._encodePropertiesDescriptor = decodeProperties(`
uint256 cv
uint256 anchor
uint256 nullifier
uint256 rk
libzcash::GrothProof proof
spend_auth_sig_t spendAuthSig
`)

module.exports = ZcashSpendDescription
