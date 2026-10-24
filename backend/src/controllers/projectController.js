import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { createAndSendNotification } from './notificationController.js';
import { broadcastToProject } from '../socket.js';

/**
 * @desc    Get all projects for the logged-in user with task statistics and overall metrics
 * @route   GET /api/projects
 * @access  Private
 */
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find projects owned by or where user is a member
    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const projectIds = projects.map((p) => p._id);

    // Fetch all tasks for these projects
    const allTasks = await Task.find({ project: { $in: projectIds } }).lean();

    // Map tasks to their respective projects
    const tasksByProject = {};
    let totalTasksCount = 0;
    let inProgressTasksCount = 0;
    let completedTasksCount = 0;

    allTasks.forEach((task) => {
      totalTasksCount += 1;
      if (task.status === 'In Progress') inProgressTasksCount += 1;
      if (task.status === 'Completed') completedTasksCount += 1;

      const pId = task.project.toString();
      if (!tasksByProject[pId]) tasksByProject[pId] = [];
      tasksByProject[pId].push(task);
    });

    // Attach task count, progress, and ownership flag to each project card
    const projectsWithStats = projects.map((proj) => {
      const projTasks = tasksByProject[proj._id.toString()] || [];
      const total = projTasks.length;
      const completed = projTasks.filter((t) => t.status === 'Completed').length;
      const inProgress = projTasks.filter((t) => t.status === 'In Progress').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      const isOwner = proj.owner?._id ? proj.owner._id.toString() === userId.toString() : proj.owner?.toString() === userId.toString();

      return {
        ...proj,
        taskCount: total,
        completedCount: completed,
        inProgressCount: inProgress,
        progress,
        isOwner,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        projects: projectsWithStats,
        overview: {
          totalProjects: projects.length,
          totalTasks: totalTasksCount,
          tasksInProgress: inProgressTasksCount,
          completedTasks: completedTasksCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      const err = new Error('Project name is required');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      owner: req.user._id,
      members: [req.user._id],
    });

    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: {
          ...populatedProject,
          taskCount: 0,
          completedCount: 0,
          inProgressCount: 0,
          progress: 0,
          isOwner: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project details and its tasks
 * @route   GET /api/projects/:id
 * @access  Private
 */
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid project ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();

    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Check authorization: user must be owner or member
    const currentUserId = req.user._id.toString();
    const isOwner = project.owner?._id ? project.owner._id.toString() === currentUserId : project.owner?.toString() === currentUserId;
    const isMember = project.members?.some((m) => (m._id ? m._id.toString() === currentUserId : m.toString() === currentUserId));

    if (!isOwner && !isMember) {
      const err = new Error('Not authorized to view this project');
      err.statusCode = 403;
      throw err;
    }

    const tasks = await Task.find({ project: id }).sort({ createdAt: -1 }).lean();

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project,
          taskCount: total,
          completedCount: completed,
          inProgressCount: inProgress,
          progress,
          isOwner,
        },
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project details (owner only)
 * @route   PUT /api/projects/:id
 * @access  Private
 */
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid project ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: Only owner can update project details
    if (project.owner.toString() !== req.user._id.toString()) {
      const err = new Error('Only the project owner can update project details');
      err.statusCode = 403;
      throw err;
    }

    if (name !== undefined) {
      if (!name.trim()) {
        const err = new Error('Project name cannot be empty');
        err.statusCode = 400;
        throw err;
      }
      project.name = name.trim();
    }

    if (description !== undefined) {
      project.description = description.trim();
    }

    await project.save();

    const updated = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: {
          ...updated,
          isOwner: true,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a project (owner only)
 * @route   DELETE /api/projects/:id
 * @access  Private
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid project ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: Only owner can delete project
    if (project.owner.toString() !== req.user._id.toString()) {
      const err = new Error('Only the project owner can delete this project');
      err.statusCode = 403;
      throw err;
    }

    // Delete project and its tasks and comments
    const projectTasks = await Task.find({ project: id }).select('_id');
    const taskIds = projectTasks.map((t) => t._id);
    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Project and all associated tasks deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a registered user as a project member (owner only)
 * @route   POST /api/projects/:id/members
 * @access  Private
 */
export const addProjectMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error('Invalid project ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: Only owner can manage project membership
    if (project.owner.toString() !== req.user._id.toString()) {
      const err = new Error('Only the project owner can manage project membership');
      err.statusCode = 403;
      throw err;
    }

    // Validate and locate target user
    let targetUser = null;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        const err = new Error('Invalid user ID provided');
        err.statusCode = 400;
        throw err;
      }
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.trim().toLowerCase() });
    } else {
      const err = new Error('Please provide user email or user ID to add as a member');
      err.statusCode = 400;
      throw err;
    }

    if (!targetUser) {
      const err = new Error('User not found. Only registered users can be added as members');
      err.statusCode = 404;
      throw err;
    }

    // Check if user is already a member
    const alreadyMember = project.members.some(
      (m) => m.toString() === targetUser._id.toString()
    );

    if (alreadyMember) {
      const err = new Error(`${targetUser.name} (${targetUser.email}) is already a member of this project`);
      err.statusCode = 400;
      throw err;
    }

    project.members.push(targetUser._id);
    await project.save();

    // Notify member of addition to project
    await createAndSendNotification({
      recipient: targetUser._id,
      sender: req.user._id,
      type: 'project_invitation',
      title: 'Added to Project',
      message: `${req.user.name} added you to project "${project.name}"`,
      project: project._id,
    });

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: `${targetUser.name} added to project successfully`,
      data: {
        project: updatedProject,
        newMember: {
          _id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a member from project (owner only, or member removing themselves)
 * @route   DELETE /api/projects/:id/members/:memberId
 * @access  Private
 */
export const removeProjectMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid project or member ID');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isSelf = memberId.toString() === req.user._id.toString();

    // Authorization: Only owner can remove members (or member leaving themselves)
    if (!isOwner && !isSelf) {
      const err = new Error('Only the project owner can manage project membership');
      err.statusCode = 403;
      throw err;
    }

    // Cannot remove project owner
    if (project.owner.toString() === memberId.toString()) {
      const err = new Error('Cannot remove the project owner from members');
      err.statusCode = 400;
      throw err;
    }

    project.members = project.members.filter((m) => m.toString() !== memberId.toString());
    await project.save();

    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      message: 'Member removed from project successfully',
      data: { project: updatedProject },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a task inside a project
 * @route   POST /api/projects/:id/tasks
 * @access  Private
 */
export const createTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    if (!title || !title.trim()) {
      const err = new Error('Task title is required');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(id);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Verify user is owner or member of this project
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = project.members.some((m) => m.toString() === req.user._id.toString());
    if (!isOwner && !isMember) {
      const err = new Error('Not authorized to add tasks to this project');
      err.statusCode = 403;
      throw err;
    }

    let targetAssignedUserId = null;
    let assignedName = assignedTo && assignedTo.trim() ? assignedTo.trim() : req.user.name;

    if (req.body.assignedUser && mongoose.Types.ObjectId.isValid(req.body.assignedUser)) {
      targetAssignedUserId = req.body.assignedUser;
      const targetUser = await User.findById(targetAssignedUserId);
      if (targetUser) assignedName = targetUser.name;
    } else if (assignedTo && assignedTo.trim() && assignedTo.trim() !== 'Unassigned') {
      const allProjectUsers = [project.owner, ...project.members];
      const matched = await User.findOne({
        _id: { $in: allProjectUsers },
        $or: [
          { email: assignedTo.trim().toLowerCase() },
          { name: new RegExp(`^${assignedTo.trim()}$`, 'i') },
        ],
      });
      if (matched) {
        targetAssignedUserId = matched._id;
        assignedName = matched.name;
      }
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      project: id,
      status: status || 'To Do',
      priority: priority || 'Medium',
      assignedTo: assignedName,
      assignedUser: targetAssignedUserId,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
    });

    // Notify assigned user if someone else was assigned
    if (targetAssignedUserId && targetAssignedUserId.toString() !== req.user._id.toString()) {
      await createAndSendNotification({
        recipient: targetAssignedUserId,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to task "${task.title}" in ${project.name}`,
        task: task._id,
        project: project._id,
      });
    }

    // Broadcast live event to project room
    broadcastToProject(id, 'task_created', task);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status or details
 * @route   PATCH /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, title, description, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    const oldStatus = task.status;
    const oldAssignedUser = task.assignedUser;

    if (status !== undefined) task.status = status;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (req.body.assignedUser !== undefined) {
      task.assignedUser = req.body.assignedUser || null;
      if (req.body.assignedUser) {
        const u = await User.findById(req.body.assignedUser);
        if (u) task.assignedTo = u.name;
      } else {
        task.assignedTo = 'Unassigned';
      }
    } else if (assignedTo !== undefined) {
      task.assignedTo = assignedTo.trim();
      if (assignedTo.trim() && assignedTo.trim() !== 'Unassigned') {
        const project = await Project.findById(task.project);
        if (project) {
          const allProjectUsers = [project.owner, ...project.members];
          const matched = await User.findOne({
            _id: { $in: allProjectUsers },
            $or: [
              { email: assignedTo.trim().toLowerCase() },
              { name: new RegExp(`^${assignedTo.trim()}$`, 'i') },
            ],
          });
          if (matched) {
            task.assignedUser = matched._id;
          }
        }
      }
    }

    await task.save();

    // Trigger notification if newly assigned
    if (
      task.assignedUser &&
      (!oldAssignedUser || oldAssignedUser.toString() !== task.assignedUser.toString()) &&
      task.assignedUser.toString() !== req.user._id.toString()
    ) {
      await createAndSendNotification({
        recipient: task.assignedUser,
        sender: req.user._id,
        type: 'task_assigned',
        title: 'Task Assigned',
        message: `${req.user.name} assigned you to task "${task.title}"`,
        task: task._id,
        project: task.project,
      });
    }

    // Trigger notification if status changed
    if (
      status &&
      status !== oldStatus &&
      task.assignedUser &&
      task.assignedUser.toString() !== req.user._id.toString()
    ) {
      await createAndSendNotification({
        recipient: task.assignedUser,
        sender: req.user._id,
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `${req.user.name} moved "${task.title}" to ${status}`,
        task: task._id,
        project: task.project,
      });
    }

    // Broadcast live event to project room
    broadcastToProject(task.project, 'task_updated', task);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    // Cascade delete associated comments
    await Comment.deleteMany({ task: id });

    // Broadcast live event to project room
    broadcastToProject(task.project, 'task_deleted', { taskId: id });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
