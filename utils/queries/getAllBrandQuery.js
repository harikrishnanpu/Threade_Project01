const mongoose = require('mongoose');


const getAllBrandListQuery =  (queryParams) => {
      const {
    page = 1,
    status = 'all',
    listedFilter = 'all',
    categoryFilter = 'all',
    sortField = 'createdAt',
    sortOrder = 'desc',
    search = '',
    showInactive = 'true',
  } = queryParams;

  const limit = 10;
  const currentPage = Math.max(1, parseInt(page));
  const skip = (currentPage - 1) * limit;


  const query = {};
  if (status !== 'all') {
    query.isActive = status === 'active';
  }

  if (listedFilter !== 'all') {
    query.isListed = listedFilter === 'listed';
  }

  if (categoryFilter !== 'all') {
    query.category = categoryFilter;
  }

  if (search && search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  if (showInactive !== 'true' && status === 'all') {
    query.isActive = true;
  }

  const sort = {};
  const validSortFields = ['name', 'createdAt', 'updatedAt'];
  const validSortOrders = ['asc', 'desc'];

  const finalSortField = validSortFields.includes(sortField) ? sortField : 'createdAt';
  const finalSortOrder = validSortOrders.includes(sortOrder) ? sortOrder : 'desc';

  sort[finalSortField] = finalSortOrder === 'asc' ? 1 : -1;

  return {
    query,
    sort,
    limit,
    skip,
    currentPage,
    finalSortField,
    finalSortOrder,
    status,
    listedFilter,
    categoryFilter,
    sortField,
    sortOrder,
    search: search.trim(),
    showInactive,
  };
}

module.exports = {getAllBrandListQuery };