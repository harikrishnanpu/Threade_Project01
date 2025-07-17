const { default: mongoose } = require("mongoose");
const Category = require("../../models/categoryModel");
const { escapeRegex } = require("../regex");
const productModel = require("../../models/productModel");


const getFilteredProductList = async (queryParams) => {
     const {
        search = '',
        status = 'all',
        categoryFilter = 'all',
        brandFilter = 'all',
        sortField: sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10
      } = queryParams;
    
      const filter = {};
      const trimmedSearch = search.trim();
    
      if (trimmedSearch) {
        const safeSearch = escapeRegex(trimmedSearch);
        const regex = new RegExp(safeSearch, 'i');
        filter.$or = [
          { name: regex },
          { description: regex },
        ];
      }
    
      if (status !== 'all') {
        filter.isActive = status === 'active';
      }
    
      if (categoryFilter !== 'all') {
        filter.category = categoryFilter;
      }
    
      if (brandFilter !== 'all') {
        filter.brand = brandFilter;
      }
    
      const validSortFields = ['name', 'regularPrice', 'stock', 'createdAt'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortField]: sortOrderValue };
    
      const parsedPage = Math.max(1, parseInt(page) || 1);
      const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
      const skip = (parsedPage - 1) * parsedLimit;
      

      return {
        validSortFields,
        sortField,
        sortOrderValue,
        sort,
        parsedPage,
        parsedLimit,
        skip,
        status,
        trimmedSearch,
        categoryFilter,
        brandFilter,
        filter
      }
}

const getUserProductFiltersAndSort = async query => {


  const {
    search = '', mainCat, subCat, brand, priceRange, size, color, tag,
    rating, isNew, isSale, isFeatured, inStock,
    sortBy = 'newest', page = '1', limit = '9'
  } = query

  let mainCatfromUser = mainCat
  const filters = { isActive: true }
  if (search) filters.name = { $regex: search, $options: 'i' }

  if (mainCatfromUser && subCat){
    console.log("fff",subCat);
    
    filters.category = new mongoose.Types.ObjectId(subCat)
  }

  else if (mainCatfromUser) {

    const subCatIds = await Category.find({ parentCategory: mainCatfromUser, isActive: true }).select('_id').lean();
    if (subCatIds.length) filters.category = { $in: [...subCatIds.map(s => new mongoose.Types.ObjectId(s._id)), new mongoose.Types.ObjectId(mainCatfromUser) ]  };
    else filters.category = new mongoose.Types.ObjectId(mainCatfromUser);

  }else {
    const randomProduct = await productModel.findOne().sort({ createdAt: -1 });
    const catId = await Category.findOne({ $or: [{ _id: randomProduct.category , parentCategory: null, isActive: true } ,{ parentCategory: null ,isActive: true }]}).sort({ createdAt: -1 }).lean();
    mainCatfromUser = catId._id.toString();
    const subCatIds = await Category.find({ parentCategory: mainCatfromUser, isActive: true }).select('_id').lean();
   filters.category = { $in: [...subCatIds.map(s => new mongoose.Types.ObjectId(s._id)), catId._id] };
  }

  if (brand) filters.brand = brand
  if (size) filters['variants.size'] = size
  if (color) filters['variants.color'] = { $in: [color] }
  if (tag) filters.tags = { $in: [tag] }
  if (rating) filters.rating = { $gte: parseInt(rating, 10) }
  if (isNew === 'true') filters.isNew = true
  if (isSale === 'true') filters.isSale = true
  if (isFeatured === 'true') filters.isFeatured = true
  if (inStock === 'true') filters.stock = { $gt: 0 }

  if (priceRange) {

    switch (priceRange) {
      case '0-50': filters.regularPrice = { $gte: 0, $lte: 50 }; break
      case '50-100': filters.regularPrice = { $gte: 50, $lte: 100 }; break
      case '100-150': filters.regularPrice = { $gte: 100, $lte: 150 }; break
      case '150-200': filters.regularPrice = { $gte: 150, $lte: 200 }; break
      case '200+': filters.regularPrice = { $gte: 200 }; break
      default:
        if (priceRange.includes('-')) {
          const [min, max] = priceRange.split('-').map(n => parseInt(n, 10))
          if (!isNaN(min) && !isNaN(max)) filters.regularPrice = { $gte: min, $lte: max }
        }
    }

  }

  const sortMap = {

    newest: { createdAt: -1 }, 'price-low': { regularPrice: 1 }, 'price-high': { regularPrice: -1 },
    'name-asc': { name: 1 }, 'name-desc': { name: -1 }, 'rating-high': { rating: -1 },
    popular: { rating: -1, createdAt: -1 }

  }
  

  return {
    filters,
    sortOptions: sortMap[sortBy] || sortMap.newest,
    pageNum: parseInt(page, 10),
    limitNum: parseInt(limit, 10),
    queryOptions: {
      search, mainCat: mainCatfromUser, subCat, brand, priceRange, size, color, tag,
      rating, isNew: isNew === 'true', isSale: isSale === 'true',
      isFeatured: isFeatured === 'true', inStock: inStock === 'true', sortBy
    }
  }
}



module.exports = { getFilteredProductList, getUserProductFiltersAndSort };