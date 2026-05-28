content = open('components/ChatBot.js', encoding='utf-8').read()

# Fix 1: Open chatbot button
content = content.replace(
    'onClick={() => setIsOpen(true)}\n          className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 relative group"',
    'onClick={() => setIsOpen(true)}\n          aria-label="Open chat"\n          className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 relative group"'
)

# Fix 2: Toggle theme button
content = content.replace(
    'onClick={toggleTheme}\n            className="hover:bg-white/20 p-2 rounded-lg transition-colors"\n          >',
    'onClick={toggleTheme}\n            aria-label="Toggle theme"\n            className="hover:bg-white/20 p-2 rounded-lg transition-colors"\n          >'
)

# Fix 3: Minimize/Maximize button
content = content.replace(
    'onClick={() => setIsMinimized(!isMinimized)}\n            className="hover:bg-white/20 p-2 rounded-lg transition-colors"\n          >',
    'onClick={() => setIsMinimized(!isMinimized)}\n            aria-label="Minimize chat"\n            className="hover:bg-white/20 p-2 rounded-lg transition-colors"\n          >'
)

open('components/ChatBot.js', 'w', encoding='utf-8').write(content)
print('✅ Fixed ChatBot.js aria-labels')

# Fix Navbar.js
content = open('components/Navbar.js', encoding='utf-8').read()

# Mobile menu toggle
content = content.replace(
    'onClick={() => setIsMenuOpen(!isMenuOpen)}\n            className=',
    'onClick={() => setIsMenuOpen(!isMenuOpen)}\n            aria-label="Toggle mobile menu"\n            className='
)

open('components/Navbar.js', 'w', encoding='utf-8').write(content)
print('✅ Fixed Navbar.js aria-labels')

print('\n🎉 All done!')
