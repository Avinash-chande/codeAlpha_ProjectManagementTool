import React from 'react';
import { Database, Server, Clock, HardDrive, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const HealthStatusCard = ({ healthData, loading, error, onRefresh }) => {
  const isConnected = healthData?.database?.isConnected;
  const isHealthy = healthData?.status === 'healthy';

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white tracking-tight">System & Database Health</h2>
            {loading ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 animate-pulse">
                Checking...
              </span>
            ) : isHealthy ? (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {error ? 'Disconnected' : 'Degraded'}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time diagnostics queried from Express backend & MongoDB connection
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 transition-all rounded-xl border border-slate-700 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-indigo-400 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Unable to reach Backend API</p>
            <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            <p className="text-xs text-slate-400 mt-2">
              Ensure the backend server is running on <code className="text-indigo-300">http://localhost:5000</code>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800/80">
        {/* MongoDB Status Box */}
        <div className="p-6 bg-slate-900 hover:bg-slate-900/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Database Engine</span>
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">MongoDB</span>
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {healthData?.database?.state || 'Unknown'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">
            DB: <span className="text-slate-300 font-mono">{healthData?.database?.dbName || 'project_management_db'}</span>
          </p>
          <p className="text-xs text-slate-500 truncate">
            Host: <span className="font-mono">{healthData?.database?.host || '127.0.0.1:27017'}</span>
          </p>
        </div>

        {/* Express Server Box */}
        <div className="p-6 bg-slate-900 hover:bg-slate-900/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Express API</span>
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">Port 5000</span>
            <span className="text-xs px-2 py-0.5 rounded font-medium bg-indigo-500/20 text-indigo-300">
              {healthData?.environment || 'development'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Node: <span className="text-slate-300 font-mono">{healthData?.system?.nodeVersion || 'v24.x'}</span>
          </p>
          <p className="text-xs text-slate-500">
            CORS: <span className="text-slate-400">http://localhost:5173</span>
          </p>
        </div>

        {/* Server Uptime Box */}
        <div className="p-6 bg-slate-900 hover:bg-slate-900/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Backend Uptime</span>
            <Clock className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {healthData?.uptime?.formatted || 'Active'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Elapsed: <span className="text-slate-300 font-mono">{healthData?.uptime?.seconds ?? 0}s</span>
          </p>
          <p className="text-xs text-slate-500 truncate">
            Last ping: <span className="font-mono text-slate-400">{healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : 'N/A'}</span>
          </p>
        </div>

        {/* Memory Footprint Box */}
        <div className="p-6 bg-slate-900 hover:bg-slate-900/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Memory Footprint</span>
            <HardDrive className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {healthData?.system?.memoryUsage?.rssMB ?? 0} MB
            </span>
            <span className="text-xs text-slate-400 font-normal">RSS</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Heap Used: <span className="text-slate-300 font-mono">{healthData?.system?.memoryUsage?.heapUsedMB ?? 0} MB</span>
          </p>
          <p className="text-xs text-slate-500">
            Runtime: <span className="text-slate-400">V8 Engine</span>
          </p>
        </div>
      </div>
    </div>
  );
};
