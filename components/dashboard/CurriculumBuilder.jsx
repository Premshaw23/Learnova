"use client";

import React, { useState, useEffect } from "react";
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Video,
  FileText,
  HelpCircle,
  Code,
  BookOpen,
  Sparkles,
  RefreshCw,
  Clock,
  Layers
} from "lucide-react";
import { toast } from "react-hot-toast";

// Fetch the master courses list
import { COURSES } from "@/lib/courses";

export default function CurriculumBuilder() {
  const [courses] = useState(COURSES);
  const [selectedCourseId, setSelectedCourseId] = useState(COURSES[0]?.id || "nextjs-mastery");

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Track expanded state for module accordions
  const [expandedModules, setExpandedModules] = useState({});

  // Inline editing state
  const [editingEntity, setEditingEntity] = useState(null); // { type: 'module'|'lesson', id, parentId(for lesson), tempTitle }

  // Drag and Drop tracking state
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'module'|'lesson', id, index, parentModuleId }
  const [dragOverModuleId, setDragOverModuleId] = useState(null);
  const [dragOverLessonId, setDragOverLessonId] = useState(null);

  // Fetch course curriculum from API
  useEffect(() => {
    async function loadCurriculum() {
      setLoading(true);
      try {
        // First check local storage cache for instant rendering
        const cached = localStorage.getItem(`curriculum-${selectedCourseId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setModules(parsed);
          // Auto expand first module by default
          if (parsed.length > 0) {
            setExpandedModules(prev => ({ ...prev, [parsed[0].id]: true }));
          }
        }

        const res = await fetch(`/api/courses/curriculum/${selectedCourseId}`);
        const data = await res.json();
        if (data.success) {
          setModules(data.modules);
          localStorage.setItem(`curriculum-${selectedCourseId}`, JSON.stringify(data.modules));
          // If no cache was present, expand the first module
          if (!cached && data.modules.length > 0) {
            setExpandedModules(prev => ({ ...prev, [data.modules[0].id]: true }));
          }
        }
      } catch (err) {
        console.error("Failed to load curriculum:", err);
        toast.error("Could not load latest curriculum from server.");
      } finally {
        setLoading(false);
      }
    }
    loadCurriculum();
  }, [selectedCourseId]);

  // Synchronize changes to DB in background (Batched / Optimistic)
  const syncCurriculum = async (updatedModules) => {
    setSyncing(true);
    // Optimistically update localStorage cache
    localStorage.setItem(`curriculum-${selectedCourseId}`, JSON.stringify(updatedModules));

    // Custom toast saving notification (elegant non-blocking visual feedback)
    const toastId = toast.loading("Saving changes...", {
      style: {
        background: "#09090b",
        color: "#f4f4f5",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }
    });

    try {
      const res = await fetch("/api/courses/curriculum/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourseId,
          modules: updatedModules
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastSaved(new Date().toLocaleTimeString());
        toast.success(data.message || "Changes saved!", { id: toastId });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Offline Cache Saved. Remote server sync pending.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Toggle Accordion Collapse/Expand
  const toggleModuleExpand = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Helper to generate quick UUIDs
  const generateId = () => `id-${Math.random().toString(36).substr(2, 9)}`;

  // Add New Module
  const handleAddModule = () => {
    const newModule = {
      id: generateId(),
      title: `New Module: Enter Title`,
      order: modules.length,
      lessons: []
    };
    const updated = [...modules, newModule];
    setModules(updated);
    setExpandedModules(prev => ({ ...prev, [newModule.id]: true }));
    syncCurriculum(updated);
    toast.success("Module created! Double-click to rename.");
  };

  // Delete Module
  const handleDeleteModule = (moduleId) => {
    const updated = modules
      .filter(mod => mod.id !== moduleId)
      .map((mod, idx) => ({ ...mod, order: idx }));
    setModules(updated);
    syncCurriculum(updated);
    toast.success("Module deleted successfully.");
  };

  // Start Editing Title
  const startEditing = (entityType, entityId, currentTitle, parentId = null) => {
    setEditingEntity({
      type: entityType,
      id: entityId,
      parentId,
      tempTitle: currentTitle
    });
  };

  // Save Title Changes
  const saveEditing = () => {
    if (!editingEntity || !editingEntity.tempTitle.trim()) return;

    let updated = [];
    if (editingEntity.type === "module") {
      updated = modules.map(mod =>
        mod.id === editingEntity.id
          ? { ...mod, title: editingEntity.tempTitle }
          : mod
      );
    } else if (editingEntity.type === "lesson") {
      updated = modules.map(mod => {
        if (mod.id === editingEntity.parentId) {
          return {
            ...mod,
            lessons: mod.lessons.map(les =>
              les.id === editingEntity.id
                ? { ...les, title: editingEntity.tempTitle }
                : les
            )
          };
        }
        return mod;
      });
    }

    setModules(updated);
    syncCurriculum(updated);
    setEditingEntity(null);
  };

  // Add Lesson to a Module
  const handleAddLesson = (moduleId, type = "video") => {
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule) return;

    const newLesson = {
      id: generateId(),
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Lesson`,
      duration: type === "video" ? "10 mins" : type === "quiz" ? "15 mins" : "20 mins",
      type,
      completed: false,
      order: targetModule.lessons.length
    };

    const updated = modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: [...mod.lessons, newLesson]
        };
      }
      return mod;
    });

    setModules(updated);
    // Make sure module is expanded so user sees the new lesson
    setExpandedModules(prev => ({ ...prev, [moduleId]: true }));
    syncCurriculum(updated);
    toast.success(`New ${type} added!`);
  };

  // Delete Lesson
  const handleDeleteLesson = (moduleId, lessonId) => {
    const updated = modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: mod.lessons
            .filter(les => les.id !== lessonId)
            .map((les, idx) => ({ ...les, order: idx }))
        };
      }
      return mod;
    });
    setModules(updated);
    syncCurriculum(updated);
    toast.success("Lesson deleted.");
  };

  // Change Lesson Type
  const handleChangeLessonType = (moduleId, lessonId, newType) => {
    const updated = modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: mod.lessons.map(les =>
            les.id === lessonId ? { ...les, type: newType } : les
          )
        };
      }
      return mod;
    });
    setModules(updated);
    syncCurriculum(updated);
  };

  // Change Lesson Duration
  const handleChangeLessonDuration = (moduleId, lessonId, newDuration) => {
    const updated = modules.map(mod => {
      if (mod.id === moduleId) {
        return {
          ...mod,
          lessons: mod.lessons.map(les =>
            les.id === lessonId ? { ...les, duration: newDuration } : les
          )
        };
      }
      return mod;
    });
    setModules(updated);
    syncCurriculum(updated);
  };

  // Get matching Lucide icon for lesson type
  const getLessonIcon = (type) => {
    switch (type) {
      case "video": return <Video className="w-4 h-4 text-sky-400" />;
      case "article": return <FileText className="w-4 h-4 text-emerald-400" />;
      case "quiz": return <HelpCircle className="w-4 h-4 text-amber-400" />;
      case "code": return <Code className="w-4 h-4 text-purple-400" />;
      default: return <BookOpen className="w-4 h-4 text-zinc-400" />;
    }
  };

  // ==========================================
  // DRAG AND DROP HANDLERS (NATIVE HTML5 IMPLEMENTATION)
  // ==========================================

  const handleDragStart = (e, type, index, id, parentModuleId = null) => {
    setDraggedItem({ type, index, id, parentModuleId });
    e.dataTransfer.effectAllowed = "move";
    // Setup transparent visual preview to support elegant CSS previews
    const ghost = document.createElement("div");
    ghost.style.opacity = "0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  };

  const handleDragOver = (e, targetType, targetIndex, targetModuleId, targetLessonId = null) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Handle Module dragging over Module
    if (draggedItem.type === "module" && targetType === "module") {
      if (draggedItem.index === targetIndex) return;
      setDragOverModuleId(targetModuleId);
    }

    // Handle Lesson dragging over Lesson or Module
    if (draggedItem.type === "lesson") {
      setDragOverModuleId(targetModuleId);
      if (targetType === "lesson") {
        setDragOverLessonId(targetLessonId);
      } else {
        setDragOverLessonId(null);
      }
    }
  };

  const handleDrop = (e, targetType, targetIndex, targetModuleId, targetLessonId = null) => {
    e.preventDefault();
    if (!draggedItem) return;

    let updated = [...modules];

    // CASE 1: Dragged Module dropped
    if (draggedItem.type === "module" && targetType === "module") {
      const movedModule = updated[draggedItem.index];
      updated.splice(draggedItem.index, 1);
      updated.splice(targetIndex, 0, movedModule);

      // Update order field
      updated = updated.map((mod, idx) => ({ ...mod, order: idx }));
      setModules(updated);
      syncCurriculum(updated);
    }

    // CASE 2: Dragged Lesson dropped
    if (draggedItem.type === "lesson") {
      // Find origin and target modules
      const originModIdx = updated.findIndex(m => m.id === draggedItem.parentModuleId);
      const targetModIdx = updated.findIndex(m => m.id === targetModuleId);

      if (originModIdx !== -1 && targetModIdx !== -1) {
        const originModule = updated[originModIdx];
        const targetModule = updated[targetModIdx];

        // Remove from origin
        const [movedLesson] = originModule.lessons.splice(draggedItem.index, 1);

        // Find insert index
        let insertIndex = targetModule.lessons.length;
        if (targetType === "lesson" && targetLessonId) {
          const matchingIdx = targetModule.lessons.findIndex(l => l.id === targetLessonId);
          if (matchingIdx !== -1) {
            insertIndex = matchingIdx;
          }
        }

        // Insert into target
        targetModule.lessons.splice(insertIndex, 0, movedLesson);

        // Normalize order field in both modules
        originModule.lessons = originModule.lessons.map((les, idx) => ({ ...les, order: idx }));
        targetModule.lessons = targetModule.lessons.map((les, idx) => ({ ...les, order: idx }));

        setModules(updated);
        syncCurriculum(updated);
        // Force expand target module so dropped lesson is visible
        setExpandedModules(prev => ({ ...prev, [targetModuleId]: true }));
      }
    }

    resetDragStates();
  };

  const resetDragStates = () => {
    setDraggedItem(null);
    setDragOverModuleId(null);
    setDragOverLessonId(null);
  };

  return (
    <div className="space-y-6 select-none max-w-6xl mx-auto pb-12">
      {/* Course Info Header & Control Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
              Curriculum Architecture
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full">
                Interactive DnD
              </span>
            </h2>
            <p className="text-sm text-zinc-400">Drag grab handles to reorder syllabus structure instantly</p>
          </div>
        </div>

        {/* Course Select and Status */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Active Syllabus</span>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-zinc-200 text-sm font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none w-full sm:w-64"
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 self-end h-10 mt-auto bg-zinc-950 px-4 rounded-xl border border-zinc-800/60 text-xs">
            {syncing ? (
              <span className="flex items-center gap-2 text-indigo-400 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Optimistic Sync...
              </span>
            ) : lastSaved ? (
              <span className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse">
                <Check className="w-3.5 h-3.5" />
                Synced at {lastSaved}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Clock className="w-3.5 h-3.5" />
                Saved Cache Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 border border-zinc-800/40 rounded-2xl space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Assembling curriculum structural data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vertical Stack of Modules */}
          {modules.map((mod, modIdx) => {
            const isExpanded = !!expandedModules[mod.id];
            const isDragged = draggedItem?.type === "module" && draggedItem.id === mod.id;
            const isTargetOver = dragOverModuleId === mod.id && draggedItem?.type === "module";

            return (
              <div
                key={mod.id}
                onDragOver={(e) => handleDragOver(e, "module", modIdx, mod.id)}
                onDrop={(e) => handleDrop(e, "module", modIdx, mod.id)}
                className={`group border rounded-2xl transition-all duration-300 overflow-hidden bg-zinc-900/10 backdrop-blur-md relative ${
                  isDragged ? "opacity-30 border-dashed border-indigo-500/50 scale-[0.98]" : "border-zinc-800/60 hover:border-zinc-700/80"
                } ${isTargetOver ? "border-indigo-500 bg-indigo-500/5 translate-y-1 shadow-lg shadow-indigo-500/5" : ""}`}
              >
                {/* Module Header Panel */}
                <div
                  className={`flex items-center justify-between p-4 px-6 border-b transition-colors duration-200 select-none ${
                    isExpanded ? "bg-zinc-900/40 border-zinc-800/80" : "bg-transparent border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Module Grab Handle */}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, "module", modIdx, mod.id)}
                      onDragEnd={resetDragStates}
                      className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-zinc-800/60 border border-transparent hover:border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-all"
                      title="Grab to reorder Module"
                    >
                      <GripVertical className="w-5 h-5 text-indigo-500" />
                    </div>

                    {/* Module Title Text / Input */}
                    {editingEntity?.id === mod.id ? (
                      <div className="flex items-center gap-2 flex-1 max-w-xl">
                        <input
                          type="text"
                          value={editingEntity.tempTitle}
                          onChange={(e) => setEditingEntity({ ...editingEntity, tempTitle: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500 w-full"
                          autoFocus
                        />
                        <button
                          onClick={saveEditing}
                          className="p-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          aria-label="Save structural container changes"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingEntity(null)}
                          className="p-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:bg-zinc-700 transition-colors"
                          aria-label="Cancel structural container editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <h3
                        onDoubleClick={() => startEditing("module", mod.id, mod.title)}
                        className="font-bold text-zinc-200 text-base flex items-center gap-2 group/title cursor-text select-none"
                      >
                        {mod.title}
                        <button
                          onClick={() => startEditing("module", mod.id, mod.title)}
                          className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-all"
                          title="Rename Module"
                          aria-label="Rename structural container"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </h3>
                    )}
                  </div>

                  {/* Actions & Chevron Expand Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleModuleExpand(mod.id)}
                      className="p-1.5 hover:bg-zinc-800/80 rounded-xl text-zinc-400 hover:text-zinc-100 transition-all border border-transparent hover:border-zinc-800"
                      title={isExpanded ? "Collapse Module" : "Expand Module"}
                      aria-label={isExpanded ? "Collapse structural container" : "Expand structural container"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod.id)}
                      className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl text-zinc-500 hover:text-red-400 transition-all"
                      title="Delete Module"
                      aria-label="Delete structural container"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lessons Nested Section (Accordion Body) */}
                {isExpanded && (
                  <div
                    onDragOver={(e) => handleDragOver(e, "module-body", null, mod.id)}
                    onDrop={(e) => handleDrop(e, "module-body", mod.lessons.length, mod.id)}
                    className="p-5 pt-1 bg-zinc-900/20 space-y-3"
                  >
                    {/* Nested Lesson Cards */}
                    <div className="space-y-2.5">
                      {mod.lessons.map((lesson, lesIdx) => {
                        const isLessonDragged = draggedItem?.type === "lesson" && draggedItem.id === lesson.id;
                        const isLessonTargetOver = dragOverLessonId === lesson.id && draggedItem?.type === "lesson";

                        return (
                          <div
                            key={lesson.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, "lesson", lesIdx, lesson.id, mod.id)}
                            onDragEnd={resetDragStates}
                            onDragOver={(e) => handleDragOver(e, "lesson", lesIdx, mod.id, lesson.id)}
                            onDrop={(e) => handleDrop(e, "lesson", lesIdx, mod.id, lesson.id)}
                            className={`flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800/60 rounded-xl transition-all duration-200 relative group/lesson ${
                              isLessonDragged ? "opacity-35 border-dashed border-indigo-500/40 bg-zinc-950/20" : ""
                            } ${isLessonTargetOver ? "border-indigo-500/60 bg-indigo-500/5 shadow-md shadow-indigo-500/5 translate-x-1" : ""}`}
                          >
                            <div className="flex items-center gap-3.5 flex-1">
                              {/* Grab Handle */}
                              <div
                                className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-indigo-400 transition-colors"
                                title="Grab to reorder Lesson"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Lesson Icon */}
                              <div className="p-2 bg-zinc-900 border border-zinc-800/60 rounded-lg">
                                {getLessonIcon(lesson.type)}
                              </div>

                              {/* Lesson Content Title */}
                              {editingEntity?.id === lesson.id ? (
                                <div className="flex items-center gap-2 flex-1 max-w-xl">
                                  <input
                                    type="text"
                                    value={editingEntity.tempTitle}
                                    onChange={(e) => setEditingEntity({ ...editingEntity, tempTitle: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && saveEditing()}
                                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 w-full"
                                    autoFocus
                                  />
                                  <button
                                    onClick={saveEditing}
                                    className="p-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                    aria-label="Save content changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingEntity(null)}
                                    className="p-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:bg-zinc-700 transition-colors"
                                    aria-label="Cancel content editing"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-0.5">
                                  <span
                                    onDoubleClick={() => startEditing("lesson", lesson.id, lesson.title, mod.id)}
                                    className="text-sm font-semibold text-zinc-300 group-hover/lesson:text-zinc-100 flex items-center gap-2 cursor-text"
                                  >
                                    {lesson.title}
                                    <button
                                      onClick={() => startEditing("lesson", lesson.id, lesson.title, mod.id)}
                                      className="opacity-0 group-hover/lesson:opacity-100 p-0.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-zinc-300 transition-all"
                                      title="Rename Lesson"
                                      aria-label="Rename content item"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Options and Editing Controls */}
                            <div className="flex items-center gap-4">
                              {/* Duration Input */}
                              <input
                                type="text"
                                value={lesson.duration}
                                onChange={(e) => handleChangeLessonDuration(mod.id, lesson.id, e.target.value)}
                                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 rounded-md px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-300 font-medium focus:outline-none w-20 text-center transition-colors"
                                placeholder="10 mins"
                                title="Edit duration"
                              />

                              {/* Lesson Type selector */}
                              <select
                                value={lesson.type}
                                onChange={(e) => handleChangeLessonType(mod.id, lesson.id, e.target.value)}
                                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md px-2 py-0.5 text-xs text-zinc-400 font-medium focus:outline-none cursor-pointer transition-all"
                              >
                                <option value="video">🎥 Video</option>
                                <option value="article">📄 Text Article</option>
                                <option value="quiz">❓ Quiz</option>
                                <option value="code">💻 Code Lab</option>
                              </select>

                              {/* Delete Lesson Button */}
                              <button
                                onClick={() => handleDeleteLesson(mod.id, lesson.id)}
                                className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md text-zinc-600 hover:text-red-400 opacity-0 group-hover/lesson:opacity-100 transition-all duration-150"
                                title="Delete Lesson"
                                aria-label="Delete content item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Empty Module Lessons State */}
                      {mod.lessons.length === 0 && (
                        <div className="border border-dashed border-zinc-800/50 rounded-xl p-8 text-center text-zinc-500 text-xs">
                          📁 This module contains no lessons. Drag existing lessons here or click below to create one!
                        </div>
                      )}
                    </div>

                    {/* Add Lesson Actions Strip */}
                    <div className="pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold pr-2">Add Content:</span>
                      <button
                        onClick={() => handleAddLesson(mod.id, "video")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-400 hover:text-sky-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        + Video
                      </button>
                      <button
                        onClick={() => handleAddLesson(mod.id, "article")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        + Article
                      </button>
                      <button
                        onClick={() => handleAddLesson(mod.id, "quiz")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        + Quiz
                      </button>
                      <button
                        onClick={() => handleAddLesson(mod.id, "code")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 hover:text-purple-300 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Code className="w-3.5 h-3.5" />
                        + Code Lab
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty Syllabus State */}
          {modules.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 bg-zinc-900/10 border border-zinc-800 border-dashed rounded-2xl text-center space-y-3">
              <BookOpen className="w-10 h-10 text-zinc-600" />
              <div className="space-y-1">
                <h4 className="text-zinc-300 font-bold">No modules available</h4>
                <p className="text-zinc-500 text-sm max-w-sm">This course does not have a structured syllabus yet. Create your first module to begin!</p>
              </div>
              <button
                onClick={handleAddModule}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-100 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10"
              >
                <Plus className="w-4 h-4" />
                Initialize First Module
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Module Action Button */}
      {!loading && modules.length > 0 && (
        <button
          onClick={handleAddModule}
          className="w-full flex items-center justify-center gap-2 py-4 border border-dashed border-zinc-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-zinc-400 hover:text-indigo-400 text-sm font-bold rounded-2xl transition-all shadow-inner group duration-300"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 text-indigo-400" />
          Add Structural Module Container
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
        </button>
      )}
    </div>
  );
}
