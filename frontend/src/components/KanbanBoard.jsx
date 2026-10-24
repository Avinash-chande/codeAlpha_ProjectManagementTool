import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  CircleDot, 
  Trash2, 
  Settings,
  Users,
  Crown
} from 'lucide-react';
import { updateTaskApi, deleteTaskApi } from '../services/api';

export const KanbanBoard = ({
  project,
  tasks,
  currentUser,
  onBack,
  onOpenCreateTask,
  onOpenProjectDetails,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [movingTaskId, setMovingTaskId] = useState(null);

  const columns = [
    { id: 'To Do', name: 'To Do', icon: CircleDot, color: 'text-slate-400', badge: 'bg-slate-800 text-slate-300' },
    { id: 'In Progress', name: 'In Progress', icon: Clock, color: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    { id: 'Completed', name: 'Completed', icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  ];

  const handleStatusChange = async (taskId, newStatus) => {
    setMovingTaskId(taskId);
    try {
      const res = await updateTaskApi(taskId, { status: newStatus });
      onTaskUpdated(res.data.task);
    } catch (err) {
      console.error('Failed to update task status', err);
    } finally {
      setMovingTaskId(null);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTaskApi(taskId);
      onTaskDeleted(taskId);
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Low':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'Medium':
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isOwner = project?.isOwner || project?.owner?._id === currentUser?._id || project?.owner === currentUser?._id;

  return (
    <div className="space-y-6">
      {/* Top Bar with Navigation and Project Details */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              id="back-to-projects-btn"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Back to Projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Project /</span>
                <h2 className="text-xl font-bold text-white tracking-tight">{project.name}</h2>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Crown className="w-3 h-3" />
                    <span>Owner</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Users className="w-3 h-3" />
                    <span>Member</span>
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Team Members Avatar Stack */}
            <div className="flex items-center -space-x-2 mr-2">
              {(project.members || []).slice(0, 4).map((member, i) => (
                <div
                  key={member._id || i}
                  title={member.name || 'Member'}
                  className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-200"
                >
                  {getInitials(member.name)}
                </div>
              ))}
              {(project.members?.length || 0) > 4 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                  +{project.members.length - 4}
                </div>
              )}
            </div>

            {/* Project Details & Settings button */}
            <button
              id="project-settings-btn"
              onClick={onOpenProjectDetails}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-indigo-400" />
              <span>Settings & Members</span>
            </button>

            {/* Add Task Button */}
            <button
              id="add-task-top-btn"
              onClick={() => onOpenCreateTask('To Do')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar Summary */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Total: <strong className="text-slate-200">{totalTasks} tasks</strong>
            </span>
            <span>•</span>
            <span>
              Completed: <strong className="text-emerald-400">{completedTasks}</strong>
            </span>
            <span>•</span>
            <span>
              Owner: <strong className="text-slate-300">{project.owner?.name || 'Owner'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="font-semibold text-white shrink-0">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className="bg-slate-900/60 rounded-2xl border border-slate-800/80 p-4 flex flex-col min-h-[480px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${col.color}`} />
                  <span className="text-sm font-semibold text-white">{col.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${col.badge}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-slate-500 text-xs">
                    <span>No tasks in {col.name}</span>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-slate-900 border border-slate-800/90 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-slate-100 leading-snug break-words">
                          {task.title}
                        </h4>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1 -mr-1 -mt-1 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Metadata: Priority, Assigned User, Due Date */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        {/* Priority */}
                        <span
                          className={`px-2 py-0.5 rounded-md font-medium border text-[11px] ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        {/* Assigned User */}
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <User className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[90px]">{task.assignedTo || 'Unassigned'}</span>
                        </div>

                        {/* Due Date */}
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px] ml-auto">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Status Move Dropdown */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                        <span>Move to:</span>
                        <select
                          value={task.status}
                          disabled={movingTaskId === task._id}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Button at Column Bottom */}
              <button
                onClick={() => onOpenCreateTask(col.id)}
                className="mt-3 w-full py-2 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
