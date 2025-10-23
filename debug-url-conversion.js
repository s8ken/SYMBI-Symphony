// Test the URL conversion logic directly
function didToUrl(did) {
  // Remove 'did:web:' prefix
  let path = did.substring(8);

  // Handle port encoding (%3A = URL encoded colon)
  path = path.replace(/%3A/g, ':');

  // Split the entire path by colons
  const parts = path.split(':');
  
  // The first part is always the domain
  // Check if the second part is a port (numeric) or a path component
  let host = parts[0];
  let port = '';
  let pathParts = [];
  
  if (parts.length > 1) {
    // Check if the second part is all numeric (port) or has non-numeric characters (path)
    if (/^\d+$/.test(parts[1])) {
      // It's a port
      port = parts[1];
      pathParts = parts.slice(2);
    } else {
      // It's a path component
      pathParts = parts.slice(1);
    }
  }

  // Construct the URL
  let url = 'https://';
  url += host;
  if (port) {
    url += ':' + port;
  }

  if (pathParts.length > 0) {
    // Path-based DID
    url += '/' + pathParts.join('/') + '/did.json';
  } else {
    // Root domain DID
    url += '/.well-known/did.json';
  }

  return url;
}

// Test cases
const testCases = [
  'did:web:example.com',
  'did:web:example.com:user:alice',
  'did:web:example.com%3A8080',
  'did:web:example.com%3A8080:user:alice'
];

console.log('Testing URL conversion:');
testCases.forEach(did => {
  try {
    const url = didToUrl(did);
    console.log(`${did} -> ${url}`);
  } catch (error) {
    console.error(`Error converting ${did}:`, error.message);
  }
});