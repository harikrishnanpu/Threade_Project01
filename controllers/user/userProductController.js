const Brand = require('../../models/brandModel');
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const productReviewModel = require('../../models/productReviewModel');
const Wishlist = require('../../models/wishListModel');
const productService = require('../../services/userproductServices');
const { getUserProductFiltersAndSort } = require('../../utils/queries/getAllProductsQuery');



const renderShopPage = async (req, res) => {
  try {
    
    const { filters, sortOptions, pageNum, limitNum, queryOptions } = await getUserProductFiltersAndSort(req.query);
    const allVariants  = await productService.getAllVariants(queryOptions.mainCat);
    const result = await productService.getProducts(filters, sortOptions, pageNum, limitNum);
    const allMainCatsbySub    = await productService.getAllCategoriesBySubCategories(8);
    const userProductSuggestions = await productService.productSuggestions(5);
    const userWishlist   = await Wishlist.findOne({ user: req.user?._id }).lean();
    const wishlistItemIds  = userWishlist?.items.map(i => i.product.toString()) || []
    const dealsOfTheDayProducts = await productService.getDealOfTheDayProducts();

    const [mainCategories, subCategories, brands, tags] = await Promise.all([
      Category.find({ parentCategory: null, isActive: true }).sort({ name: 1 }).lean(),
      Category.find({ parentCategory: queryOptions.mainCat, isActive: true }).sort({ name: 1 }).lean(),
      Brand.find({ category: queryOptions.mainCat, isActive: true }).sort({ name: 1 }).lean(),
      productService.getAllTags()
    ])


    res.render('user/shop', {
      queryOptions,
      ...queryOptions,
      products: result.products,
      totalProducts: result.totalProducts,
      totalPages: result.totalPages,
      currentPage: pageNum,
      limit: limitNum,
      mainCategories,
      subCategories,
      brands,
      tags,
      variantSizes: allVariants?.[0]?.allSizes ? allVariants[0].allSizes.map(s => s.size) : [],
      variantColors: allVariants[0]?.allColors ? allVariants[0].allColors.map(c => c.color) : [],
      allMainCatsbySub,
      userProductSuggestions,
      wishlistItemIds,
      dealsOfTheDayProducts
    })
  } catch (e) {
    console.error('Error in shop page route:', e)
    res.status(500).render('error', { message: 'Failed to load shop page', error: e })
  }
}


const getShopPageContents = async (req, res) => {
  try {
    
    const { filters, sortOptions, pageNum, limitNum, queryOptions } = await getUserProductFiltersAndSort(req.query);
    const allVariants  = await productService.getAllVariants(queryOptions.mainCat);
    const result = await productService.getProducts(filters, sortOptions, pageNum, limitNum);
    const allMainCatsbySub = await productService.getAllCategoriesBySubCategories(8);
    const userProductSuggestions = await productService.productSuggestions(5);
    const userWishlist   = await Wishlist.findOne({ user: req.user?._id }).lean();
    const wishlistItemIds  = userWishlist?.items.map(i => i.product.toString()) || []
    const dealsOfTheDayProducts = await productService.getDealOfTheDayProducts();

    const [mainCategories, subCategories, brands, tags] = await Promise.all([
      Category.find({ parentCategory: null, isActive: true }).sort({ name: 1 }).lean(),
      Category.find({ parentCategory: queryOptions.mainCat, isActive: true }).sort({ name: 1 }).lean(),
      Brand.find({ category: queryOptions.mainCat, isActive: true }).sort({ name: 1 }).lean(),
      productService.getAllTags()
    ])


    res.status(200).json({
      success: true,
      queryOptions,
      ...queryOptions,
      products: result.products,
      totalProducts: result.totalProducts,
      totalPages: result.totalPages,
      currentPage: pageNum,
      limit: limitNum,
      mainCategories,
      subCategories,
      brands,
      tags,
      variantSizes: allVariants?.[0]?.allSizes ? allVariants[0].allSizes.map(s => s.size) : [],
      variantColors: allVariants[0]?.allColors ? allVariants[0].allColors.map(c => c.color) : [],
      allMainCatsbySub,
      userProductSuggestions,
      wishlistItemIds,
      dealsOfTheDayProducts
    })
  } catch (e) {
    res.status(500).render({ message: 'Failed to load shop page', success: false })
  }
}



const renderProductById = async (req,res) => {
  const {id} = req.params;
  try{

    // console.log(id);
    
    const product = await productService.getProductById(id);
    const activeVariants = product.variants.map(v => v.isActive)


      const userWishlist = await Wishlist.findOne({ user: req.user?._id }).lean()
      const wishlistItemIds  = userWishlist?.items.map(i => i.product.toString()) || []

      
      const allMainCatsbySub = await productService.getAllCategoriesBySubCategories(8);

      const reviews = await productReviewModel.find({ product: id, isActive: true }).populate('user').lean()
    
      // console.log(product);
      
    if(activeVariants.length == 0) throw new Error('no active variants for this product')

    const relatedProducts = await productService.getRelatedProducts(id, product.category._id,4);

    res.render('user/productDetail',{product, error: null, relatedProducts, allMainCatsbySub, wishlistItemIds, reviews})

  }catch(err){
    // console.log(err);
    res.render('user/productDetail',{error: err.message, product: null,relatedProducts: null, allMainCatsbySub: [], wishlistItemIds:[ ], reviews: []})

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
    console.error(error);

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



const addReview = async (req, res) => {
  try {
    const userId = req.user?._id; 
    const { productId, size, color, rating, comment } = req.body;

    // console.log(req.body);
    

    if (!userId || !productId || !size || !color || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const UserReview = await productReviewModel.findOne({ product: productId, user: req.user?._id, isActive: true  });
    const product = await Product.findOne({ _id: productId, isActive: true });

if (!product || !product.variants.some(v => v.color === color && v.size === size && v.isActive)) {
  return res.status(400).json({ message: 'product is unavailable or variant not found' });
}


    if(UserReview){
      return res.status(400).json({ message: 'review already submitted' })
    }

    const review = await productReviewModel.create({
      product: productId,
      user: userId,
      size,
      color,
      rating,
      comment
    });


const allReviews = await productReviewModel.find({ product: productId, isActive: true });

const total = allReviews.reduce((sum, r) => sum + r.rating, 0);

const avgRating = allReviews.length > 0 ? total / allReviews.length : 0;

product.rating = Math.round(avgRating * 10) / 10;

await product.save();

    res.status(200).json({
      message: 'Review submitted successfully',
      review
        });
        
  } catch (err) {
    res.status(500).json({ message: err.message || 'Something went wrong' });
  }
};


const deleteReview = async (req,res) => {

  try{
    const userId = req.user?._id; 
    const { productId } = req.body;

    // console.log(req.body);
    

    if (!userId || !productId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const UserReview = await productReviewModel.findOne({ product: productId, user: req.user?._id, isActive: true  });

    if(!UserReview){
      return res.status(400).json({message: 'review not found'})
    }

    UserReview.isActive = false;
    await UserReview.save();

  }catch(err){
    res.status(500).json({message: err.message})
  }

}






module.exports = {
  getAllProducts,
  getProductById,
  getAllTags,
  getNewProducts,
  renderShopPage,
  renderProductById,
  addReview,
  deleteReview,
  getShopPageContents
};