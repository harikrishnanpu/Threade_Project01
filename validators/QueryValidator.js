const { query } = require('express-validator');


  const validateQueryEmail = [
    query('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail()
  ]


const validateUserListQuery = [
query('search')
  .optional()
  .isString().withMessage('Search must be a string')
  .matches(/^[a-zA-Z0-9\s\-_@.]*$/).withMessage('Search contains invalid characters'),
  query('status')
    .optional()
    .isString().withMessage('Status must be one of: all, blocked, unblocked'),
  query('sortField')
    .optional()
    .isString().withMessage('Sort field must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive number')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('showUnlisted')
    .optional()
    .isBoolean().withMessage('showUnlisted must be true or false')
    .toBoolean(),
];



const validateListCategoryQuery = [
  query('search')
    .optional()
    .isString()
    .matches(/^[\w\s\-]*$/)
    .withMessage('Search must contain only letters, numbers, spaces, hyphens, or underscores'),

  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive'])
    .withMessage('Status must be "all", "active", or "inactive"'),

  query('isFeatured')
    .optional()
    .isIn(['all', 'true', 'false'])
    .withMessage('isFeatured must be "all", "true", or "false"'),

  query('parentFilter')
    .optional()
    .isIn(['all', 'main', 'sub'])
    .withMessage('parentFilter must be "all", "main", or "sub"'),

  query('sortField')
    .optional()
    .isString()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be "asc" or "desc"'),

  query('showInactive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('showInactive must be "true" or "false"'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];


const validateBrandListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('status')
    .optional()
    .isIn(['all', 'active', 'inactive']).withMessage('Status must be all, active, or inactive'),

  query('listedFilter')
    .optional()
    .isIn(['all', 'listed', 'unlisted']).withMessage('Listed filter must be all, listed, or unlisted'),

   query('categoryFilter')
    .optional()
    .custom((value) => {
      if (value === 'all') return true;
      if (mongoose.Types.ObjectId.isValid(value)) return true;
      throw new Error('Category filter must be "all" or a valid Mongo ID');
    }),

  query('sortField')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt']).withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),

  query('search')
    .optional()
    .isString().withMessage('Search must be a string')
    .matches(/^[a-zA-Z0-9\s\-_.]*$/).withMessage('Search contains invalid characters'),

  query('showInactive')
    .optional()
    .isIn(['true', 'false']).withMessage('showInactive must be true or false')
];


module.exports = {  validateUserListQuery , validateListCategoryQuery, validateBrandListQuery, validateQueryEmail};
