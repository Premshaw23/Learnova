content = open('components/ChatBot.js', encoding='utf-8').read()

# Fix clear chat button
content = content.replace(
    'onClick={clearChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Clear chat"',
    'onClick={clearChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Clear chat" aria-label="Clear chat"'
)

# Fix toggle theme button
content = content.replace(
    'onClick={() => setTheme(isDarkMode ? "light" : "dark")} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Toggle theme"',
    'onClick={() => setTheme(isDarkMode ? "light" : "dark")} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Toggle theme" aria-label="Toggle theme"'
)

# Fix minimize button
content = content.replace(
    'onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title={isMinimized ? "Expand" : "Minimize"}',
    'onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title={isMinimized ? "Expand" : "Minimize"} aria-label={isMinimized ? "Expand chat" : "Minimize chat"}'
)

open('components/ChatBot.js', 'w', encoding='utf-8').write(content)
print('✅ Fixed ChatBot.js')

# Fix Navbar buttons
content = open('components/Navbar.js', encoding='utf-8').read()

# Check what buttons are missing
missing = []
for i, line in enumerate(content.split('\n'), 1):
    if '<button' in line and 'aria-label' not in line:
        missing.append(f"Line {i}: {line.strip()}")

print(f"\nNavbar buttons still missing aria-label: {len(missing)}")
for m in missing[:5]:
    print(f"  {m}")

open('components/Navbar.js', 'w', encoding='utf-8').write(content)
print('\n🎉 Done!')
