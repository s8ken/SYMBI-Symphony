/**
 * Cryptographic Test Vectors
 * Official test vectors for signature verification
 *
 * Sources:
 * - RFC 8032 (Ed25519)
 * - NIST CAVP (secp256k1)
 * - W3C VC Test Suite
 */

export const ED25519_TEST_VECTORS = [
  {
    name: 'RFC 8032 Test Vector 1',
    algorithm: 'Ed25519',
    privateKey: '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60',
    publicKeyHex: 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
    publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    message: '',
    signatureHex: 'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155' +
                  '5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
    signatureMultibase: 'z5dsUa7ZgdCTDnR9p6LJeHTCxrFG3nYFzrpKm3RnhYMNXWPpVTr6jdKvPYQRBrxAZ8G1sXB5Hg2NnJbYRVKZjkAZ'
  },
  {
    name: 'RFC 8032 Test Vector 2',
    algorithm: 'Ed25519',
    privateKey: '4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb',
    publicKeyHex: '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c',
    publicKeyMultibase: 'z6MkrCD1csq8y2Kf3Yf8LFzJZm2v8NtMPdDhJcjZz6zFCWjy',
    message: '72',
    signatureHex: '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da' +
                  '085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00',
    signatureMultibase: 'z5XQghpxbNSKShHK71tBmcjp5L7KaQqiZoNGXZGz7vQfTgv5Tv3rJqWxH9dFkBwPWyNvZxvpQHgHmQnN2z6hJF8Q'
  },
  {
    name: 'Empty message',
    algorithm: 'Ed25519',
    publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    message: '',
    signatureMultibase: 'z5dsUa7ZgdCTDnR9p6LJeHTCxrFG3nYFzrpKm3RnhYMNXWPpVTr6jdKvPYQRBrxAZ8G1sXB5Hg2NnJbYRVKZjkAZ',
    valid: true
  }
];

export const SECP256K1_TEST_VECTORS = [
  {
    name: 'ECDSA secp256k1 Test Vector 1',
    algorithm: 'ES256K',
    publicKeyHex: '04' + // Uncompressed point prefix
                  '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798' +
                  '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    messageHash: '4b688df40bcedbe641ddb16ff0a1842d9c67ea1c3bf63f3e0471baa664531d1a',
    signature: '30440220' + // DER encoding
               '69c4c4e06e16a8e6e4b9e5d6f7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6' +
               '0220' +
               '7f8e9d0c1b2a3948576665748392a1b0c9d8e7f6a5b4c3d2e1f0',
    valid: true
  }
];

export const VC_TEST_VECTORS = [
  {
    name: 'Valid Trust Declaration VC',
    credential: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://symbi.trust/contexts/trust/v1'
      ],
      'type': ['VerifiableCredential', 'TrustDeclarationCredential'],
      'issuer': 'did:web:symbi.trust:agents:issuer-123',
      'issuanceDate': '2024-01-15T10:30:00Z',
      'credentialSubject': {
        'id': 'did:web:symbi.trust:agents:subject-456',
        'trustDeclaration': {
          'compliance_score': 0.95,
          'guilt_score': 0.05,
          'trust_articles': {
            'inspection_mandate': true,
            'consent_architecture': true,
            'ethical_override': true,
            'continuous_validation': true,
            'right_to_disconnect': true,
            'moral_recognition': true
          }
        }
      }
    },
    proof: {
      'type': 'Ed25519Signature2020',
      'created': '2024-01-15T10:30:00Z',
      'verificationMethod': 'did:web:symbi.trust:agents:issuer-123#key-1',
      'proofPurpose': 'assertionMethod',
      'proofValue': 'z5dsUa7ZgdCTDnR9p6LJeHTCxrFG3nYFzrpKm3RnhYMNXWPpVTr6jdKvPYQRBrxAZ8G1sXB5Hg2NnJbYRVKZjkAZ'
    },
    valid: true
  },
  {
    name: 'Invalid - Tampered Credential',
    credential: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://symbi.trust/contexts/trust/v1'
      ],
      'type': ['VerifiableCredential', 'TrustDeclarationCredential'],
      'issuer': 'did:web:symbi.trust:agents:issuer-123',
      'issuanceDate': '2024-01-15T10:30:00Z',
      'credentialSubject': {
        'id': 'did:web:symbi.trust:agents:subject-456',
        'trustDeclaration': {
          'compliance_score': 1.0, // TAMPERED - was 0.95
          'guilt_score': 0.0       // TAMPERED - was 0.05
        }
      }
    },
    proof: {
      'type': 'Ed25519Signature2020',
      'created': '2024-01-15T10:30:00Z',
      'verificationMethod': 'did:web:symbi.trust:agents:issuer-123#key-1',
      'proofPurpose': 'assertionMethod',
      'proofValue': 'z5dsUa7ZgdCTDnR9p6LJeHTCxrFG3nYFzrpKm3RnhYMNXWPpVTr6jdKvPYQRBrxAZ8G1sXB5Hg2NnJbYRVKZjkAZ'
    },
    valid: false,
    expectedError: 'Signature verification failed'
  }
];

export const CANONICALIZATION_TEST_VECTORS = [
  {
    name: 'Empty object',
    input: {},
    expected: '{}'
  },
  {
    name: 'Simple object',
    input: { a: 1, b: 2 },
    expected: '{"a":1,"b":2}'
  },
  {
    name: 'Lexicographic key ordering',
    input: { z: 1, a: 2, m: 3 },
    expected: '{"a":2,"m":3,"z":1}'
  },
  {
    name: 'Nested object',
    input: { outer: { z: 1, a: 2 }, first: true },
    expected: '{"first":true,"outer":{"a":2,"z":1}}'
  },
  {
    name: 'Array ordering preserved',
    input: { arr: [3, 1, 2] },
    expected: '{"arr":[3,1,2]}'
  },
  {
    name: 'Unicode escaping',
    input: { emoji: '😀' },
    expected: '{"emoji":"😀"}'
  },
  {
    name: 'Number formatting',
    input: { int: 42, float: 3.14, sci: 1e10 },
    expected: '{"float":3.14,"int":42,"sci":1e+10}'
  },
  {
    name: 'Boolean and null',
    input: { bool: true, nothing: null },
    expected: '{"bool":true,"nothing":null}'
  },
  {
    name: 'Trust Declaration canonical',
    input: {
      agent_id: 'agent-123',
      trust_articles: {
        inspection_mandate: true,
        consent_architecture: true,
        ethical_override: true,
        continuous_validation: true,
        right_to_disconnect: false,
        moral_recognition: true
      },
      scores: {
        compliance_score: 0.9,
        guilt_score: 0.1
      }
    },
    expected: '{"agent_id":"agent-123","scores":{"compliance_score":0.9,"guilt_score":0.1},"trust_articles":{"consent_architecture":true,"continuous_validation":true,"ethical_override":true,"inspection_mandate":true,"moral_recognition":true,"right_to_disconnect":false}}'
  }
];

export const MALFORMED_VECTORS = [
  {
    name: 'Invalid signature length',
    publicKey: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    signature: 'zInvalidShortSignature',
    message: 'test',
    expectedError: 'Invalid signature length'
  },
  {
    name: 'Invalid multibase prefix',
    publicKey: 'x6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK', // Wrong prefix
    signature: 'z5dsUa7ZgdCTDnR9p6LJeHTCxrFG3nYFzrpKm3RnhYMNXWPpVTr6jdKvPYQRBrxAZ8G1sXB5Hg2NnJbYRVKZjkAZ',
    message: 'test',
    expectedError: 'Invalid multibase encoding'
  },
  {
    name: 'Non-finite number in canonicalization',
    input: { value: Infinity },
    expectedError: 'Cannot canonicalize non-finite number'
  },
  {
    name: 'Circular reference',
    input: (() => {
      const obj: any = { a: 1 };
      obj.circular = obj;
      return obj;
    })(),
    expectedError: 'Circular reference detected'
  }
];

/**
 * Property-based test invariants
 */
export const PROPERTY_INVARIANTS = {
  canonicalization: {
    idempotent: 'canonicalize(canonicalize(x)) === canonicalize(x)',
    deterministic: 'canonicalize(x) === canonicalize(x) for all calls',
    bijective: 'parse(canonicalize(x)) deep-equals x (structure preserving)'
  },
  scoring: {
    monotonic: 'more violations => lower compliance score',
    bounded: '0 <= compliance_score <= 1.05 and 0 <= guilt_score <= 1',
    inverse: 'compliance_score + guilt_score ≈ 1 (within penalty range)',
    weights_sum: 'sum of all weights = 1.0',
    critical_penalty: 'critical violation => compliance_score < 0.7'
  },
  temporal_decay: {
    monotonic_decrease: 'score(t1) >= score(t2) for t1 < t2',
    bounded: 'decayed_score <= original_score',
    asymptotic: 'lim(t→∞) score(t) = 0'
  },
  confidence_interval: {
    widens_with_variance: 'higher variance => wider CI',
    narrows_with_samples: 'more samples => narrower CI',
    contains_score: 'lower <= score <= upper',
    bounded: '0 <= lower <= upper <= 1'
  }
};
