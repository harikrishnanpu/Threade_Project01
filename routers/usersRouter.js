const express = require('express');
const { getLoginPage, getSignUpPage, getForgottenPasswordPage, getChangePasswordPage, registerNewUser, getUserHomePage, getGoogleAuth, getGoogleAuthCallback, loginUserAccount, getVerifyEmailPage, verifyUserEmail, getVerifyEmailOtpPage, verifyUserEmailOtp, resendUserEmailOtp, forgottenUserPassword, changeUserPassword, logoutUser, getUserProfilePage, getEditProfilePage, updateProfile } = require('../controllers/userController');
const { checkIsUserAuthenticatedAndRedirect, checkIsUserExists, checkResetPasswordTokenValid, checkIsResetPasswordLinkValid, checkIsUserAuthenticated } = require('../middlewares/userMiddleware');
const productRouter = require('./userProductRouter');
const { handleValidationErrors } = require('../validators/validator');
const { validateRegisterUser, validateLogin, validateOtp } = require('../validators/authValidator');
const { validateUserIdParam } = require('../validators/ParamValidator');
const { validateQueryEmail } = require('../validators/QueryValidator');
const { validateBodyEmail } = require('../validators/bodyValidator');
const cartRouter = require('./userCartRouter');
const userProfileRouter = require('./userProfileRouter');
const userRouter = express.Router();


userRouter.use((req,res,next)=>{
      res.locals.noHeader = false;
      res.locals.noFooter = false;
      res.locals.user = null;
      res.locals.cartCount = 0;
      res.locals.layout = './layout/userLayout'
      next();
});



userRouter.use('/products',checkIsUserAuthenticated, productRouter);
userRouter.use('/cart', checkIsUserAuthenticated, cartRouter);
userRouter.use('/profile', checkIsUserAuthenticated, userProfileRouter);


userRouter.get('/login',checkIsUserExists, getLoginPage);
userRouter.get('/register',checkIsUserExists, getSignUpPage);
userRouter.get('/forgotten-password', getForgottenPasswordPage);
userRouter.get('/verify/email/:id/otp',validateUserIdParam,handleValidationErrors, checkIsUserExists, getVerifyEmailOtpPage);
userRouter.get('/verify/email/resend-otp', validateQueryEmail,handleValidationErrors,checkIsUserExists, resendUserEmailOtp);
userRouter.get('/verify/email', getVerifyEmailPage);
userRouter.get('/reset/user/password', checkIsUserExists, checkIsResetPasswordLinkValid, getChangePasswordPage);
userRouter.get('/auth/google',checkIsUserExists,getGoogleAuth);
userRouter.get('/auth/google/callback',checkIsUserExists, getGoogleAuthCallback);
userRouter.get('/home',checkIsUserAuthenticatedAndRedirect, getUserHomePage);
userRouter.get('/logout', checkIsUserAuthenticatedAndRedirect, logoutUser );
userRouter.get('/profile', checkIsUserAuthenticatedAndRedirect, getUserProfilePage);
userRouter.get('/profile/edit', checkIsUserAuthenticatedAndRedirect, getEditProfilePage);
userRouter.post('/profile/edit', checkIsUserAuthenticatedAndRedirect, updateProfile);



userRouter.post('/register',validateRegisterUser ,handleValidationErrors,  checkIsUserExists, registerNewUser);
userRouter.post('/login',validateLogin, handleValidationErrors, loginUserAccount);
userRouter.post('/verify/email',validateBodyEmail,handleValidationErrors, checkIsUserExists, verifyUserEmail);
userRouter.post('/verify/email/otp',validateOtp,validateBodyEmail,handleValidationErrors, checkIsUserExists, verifyUserEmailOtp);
userRouter.post('/reset/email/password',validateBodyEmail, handleValidationErrors, checkIsUserExists, forgottenUserPassword);
userRouter.post('/reset/user/password', checkResetPasswordTokenValid, changeUserPassword);





module.exports = userRouter;