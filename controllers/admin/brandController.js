const brandService = require('../../services/brandServices');
const Category = require('../../models/categoryModel');
const { getAllBrandListQuery } = require('../../utils/queries/getAllBrandQuery');



async function renderAllBrands(req, res, next) {
  try {
 const { query, sort, limit, skip, currentPage, finalSortField, finalSortOrder, ...filters } = getAllBrandListQuery(req.query);

    const [brands, totalBrands, categories] = await Promise.all([
      brandService.getBrands(query, sort, skip, limit),
      brandService.countBrands(query),
      Category.find({ isActive: true }).select('name').sort({ name: 1 }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalBrands / limit));
    const safePage = Math.min(currentPage, totalPages);

    res.render('admin/allBrands', {
      brands,
      totalBrands,
      categories,
      currentPage: safePage,
      totalPages,
      ...filters
    });
  } catch (error) {
    console.error('Error rendering brands page:', error);
    res.status(500).json({message: error.message})
  }
}


async function getAllBrands(req, res, next) {
  try {
    const brands = await brandService.getAllBrands();
    res.status(200).json({ 
      success: true, 
      data: brands,
      count: brands.length 
    });
  } catch (error) {
    console.error('Error getting all brands:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch brands'
    });
  }
}



async function getBrandById(req, res, next) {
  try {
    const { id } = req.params;

    const brand = await brandService.getBrandById(id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    res.status(200).json({ 
      success: true, 
      data: brand 
    });
  } catch (error) {
    console.error('Error getting brand by ID:', error);
    
    if (error.message === 'Invalid brand ID format') {
      return res.status(400).json({
        success: false,
        message: 'Invalid brand ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand'
    });
  }
}

async function createBrand(req, res, next) {
  try {

    const brand = await brandService.createBrand(req.body);
    
    res.status(201).json({ 
      success: true, 
      data: brand, 
      message: 'Brand created successfully' 
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create brand'
    });
  }
}


async function updateBrand(req, res, next) {
  try {
    const { id } = req.params;

    const updatedBrand = await brandService.updateBrand(id, req.body);

    res.status(200).json({ 
      success: true, 
      data: updatedBrand, 
      message: 'Brand updated successfully' 
    });
  } catch (error) {
    console.error('Error updating brand:', error);
    
    if (error.message === 'Brand not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Brand name already exists') {
      return res.status(409).json({
        success: false,
        message: error.message,
        errors: { name: error.message }
      });
    }
    
    if (error.message === 'Invalid brand ID format') {
      return res.status(400).json({
        success: false,
        message: 'Invalid brand ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update brand'
    });
  }
}

async function toggleBrandStatus(req, res, next) {
  try {
    
    const { id } = req.params;
    const { active } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Brand ID is required'
      });
    }
    
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Active status must be a boolean'
      });
    }

    const updatedBrand = await brandService.toggleStatus(id, active);

    res.status(200).json({ 
      success: true, 
      data: updatedBrand, 
      message: `Brand ${active ? 'activated' : 'deactivated'} successfully` 
    });


  } catch (error) {

    console.log(error);
    

    if (error.message === 'Brand not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Invalid brand ID format') {
      return res.status(400).json({
        success: false,
        message: 'Invalid brand ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update brand status'
    });


  }
}


async function toggleBrandListed(req, res, next) {
  try {
    const { id } = req.params;
    const { listed } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Brand ID is required'
      });
    }
    
    if (typeof listed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Listed status must be a boolean'
      });
    }

    const updatedBrand = await brandService.toggleListed(id, listed);

    res.status(200).json({ 
      success: true, 
      data: updatedBrand, 
      message: `Brand ${listed ? 'listed' : 'unlisted'} successfully` 
    });
  } catch (error) {
    console.error('Error toggling brand listed status:', error);
    
    if (error.message === 'Brand not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'Invalid brand ID format') {
      return res.status(400).json({
        success: false,
        message: 'Invalid brand ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update brand listed status'
    });
  }
}



async function uploadImage(req, res, next) {
  try {


    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'no image file provided'
      });
    }

    const imageUrl = req.file.path;
    
    res.status(200).json({ 
      success: true, 
      imageUrl, 
      message: 'Image uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
    
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload image'
    });
  }
}

module.exports = {
  renderAllBrands,
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  toggleBrandListed,
  uploadImage
};