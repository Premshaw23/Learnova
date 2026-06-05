"use client";

import { useParams } from "next/navigation";
import { useNotices } from "@/contexts/FirestoreContext";

export default function NoticeDetailPage() {
    const params = useParams();
    const { notices, loading } = useNotices();
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                Loading notice...
            </div>
        );
    }
    const notice = notices.find(
        (item) => item.id?.toString() === params.id
    );
    if (!notice) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                Notice not found
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-sm mb-4">
                    {notice.category}
                </span>
                <h1 className="text-4xl font-bold mb-6">
                    {notice.title}
                </h1>
                <div className="flex flex-wrap gap-4 text-slate-400 text-sm mb-8">
                    <span>Author: {notice.author}</span>
                    <span>Priority: {notice.priority}</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <p className="leading-8 text-slate-300 whitespace-pre-wrap">
                        {notice.content}
                    </p>
                </div>
                {notice.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-6">
                        {notice.tags.map((tag) => (
                            <span
                                key={tag}
                                className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}