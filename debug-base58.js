// Test the base58 decoding and multicodec parsing
const { DidKeyResolver } = require('./dist/core/trust/resolution/did-key.resolver');

// Create an instance to access the private methods
const resolver = new DidKeyResolver();

// The multibase string from the test
const multibaseString = '6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

console.log('Decoding base58 string:', multibaseString);

try {
  const decoded = resolver.decodeBase58(multibaseString);
  console.log('Decoded bytes:', Array.from(decoded));
  console.log('Decoded bytes (hex):', Array.from(decoded).map(b => b.toString(16).padStart(2, '0')).join(' '));
  
  // Check first few bytes
  console.log('First byte:', decoded[0], 'hex:', decoded[0].toString(16));
  console.log('Second byte:', decoded[1], 'hex:', decoded[1].toString(16));
  
  // Try to parse multicodec
  const parseResult = resolver.parseMulticodec(decoded);
  console.log('Parsed multicodec result:', parseResult);
  console.log('Codec value:', parseResult.codec, 'hex:', parseResult.codec.toString(16));
  
} catch (error) {
  console.error('Error:', error.message);
}