import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  CheckSquare, 
  Clock, 
  Users, 
  Trash2, 
  X,
  Loader2
} from 'lucide-react';
import { 
  getNotificationsApi, 
  markNotificationAsReadApi, 
  markAllNotificationsAsReadApi, 
  deleteNotificationApi 
} from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef(null);

  // Load initial notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await getNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchNotifications();

      // Connect to Socket.IO and listen for real-time notifications
      const socket = connectSocket(user._id);

      const handleIncomingNotification = (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      };

      socket.on('notification', handleIncomingNotification);

      return () => {
        socket.off('notification', handleIncomingNotification);
      };
    }
  }, [user?._id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationAsReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllNotificationsAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n._id === id);
      await deleteNotificationApi(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <CheckSquare className="w-4 h-4 text-violet-400" />;
      case 'task_comment':
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'task_status_changed':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'project_invitation':
        return <Users className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/60"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="text-[11px] text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mb-2" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto mb-2.5 text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.read && handleMarkAsRead(n._id)}
                  className={`p-3.5 transition-colors relative flex items-start gap-3 group cursor-pointer ${
                    n.read
                      ? 'bg-transparent hover:bg-slate-800/40 text-slate-400'
                      : 'bg-indigo-950/20 hover:bg-indigo-950/30 text-slate-200'
                  }`}
                >
                  {/* Type Icon Badge */}
                  <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    {getTypeIcon(n.type)}
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words line-clamp-2">
                      {n.message}
                    </p>

                    {n.project?.name && (
                      <span className="inline-block mt-1 text-[10px] text-indigo-400/90 font-medium">
                        Project: {n.project.name}
                      </span>
                    )}
                  </div>

                  {/* Actions & Read Indicator */}
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20"></span>
                    )}
                    <button
                      onClick={(e) => handleDeleteNotification(n._id, e)}
                      title="Delete notification"
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
