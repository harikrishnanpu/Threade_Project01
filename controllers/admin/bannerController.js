const { 
  getAllBanners, 
  createBanner, 
  getBannerById, 
  updateBanner, 
  deleteBanner, 
  toggleBannerStatus 
} = require("../../services/bannerService");
const fs = require('fs').promises;
const path = require('path');




const listBanners = async (req, res) => {
  try {

    const result = await getAllBanners(req.query);

    res.render('admin/banners', {

      banners: result.data,
      totalBanners: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      search: result.filters.search,
      status: result.filters.status,
      pageFilter: result.filters.pageFilter,
      uniquePages: result.uniquePages,
      sortField: result.sortField,
      sortOrder: result.sortOrder,
      messages: []
    });

  } catch (error) {
    res.redirect('/admin/dashboard');
  }


};



const apiBannerList = async (req, res) => {
  try {

    const result = await getAllBanners(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      totalBanners: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      limit: result.limit,
      filters: result.filters,
      sortField: result.sortField,
      sortOrder: result.sortOrder,
      uniquePages: result.uniquePages
    });

  } catch (err) {

    res.status(500).json({ message: err.message, success: false });

  }
};

const createNewBanner = async (req, res) => {
  try {

    const bannerData = {
      ...req.body,
      createdBy: req.admin._id
    };
    
    const errors = validateBannerInput(bannerData);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }

    const newBanner = await createBanner(bannerData);
    res.status(201).json({
      message: 'Banner created successfully', 
      success: true, 
      data: newBanner
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const getBannerDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const banner = await getBannerById(id);
    res.status(200).json({ success: true, data: banner });
  } catch (err) {
    res.status(404).json({ message: err.message, success: false });
  }
};

const updateBannerById = async (req, res) => {
  const { id } = req.params;
  try {
    // Add current user as updater
    const updateData = {
      ...req.body,
      createdBy: req.admin._id
    };
    
    // Validate input
    const errors = validateBannerInput(updateData);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }

    const updatedBanner = await updateBanner(id, updateData);
    res.status(200).json({
      message: 'Banner updated successfully', 
      success: true, 
      data: updatedBanner
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const deleteBannerById = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteBanner(id);
    res.status(200).json({
      message: 'Banner deleted successfully',
      success: true
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const toggleBannerStatusById = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  console.log(active);
  
  
  try {
    const updatedBanner = await toggleBannerStatus(id, active);
    res.status(200).json({
      message: `Banner ${active ? 'activated' : 'deactivated'} successfully`,
      success: true,
      data: updatedBanner
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const uploadBannerImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const imageUrl = req.file.path;
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {

    console.log(error.message);

    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
};

const validateBannerInput = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Banner name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Banner name cannot exceed 100 characters';
  }

  if (data.description && data.description.trim().length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }

  if (!data.page || data.page.trim().length === 0) {
    errors.page = 'Page is required';
  } else if (data.page.trim().length > 100) {
    errors.page = 'Page name cannot exceed 100 characters';
  }

  if (!data.image) {
    errors.image = 'Banner image is required';
  }

  if (data.buttonText && data.buttonText.trim().length > 50) {
    errors.buttonText = 'Button text cannot exceed 50 characters';
  }

  return errors;
};

module.exports = {
  listBanners,
  apiBannerList,
  createNewBanner,
  getBannerDetails,
  updateBannerById,
  deleteBannerById,
  toggleBannerStatusById,
  uploadBannerImage
};