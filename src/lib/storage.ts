import { Course, Teacher } from '../types';

const IDB_NAME = 'EduVerseDB';
const IDB_VERSION = 1;
const IDB_STORE = 'videos';

const LS_COURSES_KEY = 'eduverse_courses_v4';
const LS_PROGRESS_KEY = 'eduverse_progress_v1';
const LS_NOTES_KEY = 'eduverse_notes_v1';

let idbInstance: IDBDatabase | null = null;

export function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (idbInstance) {
      resolve(idbInstance);
      return;
    }
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => {
      idbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(idbInstance);
    };
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

export async function idbSave(videoId: string, blob: Blob): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).put(blob, videoId);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function idbLoad(videoId: string): Promise<Blob | null> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(videoId);
    req.onsuccess = (e) => resolve((e.target as IDBRequest).result || null);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function idbDelete(videoId: string): Promise<void> {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const req = tx.objectStore(IDB_STORE).delete(videoId);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export const TEACHER_DB: Teacher[] = [
  {
    email: 'teacher@edu.com',
    pass: 'teach123',
    name: 'Prof. Martin Fon',
    department: 'Applied Sciences & Engineering',
  },
  {
    email: 'admin@school.cm',
    pass: 'admin2024',
    name: 'Dr. Amina Bello',
    department: 'Physics & Quantitative Research',
  },
];

export const CATEGORIES = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Computer Science',
  'Arts',
  'Languages',
  'Business',
  'Health & PE',
  'Other',
];

export const SEED_COURSES: Course[] = [
  {
    id: 1,
    isSeeded: true,
    title: 'Introduction to Algebra',
    category: 'Mathematics',
    teacher: 'Mr. James Okonkwo',
    teacherInitials: 'JO',
    rating: 4.8,
    students: 142,
    completionRate: 78,
    createdAt: Date.now() - 86400000 * 14,
    desc: 'Master the fundamentals of algebra — variables, linear equations, functions, inequalities, and structured problem solving.',
    lessons: [
      { id: '1-0', title: 'What is Algebra?', duration: '12 min', type: 'video', videoId: null, src: '' },
      { id: '1-1', title: 'Variables & Expressions', duration: '18 min', type: 'video', videoId: null, src: 'https://www.youtube.com/embed/NybHckSEQBI' },
      { id: '1-2', title: 'Solving Simple Equations', duration: '20 min', type: 'link', videoId: null, src: 'https://www.khanacademy.org/math/algebra' },
      { id: '1-3', title: 'Word Problems Practice', duration: '15 min', type: 'video', videoId: null, src: '' },
    ],
  },
  {
    id: 2,
    isSeeded: true,
    title: 'Basic Physics Principles',
    category: 'Science',
    teacher: 'Dr. Amina Bello',
    teacherInitials: 'AB',
    rating: 4.9,
    students: 98,
    completionRate: 84,
    createdAt: Date.now() - 86400000 * 10,
    desc: 'An engaging introduction to classical mechanics, forces, motion, energy conservation, and experimental lab methods.',
    lessons: [
      { id: '2-0', title: "Newton's First Law", duration: '14 min', type: 'video', videoId: null, src: 'https://www.youtube.com/embed/CQYELiTtUs8' },
      { id: '2-1', title: 'Forces & Motion', duration: '22 min', type: 'video', videoId: null, src: '' },
      { id: '2-2', title: 'Live Lab Session', duration: '45 min', type: 'link', videoId: null, src: 'https://meet.google.com' },
    ],
  },
  {
    id: 3,
    isSeeded: true,
    title: 'English Literature & Writing',
    category: 'English',
    teacher: 'Mrs. Clara Ndeh',
    teacherInitials: 'CN',
    rating: 4.7,
    students: 210,
    completionRate: 71,
    createdAt: Date.now() - 86400000 * 7,
    desc: 'Develop critical reading, rhetorical analysis, and structured academic writing skills through classic and contemporary literature.',
    lessons: [
      { id: '3-0', title: 'Introduction to Essay Writing', duration: '16 min', type: 'video', videoId: null, src: '' },
      { id: '3-1', title: 'Shakespeare Overview', duration: '25 min', type: 'video', videoId: null, src: 'https://www.youtube.com/embed/aHBCdYm9eZw' },
    ],
  },
  {
    id: 4,
    isSeeded: true,
    title: 'Web Development Basics',
    category: 'Computer Science',
    teacher: 'Mr. Tabi Eric',
    teacherInitials: 'TE',
    rating: 4.6,
    students: 175,
    completionRate: 66,
    createdAt: Date.now() - 86400000 * 3,
    desc: 'Learn semantic HTML, modern CSS layouts, and interactive JavaScript to design and ship responsive web applications.',
    lessons: [
      { id: '4-0', title: 'HTML Foundations', duration: '20 min', type: 'video', videoId: null, src: 'https://www.youtube.com/embed/pQN-pnXPaVg' },
      { id: '4-1', title: 'CSS Styling', duration: '18 min', type: 'video', videoId: null, src: '' },
      { id: '4-2', title: 'JavaScript Intro', duration: '24 min', type: 'link', videoId: null, src: 'https://javascript.info' },
    ],
  },
];

export function loadSavedCourses(): Course[] {
  try {
    const raw = localStorage.getItem(LS_COURSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCourses(allCourses: Course[]): void {
  const custom = allCourses
    .filter((c) => !c.isSeeded)
    .map((c) => ({
      ...c,
      lessons: c.lessons.map((l) => ({
        ...l,
        blobUrl: undefined,
      })),
    }));
  try {
    localStorage.setItem(LS_COURSES_KEY, JSON.stringify(custom));
  } catch (e) {
    console.warn('EduVerse: localStorage write failed', e);
  }
}

export function loadCompletedLessons(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : { '1-0': true, '2-0': true };
  } catch {
    return {};
  }
}

export function saveCompletedLessons(progress: Record<string, boolean>): void {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota errors
  }
}

export function loadLessonNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LS_NOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLessonNotes(notes: Record<string, string>): void {
  try {
    localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // ignore
  }
}

export function convertYouTubeUrl(url: string): string {
  if (url.includes('embed')) return url;
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}
