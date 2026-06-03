"use client";

import { useState } from "react";
import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import contributors from "@/data/contributors.json";

const FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%231e293b'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%23475569'/%3E%3Cellipse cx='50' cy='84' rx='28' ry='20' fill='%23475569'/%3E%3C/svg%3E";

function ContributorCard({ username, name, admin }) {
  const [imgSrc, setImgSrc] = useState(
    `https://github.com/${username}.png?size=160`
  );

  return (
    <a
      href={`https://github.com/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-white/10 hover:scale-[1.03]"
    >
      <div
        className={`overflow-hidden rounded-full ${
          admin
            ? "h-20 w-20 ring-2 ring-purple-400/60 group-hover:ring-purple-300"
            : "h-16 w-16 ring-1 ring-white/10 group-hover:ring-accent/40"
        } transition-all duration-300`}
      >
        <Image
          src={imgSrc}
          alt={admin ? name : username}
          width={admin ? 80 : 64}
          height={admin ? 80 : 64}
          className="h-full w-full object-cover"
          onError={() => {
            setImgSrc(FALLBACK);
          }}
        />
      </div>

      <div className="text-center leading-tight">
        <p
          className={`text-sm font-semibold text-white group-hover:text-accent transition-colors ${
            admin ? "text-base" : ""
          }`}
        >
          {admin ? name : `@${username}`}
        </p>
        {admin && (
          <span className="mt-1 inline-block text-xs text-purple-400">
            Project Admin
          </span>
        )}
      </div>
    </a>
  );
}

export default function ContributorsPage() {
  const sorted = [...contributors].sort(
    (a, b) => (b.contributions ?? 0) - (a.contributions ?? 0)
  );

  return (
    <>
      {/* Same background as home page */}
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
      </div>

      <div className="min-h-screen relative z-50">
        <Navbar />

        <div className="px-4 pt-28 pb-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold text-white">Contributors</h1>
              <p className="mt-2 text-slate-400">
                {sorted.length} contributors · ranked by commits
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {sorted.map((c) => (
                <ContributorCard
                  key={c.username}
                  username={c.username}
                  name={c.name}
                  admin={!!c.admin}
                />
              ))}
            </div>

            <p className="mt-12 text-center text-xs text-slate-600">
              Auto-synced daily via GitHub API ·{" "}
              <a
                href="https://github.com/Premshaw23/Learnova"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400/60 hover:text-purple-300"
              >
                contribute on GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
