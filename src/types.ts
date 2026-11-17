export type LessonType = 'video' | 'link';

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: LessonType;
  videoId: string | null;
  src: string;
  blobUrl?: string;
}

export interface Course {
  id: number;
  isSeeded: boolean;
  title: string;
  category: string;
  teacher: string;
  teacherInitials: string;
  rating: number;
  students: number;
  completionRate: number;
  desc: string;
  createdAt: number;
  lessons: Lesson[];
}

export interface Teacher {
  email: string;
  pass: string;
  name: string;
  department: string;
}

export interface LiveDataPoint {
  time: string;
  activeLearners: number;
  lessonsCompleted: number;
  engagementScore: number;
}

export interface ActivityEvent {
  id: string;
  user: string;
  action: string;
  courseTitle: string;
  timestamp: string;
  type: 'completion' | 'enrollment' | 'publish';
}

export type PageView = 'home' | 'courses' | 'analytics' | 'detail' | 'login' | 'dashboard';
