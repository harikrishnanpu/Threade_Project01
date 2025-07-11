const express = require('express');
const { getLoginPage, getSignUpPage, getForgottenPasswordPage, getChangePasswordPage, registerNewUser, getUserHomePage, getGoogleAuth, getGoogleAuthCallback, loginUserAccount, getVerifyEmailPage, verifyUserEmail, getVerifyEmailOtpPage, verifyUserEmailOtp, resendUserEmailOtp, forgottenUserPassword, changeUserPassword, logoutUser } = require('../../controllers/user/userController');
const { checkIsUserAuthenticatedAndRedirect, checkIsUserExists, checkResetPasswordTokenValid, checkIsResetPasswordLinkValid, checkIsUserAuthenticated } = require('../../middlewares/userMiddleware');
const productRouter = require('./userProductRouter');
const { handleValidationErrors } = require('../../validators/validator');
const { validateRegisterUser, validateLogin, validateOtp } = require('../../validators/authValidator');
const { validateUserIdParam } = require('../../validators/ParamValidator');
const { validateQueryEmail } = require('../../validators/QueryValidator');
const { validateBodyEmail } = require('../../validators/bodyValidator');
const cartRouter = require('./userCartRouter');
const userProfileRouter = require('./userProfileRouter');
const orderRouter = require('./userOrderRouter');
const wishlistController = require('../../controllers/user/userWishlistController');
const userRouter = express.Router();


userRouter.use((req,res,next)=>{
      res.locals.noHeader = false;
      res.locals.noFooter = false;
      res.locals.isSubheaderHidden = false;
      res.locals.user = null;
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
      res.locals.layout = './layout/userLayout'
      next();
});



userRouter.use('/products',checkIsUserAuthenticated, productRouter);
userRouter.use('/cart', checkIsUserAuthenticatedAndRedirect, cartRouter);
userRouter.use('/profile', checkIsUserAuthenticatedAndRedirect, userProfileRouter);
userRouter.use('/orders', checkIsUserAuthenticatedAndRedirect, orderRouter);


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


userRouter.get('/wishlist', checkIsUserAuthenticatedAndRedirect, wishlistController.renderWishlistPage);
userRouter.get('/api/wishlist', checkIsUserAuthenticatedAndRedirect, wishlistController.getWishlistItems);
userRouter.get('/wishlist/count',checkIsUserAuthenticatedAndRedirect, wishlistController.countWishLists);
userRouter.post('/wishlist/add',checkIsUserAuthenticatedAndRedirect, wishlistController.addToWishlist);
userRouter.delete('/wishlist/remove/:itemId',checkIsUserAuthenticatedAndRedirect, wishlistController.removeFromWishlist);
userRouter.delete('/wishlist/clear',checkIsUserAuthenticatedAndRedirect, wishlistController.clearWishlist);

// userRouter.get('/profile', checkIsUserAuthenticatedAndRedirect, getUserProfilePage);
// userRouter.get('/profile/edit', checkIsUserAuthenticatedAndRedirect, getEditProfilePage);
// userRouter.post('/profile/edit', checkIsUserAuthenticatedAndRedirect, updateProfile);



userRouter.post('/register',validateRegisterUser ,handleValidationErrors,  checkIsUserExists, registerNewUser);
userRouter.post('/login',validateLogin, handleValidationErrors, loginUserAccount);
userRouter.post('/verify/email',validateBodyEmail,handleValidationErrors, checkIsUserExists, verifyUserEmail);
userRouter.post('/verify/email/otp',validateOtp,handleValidationErrors, checkIsUserExists, verifyUserEmailOtp);
userRouter.post('/reset/email/password', checkIsUserExists, forgottenUserPassword);
userRouter.post('/reset/user/password', checkResetPasswordTokenValid, changeUserPassword);





module.exports = userRouter;