import React, { useRef, useState } from 'react';
import {
  BookOpen,
  Film,
  HardDrive,
  Link as LinkIcon,
  LogOut,
  Plus,
  Play,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { Course, Lesson, Teacher } from '../types';
import { CATEGORIES, idbSave } from '../lib/storage';

interface TeacherDashboardProps {
  teacher: Teacher;
  courses: Course[];
  onPublishLesson: (params: {
    title: string;
    category: string;
    desc: string;
    lessons: Lesson[];
  }) => void;
  onDeleteCourse: (courseId: number) => void;
  onPreviewCourse: (courseId: number) => void;
  onLogout: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacher,
  courses,
  onPublishLesson,
  onDeleteCourse,
  onPreviewCourse,
  onLogout,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'courses'>('upload');

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [pendingLinks, setPendingLinks] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const myCourses = courses.filter((c) => c.teacher === teacher.name);
  const myVideos = myCourses.reduce(
    (sum, c) => sum + c.lessons.filter((l) => l.type === 'video').length,
    0
  );
  const myLinks = myCourses.reduce(
    (sum, c) => sum + c.lessons.filter((l) => l.type === 'link').length,
    0
  );
  const myStudents = myCourses.reduce((sum, c) => sum + c.students, 0);

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    setPendingLinks((prev) => [...prev, trimmed]);
    setLinkInput('');
  };

  const handleRemoveLink = (idx: number) => {
    setPendingLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else if (file) {
      onNotify('Please select a valid video file (MP4, WEBM, MOV, MKV).', true);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category || !lessonTitle.trim()) {
      onNotify('Please fill in Course Title, Category, and Lesson Title.', true);
      return;
    }
    if (!selectedFile && pendingLinks.length === 0) {
      onNotify('Please attach a video file or add at least one online link.', true);
      return;
    }

    setUploading(true);
    const builtLessons: Lesson[] = [];

    if (selectedFile) {
      const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      setUploadProgress(25);
      try {
        await idbSave(videoId, selectedFile);
        setUploadProgress(100);
        const blobUrl = URL.createObjectURL(selectedFile);
        builtLessons.push({
          id: `${Date.now()}-v`,
          title: lessonTitle.trim(),
          duration: duration.trim() || '15 min',
          type: 'video',
          videoId,
          blobUrl,
          src: '',
        });
      } catch (err) {
        setUploading(false);
        setUploadProgress(0);
        onNotify(
          `Could not save video: ${err instanceof Error ? err.message : 'Storage error'}`,
          true
        );
        return;
      }
    }

    pendingLinks.forEach((lnk, idx) => {
      builtLessons.push({
        id: `${Date.now()}-l-${idx}`,
        title:
          pendingLinks.length > 1
            ? `${lessonTitle.trim()} (Link ${idx + 1})`
            : lessonTitle.trim(),
        duration: duration.trim() || '20 min',
        type: 'link',
        videoId: null,
        src: lnk,
      });
    });

    onPublishLesson({
      title: title.trim(),
      category,
      desc: desc.trim() || 'No description provided.',
      lessons: builtLessons,
    });

    // Reset form
    setTitle('');
    setCategory('');
    setLessonTitle('');
    setDuration('');
    setDesc('');
    setPendingLinks([]);
    clearFile();
    setUploading(false);
    setActiveTab('courses');
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold text-blue-600 mb-1">Teacher Studio</p>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {teacher.name}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{teacher.department}</p>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:text-red-600 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>My Courses</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {myCourses.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Video Lessons</span>
            <Film className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {myVideos}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Online Links</span>
            <LinkIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {myLinks}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {myStudents || 48}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Add New Content
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'courses'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Courses ({myCourses.length})
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <form
          onSubmit={handlePublish}
          className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6"
        >
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 leading-relaxed">
            <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Videos are stored <strong>directly in this browser</strong> via IndexedDB — they persist across page refreshes and play immediately. For multi-device sharing, attach a YouTube, Zoom, or Google Meet link below.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Course Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Physics"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject / Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="">Select category…</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Lesson Title *
              </label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="e.g. Lesson 1: Newton's Laws"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 15 min"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Course Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Briefly describe what students will learn…"
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 resize-y"
            />
          </div>

          {/* Drag & Drop Video Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Upload Video File (MP4, WEBM, MOV, MKV)
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-slate-100/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setSelectedFile(f);
                }}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Click to browse or drag and drop a video file
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Stored permanently in browser IndexedDB
              </p>
            </div>

            {selectedFile && (
              <div className="mt-3 flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Film className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-emerald-700 font-mono tabular-nums">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB · Ready to save
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploading && (
              <div className="mt-3">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1 font-mono tabular-nums">
                  <span>Saving video to IndexedDB…</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Online Links */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Or Attach Online Lecture Link (YouTube, Zoom, Google Meet)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Link
              </button>
            </div>

            {pendingLinks.length > 0 && (
              <div className="mt-3 space-y-2">
                {pendingLinks.map((lnk, idx) => (
                  <div
                    key={`${lnk}-${idx}`}
                    className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs"
                  >
                    <a
                      href={lnk}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {lnk}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {uploading ? 'Publishing…' : 'Publish Course & Lesson'}
            </button>
          </div>
        </form>
      )}

      {/* My Courses Tab */}
      {activeTab === 'courses' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {myCourses.length === 0 ? (
            <div className="p-12 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">No courses published yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Use the Add New Content tab to publish your first video lesson or online link.
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Create First Course
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {myCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div>
                    <div className="text-xs text-slate-500 mb-0.5 flex items-center gap-2">
                      <span className="font-semibold text-blue-600">{c.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {c.lessons.length} lesson{c.lessons.length !== 1 ? 's' : ''}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{c.students} students</span>
                      <span aria-hidden="true">·</span>
                      <span>{c.isSeeded ? 'Default' : 'Live'}</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{c.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPreviewCourse(c.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    {!c.isSeeded && (
                      <button
                        onClick={() => onDeleteCourse(c.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-white border border-slate-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
