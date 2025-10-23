async function debugFetch() {
  const did = 'did:web:nonexistent-domain-12345.example';
  
  // Convert DID to URL (same logic as in did-web.resolver.ts)
  const url = `https://nonexistent-domain-12345.example/.well-known/did.json`;
  
  console.log('Testing fetch to:', url);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/did+json, application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
  } catch (error) {
    console.error('Fetch error:', error);
    console.error('Error name:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
  }
}

debugFetch();