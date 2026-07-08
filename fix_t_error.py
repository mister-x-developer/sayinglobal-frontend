import os

def fix_page(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We just replace the t('common.loading') with 'Loading...' directly to avoid 
    # needing the t function in the suspense fallback. Suspense fallbacks are fine 
    # being a simple English fallback since it shows for <1s.
    content = content.replace("{t('common.loading') || 'Loading...'}", "Loading...")
    
    with open(filepath, 'w') as f:
        f.write(content)

fix_page("app/listings/detail/edit/page.tsx")
fix_page("app/admin/listings/detail/edit/page.tsx")
