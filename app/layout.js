import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // optional: improve font loading
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Face Recognition App",
  description: "Next.js + FaceAPI + ShadCN UI Example",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`flex items-center justify-center min-h-screen antialiased bg-gradient-to-br from-blue-100 to-blue-200 text-black ${geistSans.variable} ${geistMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
