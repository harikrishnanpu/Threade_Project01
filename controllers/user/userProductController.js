const Brand = require('../../models/brandModel');
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const productService = require('../../services/userproductServices');
const { getUserProductFiltersAndSort } = require('../../utils/queries/getAllProductsQuery');



const renderShopPage = async (req, res) => {
  try {
    const { filters, sortOptions, pageNum, limitNum, queryOptions } =
      await getUserProductFiltersAndSort(req.query);      

    const allVariants = await productService.getAllVariants(queryOptions.mainCat);
    const result      = await productService.getProducts(filters, sortOptions, pageNum, limitNum);  

    const [mainCategories,subCategories, brands, tags] = await Promise.all([
      Category.find({ parentCategory: null, isActive: true  }).sort({ name: 1 }).lean(),
      Category.find({ parentCategory: queryOptions.mainCat, isActive: true  }).sort({ name: 1 }).lean(),
      Brand.find({ category: queryOptions.mainCat, isActive: true  }).sort({ name: 1 }).lean(),
      productService.getAllTags()               
    ]);


    

    res.render('user/shop', {
      ...queryOptions,
      products:      result.products,
      totalProducts: result.totalProducts,
      totalPages:    result.totalPages,
      currentPage:   pageNum,
      limit:         limitNum,
      mainCategories,
      subCategories,
      brands,
      tags,
      variantSizes:  allVariants[0]?.allSizes  || [],
      variantColors: allVariants[0]?.allColors || [],
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
    const activeVariants = product.variants.map(v => v.isActive)
    
    if(activeVariants.length == 0) throw new Error('no active variants for this product') 
    const relatedProducts = await productService.getRelatedProducts(id,product.category._id,4)
    res.render('user/productDetail',{product, error: null, relatedProducts})

  }catch(err){

    res.render('user/productDetail',{error: err.message, product: null,relatedProducts: null})

  }
}

const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      priceRange,
      tag,
      rating,
      isSale,
      isFeatured,
      inStock,
      sortBy = 'newest',
      page = 1,
      limit = 9
    } = req.query;

    const filters = {};
    
    filters.isActive = true;
    
    if (search) {
      const regSearch = new RegExp(search, 'i');
      filters.name = regSearch ;
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (brand) {
      filters.brand = brand;
    }
    
if (priceRange) {
  if (priceRange === '200-plus') {
    filters.regularPrice = { $gte: 200 };
  } else if (priceRange.includes('-')) {
    const [min, max] = priceRange.split('-').map(Number);
    if (!isNaN(min)) {
      filters.regularPrice = { $gte: min };
      if (!isNaN(max)) filters.regularPrice.$lte = max;
    }
  }
}

    
    
    if (tag) {
      filters.tags = { $in: [tag] };
    }
    
    if (rating) {
      filters.rating = { $gte: parseInt(rating) };
    }
    
    if (isFeatured === 'true') {
      filters.isFeatured = true;
    }
    
    if (inStock === 'true') {
      filters.stock = { $gt: 0 };
    }
    
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
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    const result = await productService.getProducts(filters, sortOptions, pageNum, limitNum);
    
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