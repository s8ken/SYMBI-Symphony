const { DidKeyResolver } = require('./dist/core/trust/resolution/did-key.resolver');

async function debugDidKey() {
  const resolver = new DidKeyResolver();
  
  // Test DID from the failing test
  const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
  
  console.log('Testing DID resolution for:', did);
  
  // First validate the DID
  const isValid = resolver.validateDID(did);
  console.log('DID is valid:', isValid);
  
  if (!isValid) {
    console.log('DID validation failed');
    return;
  }
  
  // Try to resolve
  try {
    const result = await resolver.resolve(did);
    console.log('Resolution result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Resolution error:', error);
  }
}

debugDidKey();