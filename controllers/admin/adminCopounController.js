const couponService = require('../../services/adminCouponServices');
const { findOneUserById } = require('../../services/userServices');



const renderAllCoupons = async (req, res,next) => {
  try {
    const {
      page = 1,
      status = 'all',
      userTypeFilter = 'all',
      showExpired = 'true',
      sortField = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: 10
    };

    const filters = {
      status,
      userTypeFilter,
      showExpired:  ( showExpired === 'true' || showExpired === true),
      search
    };

    const sortOptions = {
      field: sortField,
      order: sortOrder
    };

    const { coupons, totalCoupons, totalPages } = await couponService.getFilteredCoupons(filters, pagination, sortOptions);

    return res.render('admin/allCoupons', {
      coupons,
      totalCoupons,
      totalPages,
      currentPage: pagination.page,
      status,
      userTypeFilter,
      search,
      showExpired,
      sortField,
      sortOrder
    });

  } catch (err) {
    next(err)
  }
};

const getAllCouponsList = async (req, res) => {
  try {
    const {
      page = 1,
      status = 'all',
      userTypeFilter = 'all',
      showExpired = 'true',
      sortField = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = req.query;
    

    const pagination = {
      page: parseInt(page),
      limit: 10
    };

    const filters = {
      status,
      userTypeFilter,
      showExpired: ( status !== 'active'  || showExpired === 'true' || showExpired === true ),
      search
    };

    const sortOptions = {
      field: sortField,

      order: sortOrder
    };

    const { coupons, totalCoupons, totalPages } = await couponService.getFilteredCoupons(filters, pagination, sortOptions);

    return res.status(200).json({
      coupons,
      totalCoupons,
      totalPages,
      currentPage: pagination.page,
      status,
      userTypeFilter,
      search,
      showExpired,
      sortField,
      sortOrder,
      success: true
    });

  } catch (err) {
    return res.status(500).json({message: err , success: false});
  }
};

const createCoupon = async (req, res) => {
  try {
    const couponData = req.body;
    const newCoupon = await couponService.createCoupon(couponData);
    return res.status(201).json({ success: true, data: newCoupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCouponById = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await couponService.getCouponById(couponId);
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const updatedData = req.body;
    const updatedCoupon = await couponService.updateCoupon(couponId, updatedData);
    return res.status(200).json({ success: true, data: updatedCoupon });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



const toggleCouponStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    // console.log(req.body);
    
    const coupon = await couponService.toggleCouponStatus(req.params.id, isActive);
     
    res.status(200).json({ success: true, message: 'Status updated' });

  } catch (err) {

    res.status(500).json({ success: false, message: err.message });
  }
};



module.exports = {
  renderAllCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  getAllCouponsList,
  toggleCouponStatus
};
