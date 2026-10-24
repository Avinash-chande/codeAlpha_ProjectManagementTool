import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Trash2, 
  Clock, 
  User, 
  Calendar, 
  CheckCircle2, 
  CircleDot, 
  AlertCircle, 
  Loader2,
  Crown
} from 'lucide-react';
import { getTaskCommentsApi, createTaskCommentApi, deleteCommentApi } from '../services/api';

export const TaskDetailsModal = ({
  isOpen,
  onClose,
  task,
  project,
  currentUser,
  onTaskUpdated,
}) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [error, setError] = useState('');

  const isProjectOwner =
    project?.isOwner ||
    project?.owner?._id === currentUser?._id ||
    project?.owner === currentUser?._id;

  // Load comments whenever task opens
  useEffect(() => {
    if (isOpen && task?._id) {
      loadComments();
    }
  }, [isOpen, task?._id]);

  const loadComments = async () => {
    setLoadingComments(true);
    setError('');
    try {
      const res = await getTaskCommentsApi(task._id);
      if (res.success) {
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments', err);
      setError(err.response?.data?.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setError('');
    try {
      const res = await createTaskCommentApi(task._id, newComment.trim());
      if (res.success && res.data.comment) {
        setComments((prev) => [...prev, res.data.comment]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment', err);
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    setError('');
    try {
      await deleteCommentApi(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment', err);
      setError(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (!isOpen || !task) return null;

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

  const getInitials = (userName) => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md font-medium border text-xs ${getPriorityBadge(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium">
                {task.status}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-1 -mr-1 -mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Details Bar */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Assigned To</span>
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{task.assignedTo || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Due Date</span>
              <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block mb-1">Project</span>
              <span className="text-indigo-400 font-medium truncate block">{project?.name}</span>
            </div>
          </div>

          {task.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* COMMENTS & COLLABORATION SECTION                            */}
          {/* ============================================================ */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  Task Discussion & Comments
                </h4>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            {/* Comments List (Chronological Order) */}
            <div className="space-y-3 min-h-[100px]">
              {loadingComments ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
                  <p className="text-xs">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="py-8 px-4 rounded-xl border border-dashed border-slate-800/80 text-center text-slate-500 text-xs">
                  No comments yet. Start the conversation with your team!
                </div>
              ) : (
                comments.map((comment) => {
                  const authorId = comment.user?._id || comment.user;
                  const isCurrentAuthor = authorId === currentUser?._id;
                  const isCommentByOwner =
                    project?.owner?._id === authorId || project?.owner === authorId;
                  const canDelete = isCurrentAuthor || isProjectOwner;

                  return (
                    <div
                      key={comment._id}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 group transition-colors hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {getInitials(comment.user?.name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-200">
                                {comment.user?.name || 'Collaborator'}
                              </span>
                              {isCommentByOwner && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  <Crown className="w-2.5 h-2.5" />
                                  <span>Owner</span>
                                </span>
                              )}
                              {isCurrentAuthor && !isCommentByOwner && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {formatTimestamp(comment.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Delete Comment Button */}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            disabled={deletingCommentId === comment._id}
                            title={isCurrentAuthor ? 'Delete comment' : 'Moderate comment (as project owner)'}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          >
                            {deletingCommentId === comment._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed pl-9 whitespace-pre-wrap break-words">
                        {comment.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="pt-2">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment or update for the team..."
                  rows={2}
                  className="w-full pl-3.5 pr-24 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="absolute right-2.5 bottom-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submittingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
