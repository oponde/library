import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Film,
  Link as LinkIcon,
  Play,
  Star,
  Users,
} from 'lucide-react';
import { Course, Lesson } from '../types';
import { convertYouTubeUrl, idbLoad } from '../lib/storage';

interface CourseDetailProps {
  course: Course;
  completedLessons: Record<string, boolean>;
  lessonNotes: Record<string, string>;
  onToggleLessonComplete: (lessonId: string, courseTitle: string) => void;
  onUpdateNote: (lessonId: string, text: string) => void;
  onBack: () => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  completedLessons,
  lessonNotes,
  onToggleLessonComplete,
  onUpdateNote,
  onBack,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const activeLesson: Lesson | undefined = course.lessons[activeIndex];

  const completedInCourse = course.lessons.filter((l) => completedLessons[l.id]).length;
  const progressPct = course.lessons.length
    ? Math.round((completedInCourse / course.lessons.length) * 100)
    : 0;

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    async function resolveLessonMedia() {
      setVideoError(null);
      setVideoSrc(null);

      if (!activeLesson) return;

      if (activeLesson.type === 'link') {
        return;
      }

      if (activeLesson.videoId) {
        if (activeLesson.blobUrl) {
          setVideoSrc(activeLesson.blobUrl);
          return;
        }
        setLoadingVideo(true);
        try {
          const blob = await idbLoad(activeLesson.videoId);
          if (cancelled) return;
          setLoadingVideo(false);
          if (!blob) {
            setVideoError('Video file not found in browser storage. Please re-upload from the Teacher Studio.');
            return;
          }
          const url = URL.createObjectURL(blob);
          revokedUrl = url;
          setVideoSrc(url);
        } catch (err) {
          if (!cancelled) {
            setLoadingVideo(false);
            setVideoError(
              err instanceof Error ? err.message : 'Unable to load video from browser storage.'
            );
          }
        }
        return;
      }

      if (activeLesson.src) {
        setVideoSrc(activeLesson.src);
      }
    }

    resolveLessonMedia();

    return () => {
      cancelled = true;
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [activeLesson]);

  const isYouTube =
    activeLesson?.type === 'video' &&
    Boolean(videoSrc && (videoSrc.includes('youtube') || videoSrc.includes('youtu.be')));

  const isBlobOrDirectVideo =
    activeLesson?.type === 'video' && Boolean(activeLesson.videoId && videoSrc);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb Back Action */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Video Stage + Course Info + Interactive Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Stage */}
          <div className="bg-slate-950 rounded-xl overflow-hidden aspect-video relative border border-slate-200">
            {loadingVideo ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-3">
                <div className="w-10 h-10 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading video from browser storage…</p>
              </div>
            ) : !activeLesson ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                <Play className="w-10 h-10 mb-3 text-slate-400" />
                <p className="text-sm font-medium">No lessons available in this course.</p>
              </div>
            ) : activeLesson.type === 'link' && activeLesson.src ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-8 text-center">
                <LinkIcon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{activeLesson.title}</h3>
                <p className="text-sm text-slate-300 max-w-md mb-6">
                  This lesson is an external interactive resource or live lecture session.
                </p>
                <a
                  href={activeLesson.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Open Lesson Resource
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : videoError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-200 p-8 text-center">
                <p className="text-sm font-semibold text-amber-400 mb-2">Media Unavailable</p>
                <p className="text-xs text-slate-400 max-w-md">{videoError}</p>
              </div>
            ) : isBlobOrDirectVideo && videoSrc ? (
              <video
                key={videoSrc}
                controls
                autoPlay
                src={videoSrc}
                className="w-full h-full bg-black"
                title={activeLesson.title}
              />
            ) : isYouTube && videoSrc ? (
              <iframe
                key={videoSrc}
                src={`${convertYouTubeUrl(videoSrc)}?rel=0`}
                title={activeLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : videoSrc ? (
              <iframe
                key={videoSrc}
                src={videoSrc}
                title={activeLesson.title}
                className="w-full h-full border-0"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-8 text-center">
                <Film className="w-10 h-10 text-slate-500 mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  On-demand video recording is being prepared by {course.teacher}. You can still mark this lesson complete or take study notes below.
                </p>
              </div>
            )}
          </div>

          {/* Active Lesson Action Bar */}
          {activeLesson && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">
                  Lesson {activeIndex + 1} of {course.lessons.length} · {activeLesson.duration}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{activeLesson.title}</h2>
              </div>

              <button
                onClick={() => onToggleLessonComplete(activeLesson.id, course.title)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  completedLessons[activeLesson.id]
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                }`}
              >
                {completedLessons[activeLesson.id] ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4" />
                    Mark as Complete
                  </>
                )}
              </button>
            </div>
          )}

          {/* Course Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-blue-600">{course.category}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {course.rating.toFixed(1)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {course.students} students
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{course.desc}</p>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {course.teacherInitials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{course.teacher}</div>
                <div className="text-xs text-slate-500">{course.category} Instructor</div>
              </div>
            </div>
          </div>

          {/* Interactive Study Notes */}
          {activeLesson && (
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Study Notes — {activeLesson.title}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Saved automatically</span>
              </div>
              <textarea
                value={lessonNotes[activeLesson.id] || ''}
                onChange={(e) => onUpdateNote(activeLesson.id, e.target.value)}
                placeholder="Write key takeaways, formulas, or questions for this lesson…"
                className="w-full min-h-[110px] p-3.5 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-colors resize-y"
              />
            </div>
          )}
        </div>

        {/* Right: Course Curriculum & Progress Sidebar */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden lg:sticky lg:top-20">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">Course Curriculum</h3>
              <span className="text-xs font-mono tabular-nums font-semibold text-blue-600">
                {progressPct}% complete
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 tabular-nums">
              {completedInCourse} of {course.lessons.length} lessons completed
            </p>
          </div>

          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {course.lessons.map((lesson, idx) => {
              const isActive = idx === activeIndex;
              const isDone = Boolean(completedLessons[lesson.id]);
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span
                        className={`w-5 h-5 rounded-full text-[11px] font-mono tabular-nums font-semibold flex items-center justify-center ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-blue-700 font-semibold' : 'text-slate-900'
                      }`}
                    >
                      {lesson.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{lesson.type === 'video' ? 'Video' : 'Online Link'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{lesson.duration}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
