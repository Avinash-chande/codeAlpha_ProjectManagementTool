import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { createAndSendNotification } from './notificationController.js';
import { broadcastToProject } from '../socket.js';

/**
 * @desc    Create a comment on a task
 * @route   POST /api/tasks/:taskId/comments
 * @access  Private (Project Owner or Member only)
 */
export const createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment message is required',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify user is owner or member of the task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const isMember = project.members.some((m) => m.toString() === currentUserId);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this task. You must be a project member.',
      });
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      message: message.trim(),
    });

    await comment.populate('user', 'name email');

    // Notify all relevant stakeholders on the task
    const recipientIds = new Set();
    const currentUserIdStr = req.user._id.toString();

    if (task.assignedUser && task.assignedUser.toString() !== currentUserIdStr) {
      recipientIds.add(task.assignedUser.toString());
    }
    if (task.createdBy && task.createdBy.toString() !== currentUserIdStr) {
      recipientIds.add(task.createdBy.toString());
    }
    if (project.owner && project.owner.toString() !== currentUserIdStr) {
      recipientIds.add(project.owner.toString());
    }

    const priorCommenters = await Comment.find({ task: taskId }).distinct('user');
    for (const cUser of priorCommenters) {
      if (cUser && cUser.toString() !== currentUserIdStr) {
        recipientIds.add(cUser.toString());
      }
    }

    const shortMsg = message.trim().length > 70 ? message.trim().substring(0, 70) + '...' : message.trim();
    for (const recId of recipientIds) {
      await createAndSendNotification({
        recipient: recId,
        sender: req.user._id,
        type: 'task_comment',
        title: 'New Comment on Task',
        message: `${req.user.name} commented on "${task.title}": "${shortMsg}"`,
        task: task._id,
        project: project._id,
      });
    }

    // Broadcast live comment event to project viewers
    broadcastToProject(project._id, 'comment_created', {
      taskId: task._id,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all comments for a task (in chronological order)
 * @route   GET /api/tasks/:taskId/comments
 * @access  Private (Project Owner or Member only)
 */
export const getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID',
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Verify user is owner or member of the task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Associated project not found',
      });
    }

    const currentUserId = req.user._id.toString();
    const isOwner = project.owner.toString() === currentUserId;
    const isMember = project.members.some((m) => m.toString() === currentUserId);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view comments on this task',
      });
    }

    // Chronological order: oldest first (ascending createdAt)
    const comments = await Comment.find({ task: taskId })
      .sort({ createdAt: 1 })
      .populate('user', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:commentId
 * @access  Private (Comment Author or Project Owner only)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID',
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const task = await Task.findById(comment.task);
    const project = task ? await Project.findById(task.project) : null;

    const currentUserId = req.user._id.toString();
    const isAuthor = comment.user.toString() === currentUserId;
    const isProjectOwner = project && project.owner.toString() === currentUserId;

    if (!isAuthor && !isProjectOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment. Only the author or project owner can delete comments.',
      });
    }

    await Comment.findByIdAndDelete(commentId);

    if (project) {
      broadcastToProject(project._id, 'comment_deleted', {
        taskId: comment.task,
        commentId,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
