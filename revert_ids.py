import os
import re

files = [
    'app/admin/listings/detail/page.tsx',
    'app/admin/listings/page.tsx',
    'app/admin/moderation/detail/page.tsx',
    'app/admin/users/detail/page.tsx',
    'app/admin/users/page.tsx',
    'app/listings/detail/page.tsx',
    'app/listings/my/page.tsx',
    'app/listings/nearby/page.tsx',
    'app/listings/new/page.tsx',
    'app/profile/favorites/page.tsx',
    'app/profile/page.tsx',
    'app/profile/reports/detail/page.tsx',
    'app/profile/reports/page.tsx',
    'app/search/page.tsx',
    'app/sellers/detail/page.tsx',
    'components/listings/CommentThread.tsx',
    'components/listings/NearbyListingsSection.tsx',
    'components/map/Map.tsx',
    'components/sellers/SellerCard.tsx',
    'components/sellers/SellerRatingsThread.tsx',
    'components/profile/MyListingsManager.tsx',
    'components/listings/ListingCard.tsx'
]

for file in files:
    path = os.path.join('/home/lochinbek/Desktop/sayinglobal/frontend', file)
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
        
        content = re.sub(r'\bl\.public_id\b', 'l.id', content)
        content = re.sub(r'\bl\?\.public_id\b', 'l?.id', content)
        
        content = re.sub(r'\blisting\.public_id\b', 'listing.id', content)
        content = re.sub(r'\blisting\?\.public_id\b', 'listing?.id', content)
        
        content = re.sub(r'\bseller\.public_id\b', 'seller.id', content)
        content = re.sub(r'\bseller\?\.public_id\b', 'seller?.id', content)
        
        content = re.sub(r'\bs\.public_id\b', 's.id', content)
        content = re.sub(r'\bs\?\.public_id\b', 's?.id', content)
        
        content = re.sub(r'comment\.user\.public_id\b', 'comment.user.id', content)
        
        content = re.sub(r'buyer\?\.public_id\b', 'buyer?.id', content)
        content = re.sub(r'buyer\.public_id\b', 'buyer.id', content)
        
        content = re.sub(r'complainant\?\.public_id\b', 'complainant?.id', content)
        content = re.sub(r'complainant\.public_id\b', 'complainant.id', content)

        content = re.sub(r'sender\?\.public_id\b', 'sender?.id', content)
        content = re.sub(r'sender\.public_id\b', 'sender.id', content)

        # In ListingCard, there is an interface ListingCardData where public_id might be defined.
        # Let's fix that too.
        content = re.sub(r'\bpublic_id:\s*number;', 'id: number;', content)

        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {path}")
