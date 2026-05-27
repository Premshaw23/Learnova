content = open('components/TeacherDashboardComponent.js', encoding='utf-8').read()

# Remove our duplicate import (keep the original line 1)
content = content.replace(
    'import Image from "next/image";\nimport toast from "react-hot-toast";',
    'import Image from "next/image";'
)

open('components/TeacherDashboardComponent.js', 'w', encoding='utf-8').write(content)
print('done')

# Verify
lines = open('components/TeacherDashboardComponent.js', encoding='utf-8').readlines()
toast_lines = [(i+1, l.strip()) for i, l in enumerate(lines) if 'toast' in l and 'import' in l]
print('Toast imports found:')
for ln, text in toast_lines:
    print(f'  Line {ln}: {text}')
