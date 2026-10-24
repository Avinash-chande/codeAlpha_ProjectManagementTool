import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Users, 
  UserPlus, 
  Trash2, 
  Save, 
  ShieldAlert, 
  Check, 
  AlertCircle, 
  Loader2, 
  UserX,
  Crown
} from 'lucide-react';
import { 
  updateProjectApi, 
  deleteProjectApi, 
  addProjectMemberApi, 
  removeProjectMemberApi,
  getUsersApi 
} from '../services/api';

export const ProjectDetailsModal = ({
  isOpen,
  onClose,
  project,
  currentUser,
  onProjectUpdated,
  onProjectDeleted,
}) => {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [memberEmail, setMemberEmail] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isOwner = project?.isOwner || project?.owner?._id === currentUser?._id || project?.owner === currentUser?._id;

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
    }
  }, [project]);

  // Load registered users for membership addition
  useEffect(() => {
    if (isOpen && isOwner) {
      const loadUsers = async () => {
        try {
          const res = await getUsersApi();
          if (res.success && res.data.users) {
            // Filter out users who are already members
            const currentMemberIds = (project?.members || []).map((m) => m._id || m);
            const nonMembers = res.data.users.filter(
              (u) => !currentMemberIds.includes(u._id)
            );
            setAvailableUsers(nonMembers);
          }
        } catch (err) {
          console.error('Failed to load users', err);
        }
      };
      loadUsers();
    }
  }, [isOpen, project, isOwner]);

  if (!isOpen || !project) return null;

  // Handle Project Name & Description Update
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await updateProjectApi(project._id, {
        name: name.trim(),
        description: description.trim(),
      });
      setMessage('Project updated successfully.');
      onProjectUpdated(res.data.project);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Adding Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const targetEmail = memberEmail.trim();
    const targetUserId = selectedUserId;

    if (!targetEmail && !targetUserId) {
      setError('Please select a user or enter an email address.');
      return;
    }

    setIsAddingMember(true);
    try {
      const payload = targetUserId ? { userId: targetUserId } : { email: targetEmail };
      const res = await addProjectMemberApi(project._id, payload);

      setMessage(res.message || 'Member added successfully.');
      setMemberEmail('');
      setSelectedUserId('');
      onProjectUpdated(res.data.project);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle Removing Member
  const handleRemoveMember = async (memberId) => {
    setError('');
    setMessage('');
    setRemovingMemberId(memberId);

    try {
      const res = await removeProjectMemberApi(project._id, memberId);
      setMessage(res.message || 'Member removed successfully.');
      onProjectUpdated(res.data.project);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  // Handle Project Deletion
  const handleDeleteProject = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await deleteProjectApi(project._id);
      onProjectDeleted(project._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete project');
      setIsDeleting(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Project Details & Settings</h3>
              <p className="text-xs text-slate-400">Manage project information, team members, and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {/* Section 1: Edit Project Details */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-5">
            <h4 className="text-sm font-semibold text-white mb-3">Project Information</h4>
            <form onSubmit={handleUpdateDetails} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name</label>
                <input
                  id="edit-project-name-input"
                  type="text"
                  value={name}
                  disabled={!isOwner}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  id="edit-project-desc-input"
                  value={description}
                  disabled={!isOwner}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-60"
                />
              </div>

              {isOwner ? (
                <div className="flex justify-end pt-1">
                  <button
                    id="save-project-details-btn"
                    type="submit"
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 italic">
                  Only the project owner can edit project name and description.
                </p>
              )}
            </form>
          </div>

          {/* Section 2: Members Management */}
          <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Project Members</h4>
                <p className="text-xs text-slate-400">Team members who can view and work on tasks</p>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                {project.members?.length || 1} members
              </span>
            </div>

            {/* Add Member Form (Owner only) */}
            {isOwner && (
              <form onSubmit={handleAddMember} className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  Add Existing Registered User as Member
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Select from available users */}
                  {availableUsers.length > 0 && (
                    <select
                      id="member-user-select"
                      value={selectedUserId}
                      onChange={(e) => {
                        setSelectedUserId(e.target.value);
                        if (e.target.value) setMemberEmail('');
                      }}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select registered user...</option>
                      {availableUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Or type email */}
                  <input
                    id="member-email-input"
                    type="email"
                    value={memberEmail}
                    onChange={(e) => {
                      setMemberEmail(e.target.value);
                      if (e.target.value) setSelectedUserId('');
                    }}
                    placeholder="or enter user's registered email"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    id="add-member-submit-btn"
                    type="submit"
                    disabled={isAddingMember}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isAddingMember ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Member</span>
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2 pt-2">
              {/* Owner Item */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    {getInitials(project.owner?.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{project.owner?.name || 'Owner'}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Crown className="w-3 h-3" />
                        <span>Owner</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{project.owner?.email}</span>
                  </div>
                </div>
              </div>

              {/* Other Members */}
              {project.members
                ?.filter((m) => (m._id || m) !== (project.owner?._id || project.owner))
                .map((member) => {
                  const mId = member._id || member;
                  const mName = member.name || 'Member';
                  const mEmail = member.email || '';

                  return (
                    <div
                      key={mId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {getInitials(mName)}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-white">{mName}</span>
                          {mEmail && <p className="text-[11px] text-slate-400">{mEmail}</p>}
                        </div>
                      </div>

                      {isOwner && (
                        <button
                          onClick={() => handleRemoveMember(mId)}
                          disabled={removingMemberId === mId}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove member"
                        >
                          {removingMemberId === mId ? (
                            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 3: Danger Zone (Owner only) */}
          {isOwner && (
            <div className="bg-rose-500/5 rounded-xl border border-rose-500/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
                <h4 className="text-sm font-semibold">Danger Zone</h4>
              </div>
              <p className="text-xs text-slate-400">
                Deleting this project will permanently remove all tasks and member associations. This action cannot be undone.
              </p>

              {confirmDelete ? (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Confirm Delete Project</span>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
