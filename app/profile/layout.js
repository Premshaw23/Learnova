export const metadata = {
  title: 'My Profile · Learnova',
  description: 'Manage your Learnova account, preferences, and personal details',
  openGraph: {
    title: 'My Profile · Learnova',
    description: 'Manage your Learnova account, preferences, and personal details',
    type: 'website',
    siteName: 'Learnova',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Profile · Learnova',
    description: 'Manage your Learnova account, preferences, and personal details',
  },
};

export default function ProfileLayout({ children }) {
  return children;
}
