const express = require('express');
const { getLoginPage, getSignUpPage, getForgottenPasswordPage, getChangePasswordPage, registerNewUser, getUserHomePage, getGoogleAuth, getGoogleAuthCallback, loginUserAccount, getVerifyEmailPage, verifyUserEmail, getVerifyEmailOtpPage, verifyUserEmailOtp, resendUserEmailOtp, forgottenUserPassword } = require('../controllers/userController');
const { checkIsUserAuthenticated, checkIsUserExists, checkIsUserVerified } = require('../middlewares/userMiddleware');
const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../services/validator');
const userRouter = express.Router();


userRouter.use((req,res,next)=>{
      res.locals.noHeader = false;
      res.locals.noFooter = false;
      next();
})

userRouter.get('/login',checkIsUserExists, getLoginPage);
userRouter.get('/register',checkIsUserExists, getSignUpPage);
userRouter.get('/forgotten-password', getForgottenPasswordPage);

userRouter.get('/verify/email/:id/otp',[ 
      param('id')
      .trim()
      .notEmpty()
      .withMessage('User ID is required')
      .isMongoId()
      .withMessage('Invalid User ID format') ],handleValidationErrors, checkIsUserExists, getVerifyEmailOtpPage);

userRouter.get('/verify/email/resend-otp',   [
    query('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail()
  ],handleValidationErrors,checkIsUserExists, resendUserEmailOtp);

userRouter.get('/verify/email', getVerifyEmailPage);
userRouter.get('/reset/user/password', getChangePasswordPage);

userRouter.get('/auth/google',checkIsUserExists,getGoogleAuth);
userRouter.get('/auth/google/callback',checkIsUserExists, getGoogleAuthCallback);


userRouter.get('/home',checkIsUserAuthenticated,checkIsUserVerified, getUserHomePage);



userRouter.post('/register',[
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
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
  ],  
    handleValidationErrors,  checkIsUserExists, registerNewUser);


userRouter.post('/login', [
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
], handleValidationErrors, checkIsUserExists, loginUserAccount);


userRouter.post('/verify/email',[
      body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid Email Address')
      .normalizeEmail()
],handleValidationErrors, checkIsUserExists, verifyUserEmail);

userRouter.post('/verify/email/otp',[
    body('email')
      .trim() 
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email address')
      .normalizeEmail(),

      body('otp')
      .trim()
      .notEmpty().withMessage('OTP is required')
      .isNumeric().withMessage('OTP must be numeric')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits long'),
  ],handleValidationErrors, checkIsUserExists, verifyUserEmailOtp);

userRouter.post('/reset/email/password', [
  body('email')
  .trim()
  .notEmpty().withMessage('Email is Required')
  .isEmail().withMessage('Invalid Email Addres')
  .normalizeEmail()
], handleValidationErrors, checkIsUserExists, forgottenUserPassword)





module.exports = userRouter;