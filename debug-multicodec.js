// Test the multicodec parsing directly
const { DidKeyResolver } = require('./dist/core/trust/resolution/did-key.resolver');

// Create an instance to access the private methods
const resolver = new DidKeyResolver();

// Test data - this is what we expect for the Ed25519 key
// The multibase string is: z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
// After removing 'z', we get: 6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK

// Let's manually decode this to see what we get
console.log('Testing multicodec parsing...');

// Simulate what the decodeBase58 method would produce for this key
// The key should decode to a byte array that starts with [0xed, 0x01, ...] for Ed25519

// Let's create a simple test with known values
const testData = new Uint8Array([0xed, 0x01, 0x02, 0x03, 0x04]); // Simulate Ed25519 prefix + key data
console.log('Test data:', Array.from(testData));

try {
  const result = resolver.parseMulticodec(testData);
  console.log('Parsed result:', result);
  console.log('Codec (hex):', result.codec.toString(16));
  console.log('Codec (dec):', result.codec);
} catch (error) {
  console.error('Error parsing:', error.message);
}