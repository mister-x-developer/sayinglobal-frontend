function isPublicPath(pathname) {
  if (!pathname) return true;
  if (pathname === '/' || pathname === '/index.html') return true;
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin/login')) return true;
  if (pathname === '/terms' || pathname === '/privacy') return true;
  
  // Public marketplace routes
  if (pathname.startsWith('/discovery') || pathname.startsWith('/search') || pathname === '/listings/nearby') return true;
  
  // Listings details are public, but NOT /my, /new, /edit
  if (pathname.startsWith('/listings')) {
    if (pathname.startsWith('/listings/my') || pathname.startsWith('/listings/new') || pathname.includes('/edit')) return false;
    return true;
  }
  
  // Sellers profiles are public, but NOT /following
  if (pathname.startsWith('/sellers')) {
    if (pathname.startsWith('/sellers/following')) return false;
    return true;
  }
  
  return false;
}
console.log(isPublicPath('/listings/123')); // true
console.log(isPublicPath('/listings/my')); // false
console.log(isPublicPath('/discovery/categories')); // true
