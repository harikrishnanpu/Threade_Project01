const { body, query } = require('express-validator');

const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid Email Address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one digit')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
];


const validateRegisterUser = [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .matches(/^[A-Za-z\s]+$/).withMessage('Name must contain only letters and spaces'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail(),
    body('phone')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .isMobilePhone('en-IN', { strictMode: false }).withMessage('Invalid phone number format'),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one digit')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
]

  const validateEmail = [
    query('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail()
  ]

  const validateOtp = [
      body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isNumeric().withMessage('OTP must be numeric')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long'),
  ]

module.exports = {
  validateLogin,
  validateRegisterUser,
  validateEmail,
  validateOtp
};
