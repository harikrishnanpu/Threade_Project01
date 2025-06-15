const Brand = require('../models/brandModel');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const productService = require('../services/userproductServices');
const mongoose = require('mongoose');
const { getUserProductFiltersAndSort } = require('../utils/queries/getAllProductsQuery');



const renderShopPage = async (req, res) => {

  try {
    const { filters, sortOptions, pageNum, limitNum, queryOptions } = await getUserProductFiltersAndSort(req.query);
    const allVariants = await productService.getAllVariants(filters); 
    const result = await productService.getProducts(filters, sortOptions, pageNum, limitNum);

    const [categories, brands, tags] = await Promise.all([
      Category.find().sort({ name: 1 }).lean(),
      Brand.find().sort({ name: 1 }).lean(),
      productService.getAllTags()
    ]);

    console.log(allVariants[0].allColors[0]);
    

    res.render('user/shop', {
      ...queryOptions,
      products: result.products,
      totalProducts: result.totalProducts,
      totalPages: result.totalPages,
      currentPage: pageNum,
      limit: limitNum,
      categories,
      brands,
      tags,
      variantSizes: allVariants[0].allSizes,
      variantColors: allVariants[0].allColors,
      title: 'Shop | Your Store',
      metaDescription: 'Browse our collection of products. Filter by category, brand, price, and more.'
    });
  } catch (error) {
    console.error('Error in shop page route:', error);
    res.status(500).render('error', {
      message: 'Failed to load shop page',
      error
    });
  }
};


const renderProductById = async (req,res) =>{
  const { id} = req.params;
  try{

    const product = await productService.getProductById(id);
    const relatedProducts = await productService.getRelatedProducts(id,product.category._id,4)
    res.render('user/productDetail',{product, error: null, relatedProducts})

  }catch(err){

    res.render('user/productDetail',{error: err.message,product: null,relatedProducts: null})

  }
}

const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      priceRange,
      size,
      color,
      tag,
      rating,
      isNew,
      isSale,
      isFeatured,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 9
    } = req.query;

    const filters = {};
    
    // Only show active products
    filters.isActive = true;
    
    // Text search
    if (search) {
      filters.name = { $regex: search, $options: 'i' };
    }
    
    // Category filter
    if (category) {
      filters.category = category;
    }
    
    // Brand filter
    if (brand) {
      filters.brand = brand;
    }
    
    // Price range filter
    if (priceRange) {
      if (priceRange === '0-50') {
        filters.regularPrice = { $gte: 0, $lte: 50 };
      } else if (priceRange === '50-100') {
        filters.regularPrice = { $gte: 50, $lte: 100 };
      } else if (priceRange === '100-150') {
        filters.regularPrice = { $gte: 100, $lte: 150 };
      } else if (priceRange === '150-200') {
        filters.regularPrice = { $gte: 150, $lte: 200 };
      } else if (priceRange === '200-plus') {
        filters.regularPrice = { $gte: 200 };
      } else if (priceRange.includes('-')) {
        const [min, max] = priceRange.split('-').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          filters.regularPrice = { $gte: min, $lte: max };
        }
      }
    }
    
    // Size filter
    if (size) {
      filters.sizes = { $in: [size] };
    }
    
    // Color filter
    if (color) {
      filters.colors = { $in: [color] };
    }
    
    // Tag filter
    if (tag) {
      filters.tags = { $in: [tag] };
    }
    
    // Rating filter
    if (rating) {
      filters.rating = { $gte: parseInt(rating) };
    }
    
    // Status filters
    if (isNew === 'true') {
      filters.isNew = true;
    }
    
    if (isSale === 'true') {
      filters.isSale = true;
    }
    
    if (isFeatured === 'true') {
      filters.isFeatured = true;
    }
    
    if (inStock === 'true') {
      filters.stock = { $gt: 0 };
    }
    
    // Determine sort order
    let sortOptions = {};
    switch (sortBy) {
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'price-low':
        sortOptions = { regularPrice: 1 };
        break;
      case 'price-high':
        sortOptions = { regularPrice: -1 };
        break;
      case 'name-asc':
        sortOptions = { name: 1 };
        break;
      case 'name-desc':
        sortOptions = { name: -1 };
        break;
      case 'rating-high':
        sortOptions = { rating: -1 };
        break;
      case 'popular':
        sortOptions = { rating: -1, createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Get products from service
    const result = await productService.getProducts(filters, sortOptions, pageNum, limitNum);
    
    // Return response
    res.status(200).json({
      success: true,
      products: result.products,
      totalProducts: result.totalProducts,
      totalPages: result.totalPages,
      currentPage: pageNum
    });
  } catch (error) {
    console.error('Error in getAllProducts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};


const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error in getProductById controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};


const getAllTags = async (req, res) => {
  try {
    const tags = await productService.getAllTags();
    
    res.status(200).json(tags);
  } catch (error) {
    console.error('Error in getAllTags controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags',
      error: error.message
    });
  }
};
















const getNewProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    const products = await productService.getNewProducts(parseInt(limit));
    
    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Error in getNewProducts controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch new products',
      error: error.message
    });
  }
};








module.exports = {
  getAllProducts,
  getProductById,
  getAllTags,
  getNewProducts,
  renderShopPage,
  renderProductById
};