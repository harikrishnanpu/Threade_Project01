const { param } = require("express-validator");

const validateUserIdParam = [
  param('id')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid User ID format')
];

const validateCategoryIdParam = [
  param('id')
    .notEmpty().withMessage('CategoryId is required')
    .isMongoId().withMessage('Invalid CategoryId format')
];

const validateBrandIdParam = [
  param('id')
    .notEmpty().withMessage('CategoryId is required')
    .isMongoId().withMessage('Invalid CategoryId format')
];

const validateProductId = [
  param('id')
    .notEmpty().withMessage('productId is required')
    .isMongoId().withMessage('Invalid productId format')
];




module.exports = { validateUserIdParam, validateCategoryIdParam , validateBrandIdParam,validateProductId  }

