const couponService = require('../../services/adminCouponServices');
const { findOneUserById } = require('../../services/userServices');



const renderAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      status = 'all',
      userTypeFilter = 'all',
      showExpired = false,
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
      showExpired: showExpired === 'true',
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

  } catch (error) {
    return res.render('admin/allCoupons', {
      coupons: [],
      totalCoupons: 0,
      totalPages: 1,
      currentPage: 1,
      status: 'all',
      userTypeFilter: 'all',
      search: '',
      showExpired: false,
      sortField: 'createdAt',
      sortOrder: 'desc',
      error: error.message || 'Error loading coupon list'
    });
  }
};

const getAllCouponsList = async (req, res) => {
  try {
    const {
      page = 1,
      status = 'all',
      userTypeFilter = 'all',
      showExpired = false,
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
      showExpired: showExpired === 'true',
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

  } catch (error) {
    return res.status(500).json({
      coupons: [],
      totalCoupons: 0,
      totalPages: 1,
      currentPage: 1,
      status: 'all',
      userTypeFilter: 'all',
      search: '',
      showExpired: false,
      sortField: 'createdAt',
      sortOrder: 'desc',
      error: error.message || 'Error loading coupon list',
            success: false
    });
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




module.exports = {
  renderAllCoupons,
  createCoupon,
  getCouponById,
  updateCoupon,
  getAllCouponsList
};
