/* eslint-disable camelcase */

const { decodeProperties, toHashHex, fromHashHex, isHexString } = require('bitcoin-block/classes/class-utils')
const { COIN } = require('./class-utils')

const SAPLING_TX_VERSION = 4

/**
 * A class representation of a Zcash Transaction's joinsplit, which may or may not be present for a given transaction.
 *
 * This class isn't explicitly exported, access it for direct use with `require('zcash-block/classes/JoinSplitDescription')`.
 *
 * @property {BigInt} vpub_oldZat - a representation of an amount / value
 * @property {BigInt} vpub_newZat - a representation of an amount / value
 * @property {Uint8Array|Buffer} anchor - a 256-bit hash anchoring the joinsplit's position in the commitment tree
 * @property {Array.<Uint8Array>|Array.<Buffer>} nullifiers - two 256-bit blocks derived from secrets in the note
 * @property {Array.<Uint8Array>|Array.<Buffer>} commitments - two 256-bit blocks representing the spend commitments
 * @property {Uint8Array|Buffer} onetimePubKey - a 256-bit hash
 * @property {Uint8Array|Buffer} randomSeed - - a 256-bit block
 * @property {Array.<Uint8Array>|Array.<Buffer>} macs - two 256-bit hashes required to verify this joinsplit
 * @property {Uint8Array|Buffer|PHGRProof} proof - either a GrothProof encoded directly as 192 bytes of binary data or a decoded {@link PHGRProof}, depending on the block version.
 * @property {Uint8Array|Buffer} ciphertexts - two ciphertexts of 601 bytes each which encode trapdoors, values and other information that the recipient needs, including a memo field.
 * @class
 */
class ZcashJoinSplitDescription {
  /**
   * Instantiate a new `ZcashJoinSplitDescription`.
   *
   * See the class properties for expanded information on these parameters.
   *
   * @param {BigInt} vpub_oldZat
   * @param {BigInt} vpub_newZat
   * @param {Uint8Array|Buffer} anchor
   * @param {Array.<Uint8Array>|Array.<Buffer>} nullifiers
   * @param {Array.<Uint8Array>|Array.<Buffer>} commitments
   * @param {Uint8Array|Buffer} onetimePubKey
   * @param {Uint8Array|Buffer} randomSeed
   * @param {Array.<Uint8Array>|Array.<Buffer>} macs
   * @param {Uint8Array|Buffer|PHGRProof} proof
   * @param {Uint8Array|Buffer} ciphertexts
   * @constructs ZcashJoinSplitDescription
   */
  constructor (vpub_oldZat, vpub_newZat, anchor, nullifiers, commitments, onetimePubKey, randomSeed, macs, proof, ciphertexts) {
    this.vpub_oldZat = vpub_oldZat
    this.vpub_newZat = vpub_newZat
    this.anchor = anchor
    this.nullifiers = nullifiers
    this.commitments = commitments
    this.onetimePubKey = onetimePubKey
    this.randomSeed = randomSeed
    this.macs = macs
    this.proof = proof
    this.ciphertexts = ciphertexts
  }

  /**
   * Convert to a serializable form that has nice stringified hashes and other simplified forms. May be
   * useful for simplified inspection.
   */
  toJSON () {
    const obj = {
      vpub_old: Number(this.vpub_oldZat) / COIN,
      vpub_oldZat: Number(this.vpub_oldZat),
      vpub_new: Number(this.vpub_newZat) / COIN,
      vpub_newZat: Number(this.vpub_newZat),
      anchor: toHashHex(this.anchor),
      nullifiers: this.nullifiers.map((nl) => toHashHex(nl)),
      commitments: this.commitments.map((nl) => toHashHex(nl)),
      onetimePubKey: toHashHex(this.onetimePubKey),
      randomSeed: toHashHex(this.randomSeed),
      macs: this.macs.map((nl) => toHashHex(nl)),
      proof: this.proof.toString('hex'),
      ciphertexts: this.ciphertexts.map((nl) => nl.toString('hex'))
    }
    return obj
  }
}

ZcashJoinSplitDescription.fromPorcelain = function fromPorcelain (porcelain) {
  if (typeof porcelain !== 'object') {
    throw new TypeError('ZcashJoinSplitDescription porcelain must be an object')
  }
  if (typeof porcelain.vpub_oldZat !== 'number') {
    throw new TypeError('vpub_oldZat property must be a number')
  }
  if (typeof porcelain.vpub_newZat !== 'number') {
    throw new TypeError('vpub_newZat property must be a number')
  }
  if (typeof porcelain.anchor !== 'string' || !isHexString(porcelain.anchor, 64)) {
    throw new Error('anchor property should be a 64-character hex string')
  }
  if (!Array.isArray(porcelain.nullifiers) || porcelain.nullifiers.length !== 2) {
    throw new Error('nullifiers property should be an array with 2 elements')
  }
  const nullifiers = []
  for (const nullifier of porcelain.nullifiers) {
    if (typeof nullifier !== 'string' || !isHexString(nullifier, 64)) {
      throw new Error('all nullifiers should be a 64-character hex string')
    }
    nullifiers.push(fromHashHex(nullifier))
  }
  if (!Array.isArray(porcelain.commitments) || porcelain.commitments.length !== 2) {
    throw new Error('commitments property should be an array with 2 elements')
  }
  const commitments = []
  for (const commitment of porcelain.commitments) {
    if (typeof commitment !== 'string' || !isHexString(commitment, 64)) {
      throw new Error('all commitments should be a 64-character hex string')
    }
    commitments.push(fromHashHex(commitment))
  }
  if (typeof porcelain.onetimePubKey !== 'string' || !isHexString(porcelain.onetimePubKey, 64)) {
    throw new Error('onetimePubKey property should be a 64-character hex string')
  }
  if (typeof porcelain.randomSeed !== 'string' || !isHexString(porcelain.randomSeed, 64)) {
    throw new Error('randomSeed property should be a 64-character hex string')
  }
  if (!Array.isArray(porcelain.macs) || porcelain.macs.length !== 2) {
    throw new Error('macs property should be an array with 2 elements')
  }
  const macs = []
  for (const nullifier of porcelain.macs) {
    if (typeof nullifier !== 'string' || !isHexString(nullifier, 64)) {
      throw new Error('all macs should be a 64-character hex string')
    }
    macs.push(fromHashHex(nullifier))
  }
  // TODO: there's no differentiation for PHGRProof here, they all become GrothProof, but
  // since we only toString('hex') both of them, it doesn't matter until someone needs the
  // full PHGRProof object
  if (!isHexString(porcelain.proof)) {
    throw new Error('proof property should be a hex string')
  }
  if (!Array.isArray(porcelain.ciphertexts)) {
    throw new Error('ciphertexts property should be an array')
  }
  const ciphertexts = []
  for (const ciphertext of porcelain.ciphertexts) {
    if (typeof ciphertext !== 'string' || !isHexString(ciphertext, (585 + 16) * 2)) {
      throw new Error(`all ciphertexts should be a ${(585 + 16) * 2}-character hex string`)
    }
    ciphertexts.push(Buffer.from(ciphertext, 'hex'))
  }

  return new ZcashJoinSplitDescription(
    porcelain.vpub_oldZat,
    porcelain.vpub_newZat,
    fromHashHex(porcelain.anchor),
    nullifiers,
    commitments,
    fromHashHex(porcelain.onetimePubKey),
    fromHashHex(porcelain.randomSeed),
    macs,
    Buffer.from(porcelain.proof, 'hex'),
    ciphertexts
  )
}

// -------------------------------------------------------------------------------------------------------
// Custom decoder descriptors and functions below here, used by ../decoder.js

ZcashJoinSplitDescription._nativeName = 'JSDescription'
// https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L179
ZcashJoinSplitDescription._decodePropertiesDescriptor = decodeProperties(`
CAmount vpub_old;
CAmount vpub_new;

// JoinSplits are always anchored to a root in the note
// commitment tree at some point in the blockchain
// history or in the history of the current
// transaction.
uint256 anchor;

// Nullifiers are used to prevent double-spends. They
// are derived from the secrets placed in the note
// and the secret spend-authority key known by the
// spender.
std::array<uint256, 2> nullifiers;

// Note commitments are introduced into the commitment
// tree, blinding the public about the values and
// destinations involved in the JoinSplit. The presence of
// a commitment in the note commitment tree is required
// to spend it.
std::array<uint256, 2> commitments;

// Ephemeral key
uint256 ephemeralKey;

// Random seed
uint256 randomSeed;

// MACs
// The verification of the JoinSplit requires these MACs
// to be provided as an input.
std::array<uint256, 2> macs;

// JoinSplit proof
// This is a zk-SNARK which ensures that this JoinSplit is valid.
//libzcash::SproutProof proof;
_customDecodeSproutProof

// Ciphertexts
// These contain trapdoors, values and other information
// that the recipient needs, including a memo field. It
// is encrypted using the scheme implemented in crypto/NoteEncryption.cpp
std::array<ZCNoteEncryption::Ciphertext, 2> ciphertexts
`)

// libzcash::SproutProof is a boost::variant<PHGRProof, GrothProof> (boost::varint is a union container)
// custom serialization occurs @ https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L276-L286
// and https://github.com/zcash/zcash/blob/6da42887f10f9228da4c8c1182174d70b2633284/src/primitives/transaction.h#L166-L177
// typedef std::array<unsigned char, GROTH_PROOF_SIZE> GrothProof;
ZcashJoinSplitDescription._customDecodeSproutProof = function (decoder, properties, state) {
  const useGroth = state.overwintered && state.version >= SAPLING_TX_VERSION
  // if useGroth, unserialize as libzcash::GrothProof, otherwise as libzcash::PHGRProof
  if (useGroth) {
    properties.push(decoder.readType('libzcash::GrothProof'))
  } else {
    properties.push(decoder.readType('PHGRProof'))
  }
}

ZcashJoinSplitDescription._encodePropertiesDescriptor = decodeProperties(`
CAmount vpub_oldZat;
CAmount vpub_newZat;
uint256 anchor;
std::array<uint256, 2> nullifiers;
std::array<uint256, 2> commitments;
uint256 onetimePubKey;
uint256 randomSeed;
std::array<uint256, 2> macs;
_customEncodeSproutProof
std::array<ZCNoteEncryption::Ciphertext, 2> ciphertexts
`)

ZcashJoinSplitDescription._customEncodeSproutProof = function * (joinsplit, encoder, args) {
  if (Buffer.isBuffer(joinsplit.proof)) {
    yield * encoder('libzcash::GrothProof', joinsplit.proof, args)
  } else {
    yield * encoder('PHGRProof', joinsplit.proof, args)
  }
}

module.exports = ZcashJoinSplitDescription
