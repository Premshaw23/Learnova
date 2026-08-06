"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { User, Award, FolderGit, Edit3, Link as LinkIcon, Compass, Sparkles, Plus, Trash2, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function StudentPortfolioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isEditMode, setIsEditMode] = useState(false);
  const [profile, setProfile] = useState({
    bio: "Passionate STEM student interested in robotics, physics, and game development. Currently working on a solar system simulator project.",
    email: "",
    website: "https://myportfolio.dev",
  });

  const [projects, setProjects] = useState([
    { id: 1, title: "Solar System Gravity Simulator", desc: "Interactive 3D simulation calculating orbits using Newton's laws.", tags: ["Physics", "Three.js"], link: "#" },
    { id: 2, title: "Automated Flashcard Builder", desc: "An app that automatically generates smart flashcard blocks from textbook notes.", tags: ["AI", "Next.js"], link: "#" }
  ]);

  const [newProject, setNewProject] = useState({ title: "", desc: "", tags: "", link: "" });

  const [certificates, setCertificates] = useState([
    { id: 1, name: "Advanced Classical Mechanics", issuer: "Learnova Academy", date: "June 2026" },
    { id: 2, name: "Introductory JavaScript & Web Systems", issuer: "Learnova Academy", date: "April 2026" }
  ]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    } else if (user) {
      setProfile(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user, loading, router]);

  const handleProfileSave = (e) => {
    e.preventDefault();
    setIsEditMode(false);
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (newProject.title.trim()) {
      setProjects([
        ...projects,
        {
          id: Date.now(),
          title: newProject.title.trim(),
          desc: newProject.desc.trim(),
          tags: newProject.tags.split(",").map(t => t.trim()).filter(Boolean),
          link: newProject.link.trim() || "#"
        }
      ]);
      setNewProject({ title: "", desc: "", tags: "", link: "" });
    }
  };

  const handleRemoveProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />
      
      {/* Portfolio Banner Header */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-zinc-900/50 border-b border-zinc-800 py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar frame */}
          <div className="w-28 h-28 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shadow-2xl overflow-hidden flex-shrink-0">
            <User className="w-14 h-14 text-zinc-500" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-2 justify-center md:justify-start">
                  {user?.displayName || "Student Portfolio"} <Sparkles className="w-5 h-5 text-yellow-500" />
                </h1>
                <p className="text-zinc-400 text-sm flex items-center justify-center md:justify-start gap-2 font-mono">
                  <Compass className="w-4 h-4 text-indigo-400" /> Learnova Student
                </p>
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className="mt-4 md:mt-0 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center gap-2 transition-all"
              >
                <Edit3 className="w-4 h-4" /> {isEditMode ? "Cancel Edit" : "Edit Profile"}
              </button>
            </div>

            {/* Profile Info Form / Display */}
            {isEditMode ? (
              <form onSubmit={handleProfileSave} className="mt-6 space-y-4 max-w-xl">
                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Short Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none h-20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-zinc-500 uppercase font-semibold mb-1">Personal Link</label>
                    <input
                      type="text"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full mt-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-6 text-sm text-zinc-300 max-w-3xl leading-relaxed">
                <p>{profile.bio}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-zinc-500">
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <LinkIcon className="w-3.5 h-3.5" /> {profile.website}
                    </a>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {profile.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Projects list (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FolderGit className="w-5 h-5 text-indigo-400" /> Featured Projects
            </h2>
          </div>

          {/* Add Project Form (if Edit mode) */}
          {isEditMode && (
            <form onSubmit={handleAddProject} className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <span className="block text-xs text-zinc-500 font-semibold uppercase">Add New Project</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Project tags (comma separated)"
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none"
                />
              </div>
              <textarea
                placeholder="Description"
                value={newProject.desc}
                onChange={(e) => setNewProject({ ...newProject, desc: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none resize-none h-16"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Demo Link (optional)"
                  value={newProject.link}
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
                  className="flex-1 bg-zinc-950 border border-zinc-850 rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map(proj => (
              <div key={proj.id} className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all relative group">
                {isEditMode && (
                  <button 
                    onClick={() => handleRemoveProject(proj.id)}
                    className="absolute top-4 right-4 p-1.5 bg-zinc-950 hover:bg-red-500/10 border border-zinc-850 rounded-lg text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-zinc-100 mb-2 leading-tight pr-6">{proj.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">{proj.desc}</p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {proj.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-zinc-950 border border-zinc-850 text-zinc-400 font-semibold rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {proj.link && proj.link !== "#" && (
                    <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 transition-colors">
                      View Demo <LinkIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates & Achievements Panel (Right column) */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Academic Achievements
          </h2>
          <div className="space-y-4">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-zinc-900/30 border border-zinc-800/80 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-zinc-200 truncate leading-snug">{cert.name}</h4>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{cert.issuer} &bull; {cert.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
