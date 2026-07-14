const assert = require('assert');

function isPublicPath(pathname) {
  if (pathname === '/') return true;
  if (pathname.startsWith('/auth')) return true;
  if (pathname === '/terms' || pathname === '/privacy') return true;
  return false;
}

assert.strictEqual(isPublicPath('/'), true);
assert.strictEqual(isPublicPath('/auth'), true);
assert.strictEqual(isPublicPath('/dashboard'), false);
console.log('Tests passed');
