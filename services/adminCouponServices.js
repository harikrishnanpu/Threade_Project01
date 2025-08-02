const Coupon = require('../models/coupounModel');



const getFilteredCoupons = async (filters, pagination, sortOptions) => {
  try {
    const query = {};

    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'expired') {
        query.expiresAt = { $lt: new Date() };
      } else {        
        query.isActive = filters.status == 'active';
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

    // console.log(data);
    
    if(code.trim() == ""  || !discount || !maxDiscount){
      throw new Error('all fields are required')
    }

    if(parseInt(discount) > 90){
      throw new Error('max discount is 90%')
    }

    const existingcoupon = await Coupon.findOne({ code: {$regex: new RegExp(data.code.trim(),'i') } });

    if(existingcoupon){
      throw new Error('coupon already exists')
    }
    
    const coupon = new Coupon({
      code,
      discount,
      maxDiscount,
      minOrderAmount,
      maxUsuage,
      onlyFor,
      expiresAt,
      isActive
    });

      
  
  
    const now = new Date();
    let diactivate = false;

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      diactivate = true;
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      diactivate = true;
    }

    if (diactivate && coupon.isActive) {
      coupon.isActive = false;
    }


    await Coupon.updateMany({ $or: [{   expiresAt: { $lt: now }  } ] },  { isActive: false  });


    return await coupon.save();
  } catch (err) {
    // console.log(err);
    
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

  const existingcoupon = await Coupon.findOne({ code: {$regex: new RegExp(updatedData.code.trim(),'i') } , _id: {$ne: id } });

      if(existingcoupon){
      throw new Error('coupon already exists')
    }

  try {
    let coupon = await Coupon.findById(id);
    if (!coupon) throw new Error('Coupon not found');

    coupon.code = updatedData.code
    coupon.discount = updatedData.discount
    coupon.maxDiscount = updatedData.maxDiscount
    coupon.minOrderAmount = updatedData.minOrderAmount
    coupon.maxUsage = updatedData.maxUsage
    coupon.onlyFor = updatedData.onlyFor
    coupon.expiresAt = updatedData.expiresAt
    coupon.isActive = updatedData.isActive


     const now = new Date();
    let diactivate = false;

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      diactivate = true;
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      diactivate = true;
    }

    if (diactivate && coupon.isActive) {
      coupon.isActive = false;
    }


    await Coupon.updateMany({ $or: [{   expiresAt: { $lt: now }  } ] },  { isActive: false  });

    await coupon.save()



    return coupon;
  } catch (err) {
    throw new Error(err.message);
  }
};

const toggleCouponStatus = async (id, active) => {
  try {
    const offer = await Coupon.findByIdAndUpdate(id, { isActive: active }, { new: true });
    return offer;
  } catch (err) {
    throw new Error(err.message);
  }
};




module.exports = {
  getFilteredCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  toggleCouponStatus
};
