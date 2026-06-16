import os, re

dirs = ["/home/lochinbek/Desktop/sayinglobal/frontend/app", "/home/lochinbek/Desktop/sayinglobal/frontend/components"]

replacements = [
    (r"`/sellers/\$\{([^}]+)\}`", r"`/sellers/detail?id=${\1}`"),
    (r"`/listings/\$\{([^}]+)\}`", r"`/listings/detail?id=${\1}`"),
    (r"`/profile/reports/\$\{([^}]+)\}`", r"`/profile/reports/detail?id=${\1}`"),
    (r"`/notifications/\$\{([^}]+)\}`", r"`/notifications/detail?id=${\1}`"),
    (r"`/admin/broadcasts/\$\{([^}]+)\}`", r"`/admin/broadcasts/detail?id=${\1}`"),
    (r"`/admin/listings/\$\{([^}]+)\}`", r"`/admin/listings/detail?id=${\1}`"),
    (r"`/admin/moderation/\$\{([^}]+)\}`", r"`/admin/moderation/detail?id=${\1}`"),
    (r"`/admin/users/\$\{([^}]+)\}`", r"`/admin/users/detail?id=${\1}`"),
]

for d in dirs:
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith(".tsx") or f.endswith(".ts"):
                path = os.path.join(root, f)
                with open(path, "r") as fp:
                    content = fp.read()
                
                orig = content
                for patt, repl in replacements:
                    content = re.sub(patt, repl, content)
                
                if content != orig:
                    with open(path, "w") as fp:
                        fp.write(content)
                        print(f"Updated {path}")
print("Done")
