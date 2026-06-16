import os, re

app_dir = "/home/lochinbek/Desktop/sayinglobal/frontend/app"
files = [
    "sellers/detail/page.tsx",
    "listings/detail/page.tsx",
    "profile/reports/detail/page.tsx",
    "notifications/detail/page.tsx",
    "admin/broadcasts/detail/page.tsx",
    "admin/listings/detail/page.tsx",
    "admin/moderation/detail/page.tsx",
    "admin/users/detail/page.tsx"
]

for f in files:
    path = os.path.join(app_dir, f)
    if not os.path.exists(path):
        continue
        
    with open(path, "r") as fp:
        content = fp.read()
        
    content = content.replace("useParams", "useSearchParams")
    content = re.sub(r'const\s+params\s*=\s*useSearchParams(?:<[^>]+>)?\(\);?', 'const searchParams = useSearchParams();', content)
    content = re.sub(r'params\s*\?\.\s*id', "searchParams.get('id')", content)
    content = re.sub(r'params\.id', "searchParams.get('id')", content)
    
    with open(path, "w") as fp:
        fp.write(content)
        
print("Done")
