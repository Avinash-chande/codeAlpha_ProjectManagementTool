import React from 'react';

export const Footer = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>
          CodeAlpha Project Management Tool • <span className="text-slate-400">Phase 1: Project Setup & Architecture</span>
        </p>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">React + Vite</span>
          <span>•</span>
          <span className="text-slate-400">Express</span>
          <span>•</span>
          <span className="text-slate-400">MongoDB</span>
          <span>•</span>
          <span className="text-slate-400">Tailwind CSS</span>
        </div>
      </div>
    </footer>
  );
};
