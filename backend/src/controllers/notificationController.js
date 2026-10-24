import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import { sendNotificationToUser } from '../socket.js';

/**
 * Helper to create a notification, persist to DB, and send in real-time via Socket.IO
 */
export const createAndSendNotification = async ({
  recipient,
  sender = null,
  type = 'general',
  title,
  message,
  task = null,
  project = null,
}) => {
  try {
    if (!recipient) return null;

    // Do not notify self
    if (sender && sender.toString() === recipient.toString()) {
      return null;
    }

    const doc = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      task,
      project,
      read: false,
    });

    const populated = await Notification.findById(doc._id)
      .populate('sender', 'name email')
      .populate('project', 'name')
      .populate('task', 'title status')
      .lean();

    // Deliver via Socket.IO real-time
    sendNotificationToUser(recipient, populated);

    return populated;
  } catch (err) {
    console.error('[Notification] Error creating notification:', err.message);
    return null;
  }
};

/**
 * @desc    Get current user's notifications & unread count
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name email')
        .populate('project', 'name')
        .populate('task', 'title status')
        .lean(),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOne({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    notification.read = true;
    await notification.save();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all user notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        unreadCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized',
      });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
