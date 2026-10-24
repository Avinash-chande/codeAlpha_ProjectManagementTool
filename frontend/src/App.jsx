import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HealthStatusCard } from './components/HealthStatusCard';
import { ArchitectureCard } from './components/ArchitectureCard';
import { ApiTester } from './components/ApiTester';
import { Footer } from './components/Footer';
import { fetchHealthStatus } from './services/api';
import { Sparkles, ArrowRight, ShieldCheck, Database, Server, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchHealthStatus();
      setHealthData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  const isHealthy = healthData?.database?.isConnected && healthData?.status === 'healthy';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navigation */}
        <Navbar isHealthy={isHealthy} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Section */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 p-8 sm:p-12 shadow-2xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Phase 1 Verification Complete</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Collaborative Project Management Platform
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
                A modern Trello & Asana style workspace. Phase 1 establishes the full-stack architecture, 
                high-performance React client with Vite and Tailwind CSS, Express REST API, and verified live 
                MongoDB persistence.
              </p>

              {/* Quick Status Highlights */}
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Frontend React + Vite (Port 5173)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Express API (Port 5000)</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>MongoDB Live Database</span>
                </div>
              </div>
            </div>
          </section>

          {/* System Health Card */}
          <section>
            <HealthStatusCard
              healthData={healthData}
              loading={loading}
              error={error}
              onRefresh={loadHealth}
            />
          </section>

          {/* Architecture & Interactive Tester Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ArchitectureCard />
            <ApiTester />
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
