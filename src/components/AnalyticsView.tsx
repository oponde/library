import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Pause, Play, TrendingUp, Users, BookOpen, CheckCircle2 } from 'lucide-react';
import { ActivityEvent, Course, LiveDataPoint } from '../types';

interface AnalyticsViewProps {
  courses: Course[];
  completedLessons: Record<string, boolean>;
  liveSeries: LiveDataPoint[];
  isStreaming: boolean;
  onToggleStream: () => void;
  activityFeed: ActivityEvent[];
  onOpenCourse: (courseId: number) => void;
}

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#4f46e5', '#0284c7', '#64748b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  courses,
  completedLessons,
  liveSeries,
  isStreaming,
  onToggleStream,
  activityFeed,
  onOpenCourse,
}) => {
  const [timeframe, setTimeframe] = useState<'live' | '24h' | '7d'>('live');

  const totalStudents = useMemo(
    () => courses.reduce((sum, c) => sum + c.students, 0),
    [courses]
  );

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + c.lessons.length, 0),
    [courses]
  );

  const completedCount = useMemo(
    () => Object.values(completedLessons).filter(Boolean).length,
    [completedLessons]
  );

  const avgCompletion = useMemo(() => {
    if (!courses.length) return 0;
    const sum = courses.reduce((acc, c) => acc + c.completionRate, 0);
    return Math.round(sum / courses.length);
  }, [courses]);

  const currentActive = liveSeries.length
    ? liveSeries[liveSeries.length - 1].activeLearners
    : 0;

  const displayedSeries = useMemo(() => {
    if (timeframe === 'live') return liveSeries;
    if (timeframe === '24h') {
      return [
        { time: '00:00', activeLearners: 42, lessonsCompleted: 18, engagementScore: 76 },
        { time: '04:00', activeLearners: 31, lessonsCompleted: 12, engagementScore: 72 },
        { time: '08:00', activeLearners: 88, lessonsCompleted: 46, engagementScore: 84 },
        { time: '12:00', activeLearners: 134, lessonsCompleted: 79, engagementScore: 91 },
        { time: '16:00', activeLearners: 156, lessonsCompleted: 94, engagementScore: 94 },
        { time: '20:00', activeLearners: 118, lessonsCompleted: 68, engagementScore: 88 },
        { time: 'Now', activeLearners: currentActive, lessonsCompleted: 54, engagementScore: 90 },
      ];
    }
    return [
      { time: 'Mon', activeLearners: 410, lessonsCompleted: 230, engagementScore: 82 },
      { time: 'Tue', activeLearners: 465, lessonsCompleted: 278, engagementScore: 85 },
      { time: 'Wed', activeLearners: 520, lessonsCompleted: 312, engagementScore: 89 },
      { time: 'Thu', activeLearners: 495, lessonsCompleted: 294, engagementScore: 87 },
      { time: 'Fri', activeLearners: 580, lessonsCompleted: 356, engagementScore: 92 },
      { time: 'Sat', activeLearners: 390, lessonsCompleted: 210, engagementScore: 81 },
      { time: 'Sun', activeLearners: 448, lessonsCompleted: 264, engagementScore: 86 },
    ];
  }, [timeframe, liveSeries, currentActive]);

  const courseBarData = useMemo(
    () =>
      courses.map((c) => ({
        id: c.id,
        name: c.title.length > 20 ? c.title.slice(0, 18) + '…' : c.title,
        fullName: c.title,
        students: c.students,
        completion: c.completionRate,
      })),
    [courses]
  );

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    courses.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + c.lessons.length;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [courses]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-blue-600 mb-1">
            Real-Time Learning Intelligence
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Platform Analytics &amp; Live Telemetry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor concurrent learners, course completion velocity, and live curriculum engagement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {(
              [
                { id: 'live', label: 'Live Stream' },
                { id: '24h', label: '24 Hours' },
                { id: '7d', label: '7 Days' },
              ] as const
            ).map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timeframe === tf.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleStream}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isStreaming
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isStreaming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Pause className="w-3.5 h-3.5" />
                Live Streaming
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Stream Paused
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Active Learners Now</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {currentActive}
          </div>
          <p className="text-xs text-emerald-600 font-medium mt-2">
            +12.4% vs. previous hour
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Total Enrollments</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {totalStudents.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Across {courses.length} active courses
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Avg. Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {avgCompletion}%
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {completedCount} lessons completed by you
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-3">
            <span>Published Lessons</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
            {totalLessons}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Video &amp; interactive web sessions
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Engagement Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Real-Time Learner Activity &amp; Completions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Concurrent active students vs. completed lesson events
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" />
                Active Learners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                Completions
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedSeries} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="activeLearners"
                  name="Active Learners"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="lessonsCompleted"
                  name="Lessons Completed"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorComplete)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Donut */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Curriculum by Subject
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lesson distribution across academic categories
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            {categoryData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-mono tabular-nums text-slate-500">
                  {item.value} lessons
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Course Performance Bar Chart + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-slate-900">
              Course Enrollment &amp; Completion Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any course in the catalog to inspect lessons and update live progress
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={courseBarData} margin={{ top: 5, right: 10, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="students"
                  name="Enrolled Students"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="completion"
                  name="Completion Rate (%)"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Live Activity Stream
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time student &amp; educator events
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-64 pr-1">
            {activityFeed.map((ev) => {
              const matchedCourse = courses.find((c) => c.title === ev.courseTitle);
              return (
                <div key={ev.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-semibold text-slate-900">{ev.user}</span>{' '}
                      {ev.action}{' '}
                      {matchedCourse ? (
                        <button
                          onClick={() => onOpenCourse(matchedCourse.id)}
                          className="font-medium text-blue-600 hover:underline text-left cursor-pointer"
                        >
                          {ev.courseTitle}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-900">{ev.courseTitle}</span>
                      )}
                    </div>
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                        ev.type === 'completion'
                          ? 'text-emerald-600'
                          : ev.type === 'publish'
                          ? 'text-indigo-600'
                          : 'text-blue-600'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-1">
                    {ev.timestamp}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
