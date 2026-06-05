"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Navbar } from "@/components/Navbar";
import NoticeCard from "@/components/NoticeCard";
import NoticeSkeleton from "@/components/NoticeSkeleton";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function NoticeDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notice, setNotice] = useState(null);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRead, setIsRead] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  // Fetch single notice from Firestore
  useEffect(() => {
    if (!user || !id) return;

    const fetchNotice = async () => {
      setNoticeLoading(true);
      try {
        const docRef = doc(db, "notices", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Verify user has role authorization (targetAudience check) and tenant isolation (instituteId check)
          const targetAudience = data.targetAudience || [];
          const userRole = userProfile?.role || "student";
          const isAdmin = userRole === "admin";
          const isAuthor = data.authorId === user?.uid;

          const userInstituteId = userProfile?.instituteId || user?.uid;
          const noticeInstituteId = data.instituteId;

          if (!isAdmin && !isAuthor) {
            if (
              targetAudience.length > 0 &&
              !targetAudience.includes(userRole)
            ) {
              setError("You do not have permission to view this notice.");
              setNoticeLoading(false);
              return;
            }
            if (
              noticeInstituteId &&
              userInstituteId &&
              noticeInstituteId !== userInstituteId
            ) {
              setError(
                "Access Denied: Notice belongs to a different institute."
              );
              setNoticeLoading(false);
              return;
            }
          }

          setNotice({
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
          });

          // Check if marked as read
          if (userProfile && Array.isArray(userProfile.readNotices)) {
            setIsRead(userProfile.readNotices.includes(docSnap.id));
          }
        } else {
          setError("Notice not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error retrieving notice details.");
      } finally {
        setNoticeLoading(false);
      }
    };

    fetchNotice();
  }, [id, user, userProfile]);

  const getRelativeTime = useCallback((date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }, []);

  const handleToggleRead = async () => {
    if (!user || !notice) return;
    const nextReadState = !isRead;
    setIsRead(nextReadState);

    // Save to Firestore users profile
    try {
      const userRef = doc(db, "users", user.uid);
      const currentReadList = userProfile?.readNotices || [];
      let updatedReadList;

      if (nextReadState) {
        updatedReadList = [...new Set([...currentReadList, notice.id])];
      } else {
        updatedReadList = currentReadList.filter((item) => item !== notice.id);
      }

      await updateDoc(userRef, {
        readNotices: updatedReadList,
      });
    } catch (err) {
      console.error("Failed to update read status:", err);
    }
  };

  if (authLoading || noticeLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-32">
          <NoticeSkeleton count={1} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="mx-auto max-w-md px-4 py-32 text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">{error}</h2>
          <Link
            href="/notices"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Notice Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pt-28">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {notice && (
          <NoticeCard
            notice={notice}
            isRead={isRead}
            onToggleRead={handleToggleRead}
            searchQuery=""
            getRelativeTime={getRelativeTime}
          />
        )}
      </div>
    </div>
  );
}
