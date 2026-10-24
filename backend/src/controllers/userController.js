import User from '../models/User.js';

/**
 * @desc    Get/search registered users (excluding current user)
 * @route   GET /api/users
 * @access  Private
 */
export const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {
      _id: { $ne: req.user._id },
    };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('_id name email createdAt')
      .limit(20)
      .lean();

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};
