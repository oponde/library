import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { Teacher } from '../types';
import { TEACHER_DB } from '../lib/storage';

interface TeacherLoginProps {
  onLogin: (teacher: Teacher) => void;
  onCancel: () => void;
}

export const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = TEACHER_DB.find(
      (t) => t.email.toLowerCase() === email.trim().toLowerCase() && t.pass === password
    );
    if (!matched) {
      setError('Incorrect email or password. Use the demo credentials below to sign in.');
      return;
    }
    setError('');
    onLogin(matched);
  };

  const fillDemo = () => {
    setEmail('teacher@edu.com');
    setPassword('teach123');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
        <div className="mb-8">
          <p className="text-xs font-semibold text-blue-600 mb-1">Educator Access</p>
          <h1 className="text-2xl font-bold text-slate-900">Teacher Studio Sign In</h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish video lessons, attach live links, and track student engagement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@edu.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Sign In to Studio
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div>
              <div className="font-semibold text-slate-800">Demo Account</div>
              <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                teacher@edu.com / teach123
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              Auto-fill
            </button>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full inline-flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Courses
          </button>
        </div>
      </div>
    </div>
  );
};
