content = open('app/register/page.js').read()

old = '        <span className="text-indigo-300 text-xl animate-pulse">\n          Checking authentication...\n        </span>'

new = '''        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-indigo-300 text-lg font-medium animate-pulse">
            Checking authentication...
          </span>
        </div>'''

result = content.replace(old, new)
open('app/register/page.js', 'w').write(result)
print('done' if old not in result else 'not found - check the text')
