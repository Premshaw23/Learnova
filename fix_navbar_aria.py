content = open('components/Navbar.js', encoding='utf-8').read()

# Fix logout button
content = content.replace(
    'onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"',
    'onClick={handleLogout} aria-label="Logout" className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"'
)

# Fix mark all as read button
content = content.replace(
    'onClick={markAllAsRead} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"',
    'onClick={markAllAsRead} aria-label="Mark all notifications as read" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"'
)

open('components/Navbar.js', 'w', encoding='utf-8').write(content)
print('✅ Fixed Navbar.js')

# Verify
count = content.count('<button') 
aria_count = content.count('aria-label')
print(f'Total buttons: {count}')
print(f'Buttons with aria-label: {aria_count}')
print('🎉 Done!')
