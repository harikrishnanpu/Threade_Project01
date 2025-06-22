const Coupon = require('../models/coupounModel');



const getFilteredCoupons = async (filters, pagination, sortOptions) => {
  try {
    const query = {};

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'expired') {
        query.expiresAt = { $lt: new Date() };
      } else {
        query.isActive = filters.status === 'active';
      }
    }

    if (filters.userTypeFilter && filters.userTypeFilter !== 'all') {
      query.onlyFor = filters.userTypeFilter;
    }

    if (filters.search) {
      query.code = { $regex: filters.search, $options: 'i' };
    }

    if (!filters.showExpired) {
      query.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gte: new Date() } }
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;

    const sort = {
      [sortOptions.field]: sortOptions.order === 'asc' ? 1 : -1
    };

    const [coupons, totalCoupons] = await Promise.all([
      Coupon.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pagination.limit),
      Coupon.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCoupons / pagination.limit);

    return { coupons, totalCoupons, totalPages };
  } catch (error) {
    throw new Error('Error retrieving filtered coupons: ' + error.message);
  }
};


const createCoupon = async (data) => {
  try {
    const coupon = await Coupon.create(data);
    return coupon;
  } catch (error) {
    throw new Error('Error creating coupon: ' + error.message);
  }
};

const getCouponById = async (id) => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
  } catch (error) {
    throw new Error('Error fetching coupon: ' + error.message);
  }
};

const updateCoupon = async (id, updatedData) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true
    });
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
  } catch (error) {
    throw new Error('Error updating coupon: ' + error.message);
  }
};




module.exports = {
  getFilteredCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
};
