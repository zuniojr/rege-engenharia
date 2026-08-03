with open(r'C:\Users\Osmar Junior\Documents\01 Antigravity\rege-engenharia\src\data\blogPosts.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the new article section
idx = content.find('estudo-geotecnico-fundamental-obra-navegantes')
entry_start = idx
entry_end = content.find("\n  },\n  {", idx + 100)
if entry_end < 0:
    entry_end = content.find("\n];", idx)

entry = content[entry_start:entry_end]

# Find all problematic apostrophes inside single-quoted strings
# The issue is d'água - the apostrophe breaks the JS string
# We need to escape it as d\'água

# Replace d'água with d\'água
content = content.replace("d'água", "d\\'água")

# Also check for other potential issues like a'água, etc.
# Let's also check for any other apostrophes that might break strings
# Common Portuguese apostrophes: d'água, a'área, etc.

with open(r'C:\Users\Osmar Junior\Documents\01 Antigravity\rege-engenharia\src\data\blogPosts.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed apostrophes!")