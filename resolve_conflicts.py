import re
import glob

def resolve_conflicts(filepath, prefer='ours'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = r'<<<<<<< HEAD\n(.*?)=======\n(.*?)>>>>>>> [^\n]+\n'
    def replace_conflict(match):
        ours = match.group(1)
        theirs = match.group(2)
        return ours if prefer == 'ours' else theirs
    resolved = re.sub(pattern, replace_conflict, content, flags=re.DOTALL)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(resolved)
    print(f'Resolved {filepath}')

resolve_conflicts('app/activity/page.js')
for f in glob.glob('components/TeacherDashboard*'):
    resolve_conflicts(f)
print('Done!')
