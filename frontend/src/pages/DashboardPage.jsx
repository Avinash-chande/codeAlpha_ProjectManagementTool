import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { ProjectDetailsModal } from '../components/ProjectDetailsModal';
import { KanbanBoard } from '../components/KanbanBoard';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle2,
  Plus,
  FolderPlus,
  ArrowRight,
  Loader2,
  AlertCircle,
  Crown,
  Users
} from 'lucide-react';
import { getProjectsApi, getProjectByIdApi } from '../services/api';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState({
    totalProjects: 0,
    totalTasks: 0,
    tasksInProgress: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Project Board View State
  const [activeProject, setActiveProject] = useState(null);
  const [activeTasks, setActiveTasks] = useState([]);
  const [loadingProject, setLoadingProject] = useState(false);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
  const [taskDefaultStatus, setTaskDefaultStatus] = useState('To Do');

  // Load user projects and real metrics from backend
  const loadProjects = async () => {
    try {
      setError('');
      const res = await getProjectsApi();
      if (res.success && res.data) {
        setProjects(res.data.projects || []);
        setOverview(res.data.overview || {
          totalProjects: 0,
          totalTasks: 0,
          tasksInProgress: 0,
          completedTasks: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load projects', err);
      setError('Unable to load projects. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // View project details & Kanban board
  const handleViewProject = async (projectId) => {
    setLoadingProject(true);
    try {
      const res = await getProjectByIdApi(projectId);
      if (res.success && res.data) {
        setActiveProject(res.data.project);
        setActiveTasks(res.data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoadingProject(false);
    }
  };

  const handleBackToProjects = () => {
    setActiveProject(null);
    setActiveTasks([]);
    loadProjects(); // Refresh metrics when returning
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
    setOverview((prev) => ({
      ...prev,
      totalProjects: prev.totalProjects + 1,
    }));
  };

  const handleProjectUpdated = (updatedProject) => {
    setActiveProject((prev) => (prev ? { ...prev, ...updatedProject } : null));
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? { ...p, ...updatedProject } : p))
    );
  };

  const handleProjectDeleted = (deletedProjectId) => {
    setProjects((prev) => prev.filter((p) => p._id !== deletedProjectId));
    setActiveProject(null);
    setActiveTasks([]);
    loadProjects();
  };

  const handleOpenCreateTask = (status = 'To Do') => {
    setTaskDefaultStatus(status);
    setIsTaskModalOpen(true);
  };

  const handleTaskCreated = (newTask) => {
    setActiveTasks((prev) => [newTask, ...prev]);
    if (activeProject) {
      setActiveProject((prev) => {
        const nextTotal = (prev.taskCount || 0) + 1;
        const nextCompleted = newTask.status === 'Completed' ? (prev.completedCount || 0) + 1 : (prev.completedCount || 0);
        return {
          ...prev,
          taskCount: nextTotal,
          completedCount: nextCompleted,
          progress: Math.round((nextCompleted / nextTotal) * 100),
        };
      });
    }
  };

  const handleTaskUpdated = (updatedTask) => {
    setActiveTasks((prev) =>
      prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
    );
  };

  const handleTaskDeleted = (taskId) => {
    setActiveTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'Collaborator';
    return fullName.trim().split(' ')[0];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {activeProject ? (
            /* ============================================================ */
            /* KANBAN PROJECT BOARD VIEW                                   */
            /* ============================================================ */
            loadingProject ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <p className="text-sm">Loading project board...</p>
              </div>
            ) : (
              <KanbanBoard
                project={activeProject}
                tasks={activeTasks}
                currentUser={user}
                onBack={handleBackToProjects}
                onOpenCreateTask={handleOpenCreateTask}
                onOpenProjectDetails={() => setIsProjectDetailsOpen(true)}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            )
          ) : (
            /* ============================================================ */
            /* DASHBOARD MAIN OVERVIEW & MY PROJECTS                       */
            /* ============================================================ */
            <>
              {/* Simple Welcome Section */}
              <section className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      Welcome back, {getFirstName(user?.name)}!
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                      Manage your projects, organize tasks, and collaborate with your team.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Project</span>
                  </button>
                </div>
              </section>

              {/* Project Overview Cards (Real Backend Metrics) */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Projects */}
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium text-slate-400">Total Projects</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? '...' : overview.totalProjects}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Active workspaces</p>
                </div>

                {/* Total Tasks */}
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium text-slate-400">Total Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? '...' : overview.totalTasks}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Across all projects</p>
                </div>

                {/* Tasks In Progress */}
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium text-slate-400">Tasks In Progress</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? '...' : overview.tasksInProgress}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Currently active</p>
                </div>

                {/* Completed Tasks */}
                <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium text-slate-400">Completed Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {loading ? '...' : overview.completedTasks}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Successfully finished</p>
                </div>
              </section>

              {/* My Projects Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">My Projects</h2>
                    <p className="text-xs text-slate-400">Access your project boards and track workflows</p>
                  </div>

                  {projects.length > 0 && (
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Project</span>
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500 mb-2" />
                    <p className="text-xs">Loading projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  /* Clean Empty State */
                  <div className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                      <FolderPlus className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-semibold text-white">No projects yet</h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
                      Create your first project to start organizing tasks, assigning team members, and collaborating.
                    </p>
                    <button
                      onClick={() => setIsProjectModalOpen(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Your First Project</span>
                    </button>
                  </div>
                ) : (
                  /* Projects Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((proj) => {
                      const isOwner = proj.isOwner || (proj.owner?._id === user?._id) || (proj.owner === user?._id);

                      return (
                        <div
                          key={proj._id}
                          className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-base font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                                {proj.name}
                              </h3>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isOwner ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                    <Crown className="w-3 h-3" />
                                    <span>Owner</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                                    <Users className="w-3 h-3" />
                                    <span>Member</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[32px] mb-6">
                              {proj.description || 'No description provided.'}
                            </p>
                          </div>

                          {/* Progress and View Project Button */}
                          <div className="space-y-4 pt-4 border-t border-slate-800/80">
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-slate-400 text-[11px]">
                                  {proj.taskCount || 0} {proj.taskCount === 1 ? 'task' : 'tasks'}
                                </span>
                                <span className="font-semibold text-white text-[11px]">{proj.progress || 0}% completed</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                                  style={{ width: `${proj.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleViewProject(proj._id)}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <span>View Project</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        {/* Modals */}
        <CreateProjectModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />

        {activeProject && (
          <>
            <CreateTaskModal
              isOpen={isTaskModalOpen}
              onClose={() => setIsTaskModalOpen(false)}
              projectId={activeProject._id}
              project={activeProject}
              defaultStatus={taskDefaultStatus}
              currentUser={user}
              onTaskCreated={handleTaskCreated}
            />

            <ProjectDetailsModal
              isOpen={isProjectDetailsOpen}
              onClose={() => setIsProjectDetailsOpen(false)}
              project={activeProject}
              currentUser={user}
              onProjectUpdated={handleProjectUpdated}
              onProjectDeleted={handleProjectDeleted}
            />
          </>
        )}

        <Footer />
      </div>
    </div>
  );
};
