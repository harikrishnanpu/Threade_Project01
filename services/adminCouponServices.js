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
    
    const { code, discount, maxDiscount, minOrderAmount, maxUsuage, onlyFor, expiresAt, isActive  } = data;

    console.log(data);
    
    if(code.trim() == ""  || !discount || !maxDiscount){
      throw new Error('all fields are required')
    }

    if(parseInt(discount) > 90){
      throw new Error('max discount is 90%')
    }

    const existingcoupon = await Coupon.findOne({ code: data.code  });

    if(existingcoupon){
      throw new Error('coupon already exists')
    }
    
    const coupon = await Coupon.create(data);
    return coupon;
  } catch (err) {
    console.log(err);
    
    throw new Error(err.message);
  }
};

const getCouponById = async (id) => {
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('coupon not found');
    return coupon;
  } catch (error) {
    throw new Error(error.message);
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
  } catch (err) {
    throw new Error(err.message);
  }
};




module.exports = {
  getFilteredCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
};
