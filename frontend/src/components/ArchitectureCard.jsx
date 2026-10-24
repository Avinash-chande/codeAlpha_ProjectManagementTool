import React from 'react';
import { FolderTree, Check, Code2, Server, Globe, KeyRound } from 'lucide-react';

export const ArchitectureCard = () => {
  const backendStructure = [
    { name: 'config/', desc: 'Environment loader & Mongoose connection handlers' },
    { name: 'controllers/', desc: 'Request handlers & HTTP response orchestrators' },
    { name: 'models/', desc: 'Mongoose schemas (User, Project, Task, Comment)' },
    { name: 'routes/', desc: 'Modular Express REST endpoints & API router' },
    { name: 'middleware/', desc: 'Auth verification, error handlers & 404 filters' },
    { name: 'services/', desc: 'Business logic layer & external service integrations' },
  ];

  const frontendStructure = [
    { name: 'components/', desc: 'Modular, reusable UI components & layout elements' },
    { name: 'services/', desc: 'API client instances & endpoint call abstractions' },
    { name: 'assets/', desc: 'Static media, branding icons & image assets' },
  ];

  const stackChips = [
    { name: 'React 19 + Vite 6', category: 'Frontend', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30' },
    { name: 'Tailwind CSS v4', category: 'Styling', color: 'from-sky-500/20 to-teal-500/20 text-sky-300 border-sky-500/30' },
    { name: 'Node.js + Express', category: 'Backend', color: 'from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30' },
    { name: 'MongoDB + Mongoose', category: 'Database', color: 'from-green-500/20 to-lime-500/20 text-green-300 border-green-500/30' },
    { name: 'JWT & bcrypt', category: 'Auth Ready', color: 'from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30' },
    { name: 'Socket.IO', category: 'Real-time (Upcoming)', color: 'from-purple-500/20 to-violet-500/20 text-purple-300 border-purple-500/30' },
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Scalable Architecture & Folder Structure
            </h3>
            <p className="text-xs text-slate-400">
              Clean separation of concerns designed for seamless phase expansion
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Clean Architecture
        </span>
      </div>

      {/* Tech Stack Badges */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
          Project Technology Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {stackChips.map((tech) => (
            <div
              key={tech.name}
              className={`text-xs px-3 py-1.5 rounded-lg border bg-gradient-to-r flex items-center gap-1.5 ${tech.color}`}
            >
              <Check className="w-3.5 h-3.5" />
              <span className="font-medium">{tech.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Architecture */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-slate-300">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">backend/src/</span>
          </div>
          <ul className="space-y-2">
            {backendStructure.map((item) => (
              <li key={item.name} className="text-xs flex items-start gap-2">
                <span className="font-mono text-emerald-400 font-semibold shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {item.name}
                </span>
                <span className="text-slate-400 leading-relaxed">{item.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Frontend Architecture */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800 text-slate-300">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">frontend/src/</span>
          </div>
          <ul className="space-y-2">
            {frontendStructure.map((item) => (
              <li key={item.name} className="text-xs flex items-start gap-2">
                <span className="font-mono text-cyan-400 font-semibold shrink-0 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  {item.name}
                </span>
                <span className="text-slate-400 leading-relaxed">{item.desc}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Environment variables protected via root and backend <code className="text-slate-400">.gitignore</code></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
