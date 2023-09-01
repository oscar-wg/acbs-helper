/*
 * reference from jwt-simple
 *
 * JSON Web Token encode and decode module for node.js
 *
 * Copyright(c) 2011 Kazuhito Hokamura
 * MIT Licensed
 */

/**
 * module dependencies
 */
const jwt = {}

// import crypto from 'crypto'
import CryptoJS from 'crypto-js'

/**
 * support algorithm mapping
 * ADD SHA256 algorithMap key
 */
var algorithmMap = {
  SHA256: CryptoJS.algo.SHA256,
  HS256: CryptoJS.algo.SHA256,
  HS384: CryptoJS.algo.SHA384,
  HS512: CryptoJS.algo.SHA512,
}

/**
 * Map algorithm to hmac or sign type, to determine which crypto function to use
 */
var typeMap = {
  SHA256: 'hmac',
  HS256: 'hmac',
  HS384: 'hmac',
  HS512: 'hmac',
}

/**
 * Decode jwt
 *
 * @param {Object} token
 * @param {String} key
 * @param {Boolean} [noVerify]
 * @param {String} [algorithm]
 * @return {Object} payload
 * @api public
 */
jwt.decode = function jwt_decode(token, key, noVerify, algorithm) {
  // check token
  if (!token) {
    throw new Error('No token supplied')
  }
  // check segments
  var segments = token.split('.')
  if (segments.length !== 3) {
    throw new Error('Not enough or too many segments')
  }

  // All segment should be base64
  var headerSeg = segments[0]
  var payloadSeg = segments[1]
  var signatureSeg = segments[2]

  // base64 decode and parse JSON
  var header = JSON.parse(base64urlDecode(headerSeg))
  var payload = JSON.parse(base64urlDecode(payloadSeg))

  if (!noVerify) {
    if (!algorithm && /BEGIN( RSA)? PUBLIC KEY/.test(key.toString())) {
      algorithm = 'RS256'
    }

    var signingMethod = algorithmMap[algorithm || header.alg]
    var signingType = typeMap[algorithm || header.alg]
    if (!signingMethod || !signingType) {
      throw new Error('Algorithm not supported')
    }

    // verify signature. `sign` will return base64 string.
    var signingInput = [headerSeg, payloadSeg].join('.')
    if (!verify(signingInput, key, signingMethod, signingType, signatureSeg)) {
      throw new Error('Signature verification failed')
    }

    // Support for nbf and exp claims.
    // According to the RFC, they should be in seconds.
    if (payload.nbf && Date.now() < payload.nbf * 1000) {
      throw new Error('Token not yet active')
    }

    if (payload.exp && Date.now() > payload.exp * 1000) {
      throw new Error('Token expired')
    }
  }

  return payload
}

/**
 * Encode jwt
 *
 * @param {Object} payload
 * @param {String} key
 * @param {String} algorithm
 * @param {Object} options
 * @return {String} token
 * @api public
 */
jwt.encode = function jwt_encode(payload, key, algorithm, options) {
  // Check key
  if (!key) {
    throw new Error('Require key')
  }

  // Check algorithm, default is HS256
  if (!algorithm) {
    algorithm = 'HS256'
  }

  var signingMethod = algorithmMap[algorithm]
  var signingType = typeMap[algorithm]
  if (!signingMethod || !signingType) {
    throw new Error('Algorithm not supported')
  }

  // header, typ is fixed value.
  var header = { typ: 'JWT', alg: algorithm }
  if (options && options.header) {
    assignProperties(header, options.header)
  }

  // create segments, all segments should be base64 string
  var segments = []
  segments.push(base64urlEncode(JSON.stringify(header)))
  segments.push(base64urlEncode(JSON.stringify(payload)))
  segments.push(sign(segments.join('.'), key, signingMethod, signingType))

  return segments.join('.')
}

/**
 * private util functions
 */

function assignProperties(dest, source) {
  for (var attr in source) {
    if (source.hasOwnProperty(attr)) {
      dest[attr] = source[attr]
    }
  }
}

function sign(input, key, method, type) {
  var base64str
  if (type === 'hmac') {
    // base64str = crypto.createHmac(method, key).update(input).digest('base64');
    const hmac = CryptoJS.algo.HMAC.create(method, key).update(input)
    base64str = CryptoJS.enc.Base64.stringify(hmac.finalize())
  } else {
    throw new Error('Algorithm type not recognized')
  }

  return base64str
}

function base64urlDecode(str) {
  return Buffer.from(str, 'base64').toString()
}

function base64urlEncode(str) {
  return Buffer.from(str).toString('base64')
}

export { jwt }
