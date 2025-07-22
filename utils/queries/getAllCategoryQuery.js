const { escapeRegex } = require('../regex');

const getAllCategoriesQuery = (query) => {
  const {
    search = '',
    status = 'all',
    isFeatured = 'all',
    parentFilter = 'all',
    sortField: sortBy = 'createdAt',
    sortOrder = 'desc',
    showInactive='true',
    page = 1,
    limit = 10
  } = query;

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
    filter.isActive = status == 'active';
  }

  if (isFeatured !== 'all') {
    filter.isFeatured = isFeatured === 'true';
  }

  if(showInactive !== 'true'){
    filter.isActive = { $ne: false }
  }


  if (parentFilter !== 'all') {
    filter.parentCategory = parentFilter == 'main' ? { $eq: null } : {$ne : null};
  }

  const validSortFields = ['name', 'createdAt', 'isActive', 'isFeatured'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrderValue = sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortField]: sortOrderValue };

  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));

  return {
    filter,
    sort,
    page: parsedPage,
    limit: parsedLimit,
    search: trimmedSearch,
    status,
    isFeatured,
    showInactive,
    parentFilter
  };
};

module.exports = { getAllCategoriesQuery };
