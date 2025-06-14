const { escapeRegex } = require("../regex");



const getAllBannerListQuery = async (query) => {


 const {
    search = '',
    status = 'all',
    page: pageParam = '1',
    limit: limitParam = '10',
    sortField = 'createdAt',
    sortOrder = 'desc',
    pageFilter = 'all'
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
    filter.isActive = status === 'active';
  }
  
  if (pageFilter !== 'all') {
    filter.page = pageFilter;
  }

  const validSortFields = ['name', 'page', 'createdAt', 'isActive'];
  const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
  const finalSortOrder = sortOrder === 'asc' ? 1 : -1;
  const sort = { [finalSortField]: finalSortOrder };

  const page = Math.max(1, parseInt(pageParam) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(limitParam) || 10));
  const skip = (page - 1) * limit;


  return {
    filter,
    page,
    limit,
    skip,
    sort,
    status,
    finalSortField,
    finalSortOrder,
    trimmedSearch
  }

}

module.exports = { getAllBannerListQuery };