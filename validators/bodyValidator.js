const { body } = require("express-validator");

const validateBodyEmail = [
  body('email')
  .isEmpty().withMessage('email is required')
  .isEmail().withMessage('email is ')
];

const validateUserBody = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Please enter your full name')
    .matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters and spaces'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid Email Address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^\d{10}$/).withMessage('Phone number must be 10 digits'),

  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),

  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Invalid date format (expected YYYY-MM-DD)')
    .toDate()
];


const validateCategoryBody = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .matches(/^[\w\s\-]+$/).withMessage('Name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim()
    .escape(),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .trim()
    .escape(),

  body('isActive')
    .optional()
    .isIn(['on', 'off', 'true', 'false'])
    .withMessage('isActive must be "on", "true", or "false"'),

  body('isFeatured')
    .optional()
    .isIn(['on', 'off',  'true', 'false', ''])
    .withMessage('isFeatured must be "on", "true", or "false"'),
];

const validateBrandBody = [
  body('name')
    .trim()
    .notEmpty().withMessage('Brand name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Brand name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.]+$/).withMessage('Brand name contains invalid characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description can be up to 500 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid category ID');
      }
      return true;
    }),

  body('isActive')
    .optional()
    .custom((value) => {
      if (value !== 'on' && value !== 'off' ) {
        throw new Error('isActive must be a boolean or a string "true"/"false"');
      }
      return true;
    }),

  body('isListed')
    .optional()
    .custom((value) => {
      if (value !== 'on' && value !== 'off' ) {
        throw new Error('isListed must be a boolean or a string "true"/"false"');
      }
      return true;
    }),

body('image')
  .optional()
  .trim()
  .matches(/^[\w\-./]+$/).withMessage('Image must be a valid path or filename (alphanumeric, dot, dash, slash)')

];


const createProductValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 150 }).withMessage('Product name cannot exceed 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required'),

  body('regularPrice')
    .notEmpty().withMessage('Regular price is required')
    .isFloat({ min: 0 }).withMessage('Regular price must be a non-negative number'),

  body('salePrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Sale price must be a non-negative number')
    .custom((value, { req }) => {
      if (value && req.body.regularPrice && parseFloat(value) >= parseFloat(req.body.regularPrice)) {
        throw new Error('Sale price must be less than regular price');
      }
      return true;
    }),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('images')
    .isArray({ min: 3 }).withMessage('At least 3 images are required'),

  body('images.*')
    .isString().withMessage('Each image must be a string')
    .notEmpty().withMessage('Image URLs cannot be empty'),
];


module.exports ={ validateUserBody, validateCategoryBody, validateBodyEmail, validateBrandBody, createProductValidator };