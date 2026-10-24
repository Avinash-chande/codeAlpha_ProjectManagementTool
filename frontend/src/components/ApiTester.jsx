import React, { useState } from 'react';
import { Terminal, Send, CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react';
import { fetchHealthStatus, pingServer } from '../services/api';

export const ApiTester = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      let data;
      if (selectedEndpoint === '/api/health') {
        data = await fetchHealthStatus();
      } else {
        data = await pingServer();
      }
      const duration = Math.round(performance.now() - startTime);

      setResponse({
        success: true,
        status: 200,
        duration,
        data,
      });
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      setResponse({
        success: false,
        status: err.response?.status || 500,
        duration,
        error: err.message,
        data: err.response?.data || null,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.data || response.error, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white tracking-tight">Interactive Endpoint Tester</h3>
            <p className="text-xs text-slate-400">Directly query live backend endpoints to test HTTP connection</p>
          </div>
        </div>
      </div>

      {/* Endpoint Selector Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex items-center bg-slate-950/80 rounded-xl border border-slate-800 px-3 py-2 text-sm">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded mr-3">
            GET
          </span>
          <select
            value={selectedEndpoint}
            onChange={(e) => setSelectedEndpoint(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none text-xs sm:text-sm font-mono cursor-pointer"
          >
            <option value="/api/health" className="bg-slate-900 text-white">/api/health (Full System & DB Health)</option>
            <option value="/api/health/ping" className="bg-slate-900 text-white">/api/health/ping (Lightweight Ping)</option>
          </select>
        </div>

        <button
          onClick={handleTest}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send Request</span>
        </button>
      </div>

      {/* Response Box */}
      {response ? (
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              {response.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className={`text-xs font-semibold ${response.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                HTTP {response.status}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">{response.duration} ms</span>
            </div>

            <button
              onClick={copyToClipboard}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
            {JSON.stringify(response.data || response.error, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="rounded-xl bg-slate-950/40 border border-dashed border-slate-800 p-6 text-center text-slate-500 text-xs">
          Click "Send Request" to perform an HTTP request from the React frontend to the Express backend.
        </div>
      )}
    </div>
  );
};
