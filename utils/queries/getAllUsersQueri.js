const { escapeRegex } = require("../regex");


const getAllUsersQuery = (query) => {
  const { 
    search = '', 
    status = 'all', 
    sortField: sortBy = 'createdAt', 
    sortOrder: order = 'desc', 
    page = 1, 
    limit = 10,
    showUnlisted = false
  } = query;

  // Build filter object
  const filter = {};
  const trimmedSearch = search.trim();

  // Search filter - name, email, phone
  if (trimmedSearch) {
    const safeSearch = escapeRegex(trimmedSearch);
    const regex = new RegExp(safeSearch, 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
    ];
  }

  // Status filter
  switch (status) {
    case 'active':
      filter.isBlocked = false;
      break;
    case 'blocked':
      filter.isBlocked = true;
      break;
    case 'all':
    default:
      // No status filter
      break;
  }

  // Unlisted filter
  if (showUnlisted === 'true' || showUnlisted === true) {
    // filter.isListed = { $ne: true };
  } else {
    // Hide unlisted users
    filter.isListed = {$eq: true};
  }

  // Sorting
  const validSortFields = ['name', 'email', 'phone', 'status', 'createdAt'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder = order === 'asc' ? 1 : -1;
  
  // Handle status sorting (convert boolean to sortable value)
  let sort;
  if (sortField === 'status') {
    sort = { isBlocked: sortOrder, createdAt: -1 }; // Secondary sort by creation date
  } else {
    sort = { [sortField]: sortOrder };
  }

  // Pagination
  const parsedPage = Math.max(1, parseInt(page) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 per page

  return {
    filter,
    sort,
    page: parsedPage,
    limit: parsedLimit,
    search: trimmedSearch,
    status,
    sortField,
    sortOrder,
    showUnlisted: showUnlisted === 'true' || showUnlisted === true
  };
};

module.exports = { getAllUsersQuery };
