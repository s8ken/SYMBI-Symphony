const { DidKeyResolver } = require('./dist/core/trust/resolution/did-key.resolver');

async function debugDuration() {
  const resolver = new DidKeyResolver();
  const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
  
  console.log('Testing duration calculation for:', did);
  
  const result = await resolver.resolve(did);
  
  console.log('Resolution result:');
  console.log('  Duration defined:', result.didResolutionMetadata.duration !== undefined);
  console.log('  Duration type:', typeof result.didResolutionMetadata.duration);
  console.log('  Duration value:', result.didResolutionMetadata.duration);
  
  if (result.didResolutionMetadata.duration === 0) {
    console.log('  Warning: Duration is 0, which might cause test failures');
  }
}

debugDuration();