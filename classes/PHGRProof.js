const { decodeProperties } = require('bitcoin-block/classes/class-utils')

/**
 * A class representation of a Zcash transaction joinsplit proof.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/PHGRProof')`.
 *
 * @property {CompressedG1} gA
 * @property {CompressedG1} gAprime
 * @property {CompressedG2} gB
 * @property {CompressedG1} gBprime
 * @property {CompressedG1} gC
 * @property {CompressedG1} gCprime
 * @property {CompressedG1} gK
 * @property {CompressedG1} gH
 * @property {boolean} yLsb
 * @class
 */
class ZcashPHGRProof {
  /**
   * Instantiate a new `ZcashPHGRProof`.
   *
   * @param {CompressedG1} gA
   * @param {CompressedG1} gAprime
   * @param {CompressedG2} gB
   * @param {CompressedG1} gBprime
   * @param {CompressedG1} gC
   * @param {CompressedG1} gCprime
   * @param {CompressedG1} gK
   * @param {CompressedG1} gH
   * @param {boolean} yLsb
   * @constructs ZCashPHGRProof
   */
  constructor (gA, gAprime, gB, gBprime, gC, gCprime, gK, gH, rawBytes) {
    this.gA = gA
    this.gA = gAprime
    this.gB = gB
    this.gB = gBprime
    this.gC = gC
    this.gC = gCprime
    this.gK = gK
    this.gH = gH
    this.rawBytes = rawBytes
  }

  toString () {
    return this.rawBytes.toString('hex')
  }
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashPHGRProof._nativeName = 'PHGRProof'
// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/zcash/Proof.hpp#L181-L188
ZcashPHGRProof._decodePropertiesDescriptor = decodeProperties(`
_customDecoderMarkStart
CompressedG1 g_A;
CompressedG1 g_A_prime;
CompressedG2 g_B;
CompressedG1 g_B_prime;
CompressedG1 g_C;
CompressedG1 g_C_prime;
CompressedG1 g_K;
CompressedG1 g_H;
_customDecodeRawBytes
`)

ZcashPHGRProof._customDecoderMarkStart = function (decoder, properties, state) {
  state.proofStartPos = decoder.currentPosition()
}

ZcashPHGRProof._customDecodeRawBytes = function (decoder, properties, state) {
  const start = state.proofStartPos
  const end = decoder.currentPosition()
  const rawBytes = decoder.absoluteSlice(start, end - start)
  properties.push(rawBytes)
}

module.exports = ZcashPHGRProof
