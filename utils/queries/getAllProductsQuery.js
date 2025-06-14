const { escapeRegex } = require("../regex");


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

const getUserProductFiltersAndSort = async (query) => {
  
  const {
    search='',
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
    sortBy = 'createdAt',
    page = 1,
    limit = 9
  } = query;

  const filters = { isActive: true };

  if (search) filters.name = { $regex: search, $options: 'i' };
  if (category) filters.category = category;
  if (brand) filters.brand = brand;
  if (size) filters.sizes = { $in: [size] };
  if (color) filters.colors = { $in: [color] };
  if (tag) filters.tags = { $in: [tag] };
  if (rating) filters.rating = { $gte: parseInt(rating) };
  if (isNew === 'true') filters.isNew = true;
  if (isSale === 'true') filters.isSale = true;
  if (isFeatured === 'true') filters.isFeatured = true;
  if (inStock === 'true') filters.stock = { $gt: 0 };


  if (priceRange) {
    if (priceRange === '0-50') filters.regularPrice = { $gte: 0, $lte: 50 };
    else if (priceRange === '50-100') filters.regularPrice = { $gte: 50, $lte: 100 };
    else if (priceRange === '100-150') filters.regularPrice = { $gte: 100, $lte: 150 };
    else if (priceRange === '150-200') filters.regularPrice = { $gte: 150, $lte: 200 };
    else if (priceRange === '200-plus') filters.regularPrice = { $gte: 200 };
    else if (priceRange.includes('-')) {
      const [min, max] = priceRange.split('-').map(Number);
      if (!isNaN(min) && !isNaN(max)) filters.regularPrice = { $gte: min, $lte: max };
    }
  }

  let sortOptions = {};
  switch (sortBy) {
    case 'newest': sortOptions = { createdAt: -1 }; break;
    case 'price-low': sortOptions = { regularPrice: 1 }; break;
    case 'price-high': sortOptions = { regularPrice: -1 }; break;
    case 'name-asc': sortOptions = { name: 1 }; break;
    case 'name-desc': sortOptions = { name: -1 }; break;
    case 'rating-high': sortOptions = { rating: -1 }; break;
    case 'popular': sortOptions = { rating: -1, createdAt: -1 }; break;
    default: sortOptions = { createdAt: -1 };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  return {
    filters,
    sortOptions,
    pageNum,
    limitNum,
    queryOptions: {
      search,
      category,
      brand,
      priceRange,
      size,
      color,
      tag,
      rating,
      isNew: isNew === 'true',
      isSale: isSale === 'true',
      isFeatured: isFeatured === 'true',
      inStock: inStock === 'true',
      sortBy
    }
  };
}



module.exports = { getFilteredProductList, getUserProductFiltersAndSort };