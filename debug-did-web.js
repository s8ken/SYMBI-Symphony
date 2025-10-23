const { DidWebResolver } = require('./dist/core/trust/resolution/did-web.resolver');

async function debugDidWeb() {
  const resolver = new DidWebResolver();
  
  // Test DID from the failing test
  const did = 'did:web:nonexistent-domain-12345.example';
  
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
    const result = await resolver.resolve(did, { cache: false, timeout: 3000 });
    console.log('Resolution result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Resolution error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

debugDidWeb();