import os

# Fix 1: app/activity/page.js
activity_file = 'app/activity/page.js'
content = open(activity_file).read()

# Add toast import after first import line
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

open(activity_file, 'w').write(content)
print(f"✅ Fixed {activity_file}")

# Fix 2: TeacherDashboardComponent .js
import glob
teacher_files = glob.glob('components/TeacherDashboard*')
for teacher_file in teacher_files:
    content = open(teacher_file).read()
    
    # Add toast import if not present
    if 'import toast from "react-hot-toast"' not in content:
        content = content.replace(
            'import Image from "next/image";',
            'import Image from "next/image";\nimport toast from "react-hot-toast";'
        )
    
    # Fix alert call
    content = content.replace(
        'alert("Failed to update request. Please try again.")',
        'toast.error("Failed to update request. Please try again.")'
    )
    
    open(teacher_file, 'w').write(content)
    print(f"✅ Fixed {teacher_file}")

print("\n🎉 All done!")
