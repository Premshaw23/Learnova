import glob

# Fix 1: app/activity/page.js
activity_file = 'app/activity/page.js'
content = open(activity_file, encoding='utf-8').read()

# Add toast import
if 'import toast from "react-hot-toast"' not in content:
    content = content.replace(
        'import { useRouter } from "next/navigation";',
        'import { useRouter } from "next/navigation";\nimport toast from "react-hot-toast";'
    )

# Fix alert calls
content = content.replace(
    'alert("Please log in to track your learning progress!")',
    'toast.error("Please log in to track your learning progress!")'
)
content = content.replace(
    'alert(`Started ${activity.title}! Progress is now being tracked.`)',
    'toast.success(`Started ${activity.title}! Progress is now being tracked.`)'
)

open(activity_file, 'w', encoding='utf-8').write(content)
print(f"✅ Fixed {activity_file}")

# Fix 2: TeacherDashboardComponent
for teacher_file in glob.glob('components/TeacherDashboard*'):
    content = open(teacher_file, encoding='utf-8').read()
    
    if 'import toast from "react-hot-toast"' not in content:
        content = content.replace(
            'import Image from "next/image";',
            'import Image from "next/image";\nimport toast from "react-hot-toast";'
        )
    
    content = content.replace(
        'alert("Failed to update request. Please try again.")',
        'toast.error("Failed to update request. Please try again.")'
    )
    
    open(teacher_file, 'w', encoding='utf-8').write(content)
    print(f"✅ Fixed {teacher_file}")

print("\n🎉 All done!")
