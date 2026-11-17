import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Film,
  Link as LinkIcon,
  Play,
  Search,
  Star,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from 'recharts';
import {
  ActivityEvent,
  Course,
  Lesson,
  LiveDataPoint,
  PageView,
  Teacher,
} from './types';
import {
  idbDelete,
  loadCompletedLessons,
  loadLessonNotes,
  loadSavedCourses,
  openIDB,
  saveCompletedLessons,
  saveCustomCourses,
  saveLessonNotes,
  SEED_COURSES,
} from './lib/storage';
import { AnalyticsView } from './components/AnalyticsView';
import { CourseDetail } from './components/CourseDetail';
import { TeacherLogin } from './components/TeacherLogin';
import { TeacherDashboard } from './components/TeacherDashboard';
import { OfflineIndicator, PWAInstallButton } from './components/PWAControls';

const SAMPLE_STUDENTS = [
  'Nadia M.',
  'Samuel K.',
  'Chloe T.',
  'David O.',
  'Fatima A.',
  'Lucas B.',
  'Grace E.',
];

function formatNow(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function createInitialLiveSeries(): LiveDataPoint[] {
  const now = Date.now();
  return Array.from({ length: 12 }, (_, idx) => {
    const t = new Date(now - (11 - idx) * 2500).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const active = 112 + Math.round(Math.sin(idx * 0.7) * 14 + (idx % 3) * 3);
    const completed = 24 + Math.round(Math.cos(idx * 0.5) * 6 + idx);
    return {
      time: t,
      activeLearners: active,
      lessonsCompleted: completed,
      engagementScore: 84 + (idx % 9),
    };
  });
}

export default function App() {
  const [page, setPage] = useState<PageView>('home');
  const [courses, setCourses] = useState<Course[]>(() => [
    ...SEED_COURSES,
    ...loadSavedCourses(),
  ]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'students' | 'newest' | 'lessons'>('rating');

  // Student progress & notes
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>(() =>
    loadCompletedLessons()
  );
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>(() =>
    loadLessonNotes()
  );

  // Real-time telemetry state
  const [isStreaming, setIsStreaming] = useState(true);
  const [liveSeries, setLiveSeries] = useState<LiveDataPoint[]>(() =>
    createInitialLiveSeries()
  );
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([
    {
      id: 'init-1',
      user: 'Nadia M.',
      action: 'completed a lesson in',
      courseTitle: 'Basic Physics Principles',
      timestamp: 'Just now',
      type: 'completion',
    },
    {
      id: 'init-2',
      user: 'Samuel K.',
      action: 'enrolled in',
      courseTitle: 'Web Development Basics',
      timestamp: '1 min ago',
      type: 'enrollment',
    },
    {
      id: 'init-3',
      user: 'Chloe T.',
      action: 'completed a lesson in',
      courseTitle: 'Introduction to Algebra',
      timestamp: '3 min ago',
      type: 'completion',
    },
  ]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);

  const notify = (msg: string, isError = false) => {
    setToast({ msg, isError });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    openIDB().catch(() => {});
  }, []);

  // Real-time telemetry stream
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setLiveSeries((prev) => {
        const last = prev[prev.length - 1];
        const deltaActive = Math.round((Math.random() - 0.45) * 8);
        const nextActive = Math.max(85, Math.min(185, last.activeLearners + deltaActive));
        const nextCompleted = Math.max(
          12,
          Math.min(75, last.lessonsCompleted + Math.round((Math.random() - 0.4) * 5))
        );
        const nextPoint: LiveDataPoint = {
          time: formatNow(),
          activeLearners: nextActive,
          lessonsCompleted: nextCompleted,
          engagementScore: Math.min(99, Math.max(70, Math.round((nextActive / 185) * 100))),
        };
        return [...prev.slice(-15), nextPoint];
      });

      // Occasionally push a live student event
      if (Math.random() > 0.55) {
        setCourses((currCourses) => {
          if (!currCourses.length) return currCourses;
          const randomCourse =
            currCourses[Math.floor(Math.random() * currCourses.length)];
          const student =
            SAMPLE_STUDENTS[Math.floor(Math.random() * SAMPLE_STUDENTS.length)];
          const isCompletion = Math.random() > 0.35;
          setActivityFeed((prev) => [
            {
              id: `ev-${Date.now()}`,
              user: student,
              action: isCompletion ? 'completed a lesson in' : 'enrolled in',
              courseTitle: randomCourse.title,
              timestamp: formatNow(),
              type: isCompletion ? 'completion' : 'enrollment',
            },
            ...prev.slice(0, 14),
          ]);
          return currCourses;
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(courses.map((c) => c.category)))],
    [courses]
  );

  const filteredCourses = useMemo(() => {
    let list =
      categoryFilter === 'All'
        ? courses
        : courses.filter((c) => c.category === categoryFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.teacher.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'students') return b.students - a.students;
      if (sortBy === 'lessons') return b.lessons.length - a.lessons.length;
      return b.createdAt - a.createdAt;
    });
  }, [courses, categoryFilter, searchQuery, sortBy]);

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessons.length, 0),
    [courses]
  );
  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + c.students, 0),
    [courses]
  );
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const openCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    setPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLessonComplete = (lessonId: string, courseTitle: string) => {
    setCompletedLessons((prev) => {
      const nextVal = !prev[lessonId];
      const updated = { ...prev, [lessonId]: nextVal };
      saveCompletedLessons(updated);

      if (nextVal) {
        setActivityFeed((feed) => [
          {
            id: `self-${Date.now()}`,
            user: 'You',
            action: 'completed a lesson in',
            courseTitle,
            timestamp: formatNow(),
            type: 'completion',
          },
          ...feed.slice(0, 14),
        ]);
        notify('Lesson marked as complete.');
      }
      return updated;
    });
  };

  const handleUpdateNote = (lessonId: string, text: string) => {
    setLessonNotes((prev) => {
      const updated = { ...prev, [lessonId]: text };
      saveLessonNotes(updated);
      return updated;
    });
  };

  const handlePublishLesson = ({
    title,
    category,
    desc,
    lessons,
  }: {
    title: string;
    category: string;
    desc: string;
    lessons: Lesson[];
  }) => {
    if (!currentTeacher) return;
    const initials = currentTeacher.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    setCourses((prev) => {
      const existingIdx = prev.findIndex(
        (c) => !c.isSeeded && c.title === title && c.teacher === currentTeacher.name
      );
      let nextCourses: Course[];
      if (existingIdx >= 0) {
        nextCourses = prev.map((c, idx) =>
          idx === existingIdx ? { ...c, lessons: [...c.lessons, ...lessons] } : c
        );
      } else {
        const newCourse: Course = {
          id: Date.now(),
          isSeeded: false,
          title,
          category,
          teacher: currentTeacher.name,
          teacherInitials: initials,
          rating: 5.0,
          students: 1,
          completionRate: 100,
          desc,
          createdAt: Date.now(),
          lessons,
        };
        nextCourses = [newCourse, ...prev];
      }
      saveCustomCourses(nextCourses);
      return nextCourses;
    });

    setActivityFeed((feed) => [
      {
        id: `pub-${Date.now()}`,
        user: currentTeacher.name,
        action: 'published new content in',
        courseTitle: title,
        timestamp: formatNow(),
        type: 'publish',
      },
      ...feed.slice(0, 14),
    ]);

    notify('Course published and stored in browser.');
  };

  const handleDeleteCourse = async (courseId: number) => {
    const target = courses.find((c) => c.id === courseId);
    if (!target || target.isSeeded) {
      notify('Default courses are protected and cannot be deleted.', true);
      return;
    }

    for (const lesson of target.lessons) {
      if (lesson.videoId) {
        try {
          await idbDelete(lesson.videoId);
        } catch {
          // ignore cleanup failure
        }
      }
    }

    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== courseId);
      saveCustomCourses(next);
      return next;
    });
    notify(`Deleted "${target.title}".`);
  };

  const renderCourseCard = (c: Course) => {
    const videoCount = c.lessons.filter((l) => l.type === 'video').length;
    const linkCount = c.lessons.filter((l) => l.type === 'link').length;
    const doneCount = c.lessons.filter((l) => completedLessons[l.id]).length;
    const progress = c.lessons.length ? Math.round((doneCount / c.lessons.length) * 100) : 0;

    return (
      <article
        key={c.id}
        onClick={() => openCourse(c.id)}
        className="group bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span className="font-semibold text-blue-600">{c.category}</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-700 font-medium">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              {c.rating.toFixed(1)}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1.5 leading-snug">
            {c.title}
          </h3>
          <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
            {c.desc}
          </p>

          <div className="flex items-center gap-2.5 text-xs text-slate-600 mb-4">
            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {c.teacherInitials}
            </span>
            <span className="font-medium truncate">{c.teacher}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          {progress > 0 && (
            <div>
              <div className="flex justify-between text-[11px] text-slate-500 mb-1 font-mono tabular-nums">
                <span>Your Progress</span>
                <span className="font-semibold text-blue-600">{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-3 font-mono tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Film className="w-3.5 h-3.5 text-slate-400" />
                {videoCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                {linkCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {c.students}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              <Play className="w-3 h-3 fill-blue-600" />
              Start
            </span>
          </div>
        </div>
      </article>
    );
  };

  const currentActiveLearners = liveSeries.length
    ? liveSeries[liveSeries.length - 1].activeLearners
    : 124;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            onClick={() => setPage('home')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Edu<span className="text-blue-600">Verse</span>
          </button>

          {/* Zone 2: Clean single-line nav links */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setPage('home')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                page === 'home'
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setPage('courses')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                page === 'courses'
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Courses
            </button>
            <button
              onClick={() => setPage('analytics')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                page === 'analytics'
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              onClick={() => setPage(currentTeacher ? 'dashboard' : 'login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {currentTeacher ? currentTeacher.name : 'Teacher Portal'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Page Head Banner (displayed at the top of every page) */}
        <div className="w-full relative h-44 sm:h-56 md:h-64 bg-slate-900 overflow-hidden border-b border-slate-200">
          <img
            src="/assets/aistudio/Designer__1__de9c71d4.png"
            alt="Students learning in the NCUDA computer library"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/15 to-transparent pointer-events-none" />
        </div>

        {/* HOME PAGE */}
        {page === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-6 py-14 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-blue-600 mb-3">
                    Interactive Learning &amp; Live Analytics
                  </p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight max-w-2xl [text-wrap:balance]">
                    Learn without limits, backed by real-time insights.
                  </h1>
                  <p className="text-base text-slate-600 mt-4 max-w-xl leading-relaxed">
                    Access expert-led video lessons, interactive study notes, and live classroom analytics from one unified platform.
                  </p>

                  {/* Search Bar */}
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search courses, topics, or instructors…"
                        className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                      />
                    </div>
                    <button
                      onClick={() => setPage('courses')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Explore Catalog
                    </button>
                  </div>
                </div>

                {/* Live Telemetry Preview Card */}
                <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Live Learner Activity
                      </div>
                      <button
                        onClick={() => setPage('analytics')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 cursor-pointer"
                      >
                        Full Analytics
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-4xl font-bold font-mono tabular-nums">
                        {currentActiveLearners}
                      </span>
                      <span className="text-xs text-slate-400">
                        learners active right now
                      </span>
                    </div>

                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={liveSeries}>
                          <defs>
                            <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="activeLearners"
                            stroke="#60a5fa"
                            strokeWidth={2}
                            fill="url(#heroSpark)"
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Streaming every 2.5s</span>
                    <button
                      onClick={() => setPage('analytics')}
                      className="inline-flex items-center gap-1.5 text-white font-medium hover:text-blue-300 cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Open Telemetry Hub
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Full-Width 4-Column KPI Strip */}
            <section className="border-b border-slate-200 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {courses.length}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Published Courses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {totalStudents.toLocaleString()}+
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Enrolled Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {totalLessons}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Video &amp; Link Lessons</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    12
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Verified Instructors</div>
                </div>
              </div>
            </section>

            {/* Featured Courses Section */}
            <section className="max-w-7xl mx-auto px-6 py-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Browse Courses</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Filter by subject or click any course to start watching and tracking progress.
                  </p>
                </div>
                <button
                  onClick={() => setPage('courses')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  View all courses
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredCourses.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-900">No matching courses found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing your search query or selecting another category.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCourses.map(renderCourseCard)}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ALL COURSES CATALOG */}
        {page === 'courses' && (
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-1">Course Catalog</p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">All Courses</h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search catalog…"
                    className="pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 w-56"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'rating' | 'students' | 'newest' | 'lessons')
                  }
                  className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="rating">Sort: Highest Rated</option>
                  <option value="students">Sort: Most Students</option>
                  <option value="lessons">Sort: Most Lessons</option>
                  <option value="newest">Sort: Newest</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredCourses.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-900">No courses match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredCourses.map(renderCourseCard)}
              </div>
            )}
          </div>
        )}

        {/* REAL-TIME ANALYTICS VIEW */}
        {page === 'analytics' && (
          <AnalyticsView
            courses={courses}
            completedLessons={completedLessons}
            liveSeries={liveSeries}
            isStreaming={isStreaming}
            onToggleStream={() => setIsStreaming((s) => !s)}
            activityFeed={activityFeed}
            onOpenCourse={openCourse}
          />
        )}

        {/* COURSE DETAIL STUDIO */}
        {page === 'detail' && activeCourse && (
          <CourseDetail
            course={activeCourse}
            completedLessons={completedLessons}
            lessonNotes={lessonNotes}
            onToggleLessonComplete={handleToggleLessonComplete}
            onUpdateNote={handleUpdateNote}
            onBack={() => setPage('courses')}
          />
        )}

        {/* TEACHER LOGIN */}
        {page === 'login' && (
          <TeacherLogin
            onLogin={(teacher) => {
              setCurrentTeacher(teacher);
              setPage('dashboard');
              notify(`Signed in as ${teacher.name}.`);
            }}
            onCancel={() => setPage('home')}
          />
        )}

        {/* TEACHER DASHBOARD */}
        {page === 'dashboard' && currentTeacher && (
          <TeacherDashboard
            teacher={currentTeacher}
            courses={courses}
            onPublishLesson={handlePublishLesson}
            onDeleteCourse={handleDeleteCourse}
            onPreviewCourse={openCourse}
            onLogout={() => {
              setCurrentTeacher(null);
              setPage('home');
              notify('Signed out of Teacher Studio.');
            }}
            onNotify={notify}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} EduVerse Learning Platform</span>
          <div className="flex items-center gap-6">
            <button onClick={() => setPage('home')} className="hover:text-slate-900 cursor-pointer">
              Home
            </button>
            <button onClick={() => setPage('courses')} className="hover:text-slate-900 cursor-pointer">
              Courses
            </button>
            <button onClick={() => setPage('analytics')} className="hover:text-slate-900 cursor-pointer">
              Analytics
            </button>
            <button
              onClick={() => setPage(currentTeacher ? 'dashboard' : 'login')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Teacher Studio
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </footer>

      {/* Offline Status Banner */}
      <OfflineIndicator />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs font-semibold text-white shadow-lg max-w-sm ${
            toast.isError ? 'bg-red-600' : 'bg-slate-900'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
