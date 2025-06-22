const passport = require("passport")
const { insertOneUser, loginUser, findOneUserByEmail, findOneUserById, getUserResetPasswordLink, changePassword, getHomePageData, updateUserProfile } = require("../services/userServices")
const { generateToken } = require("../utils/jwt");
const { sendOtpToEmail, verifyEmailOtp, findAndDeletePreviousOtp, sendResetPasswordLinkToEmail } = require("../services/emailVerificationService.js");
const otpModel = require("../models/otpModel.js");
const { generateOtp } = require("../utils/otp");
const { getFeaturedProducts, getNewProducts, getSaleProducts, getDealOfTheDay, getAllFeaturedBrands, getProducts, getHotProducts, getAllProductsByCategory, getHotProductsByMainCategory } = require("../services/userproductServices.js");
const Product = require("../models/productModel.js");
const bannerModel = require("../models/bannerModel.js");
const Category = require("../models/categoryModel.js");
const { getPageWiseBanner } = require("../services/bannerService.js");
const { getAllBrands } = require("../services/brandServices.js");
require('../utils/passport');


const getLoginPage = async (req,res)=>{
    res.render('user/login',{noHeader: true})
}

const getSignUpPage  = async (req,res)=>{
    res.render('user/signup',{noHeader: true})
}

const getForgottenPasswordPage = async (req,res)=>{
    res.render('user/forgotten-password',{noHeader: true})
}

const getChangePasswordPage = async (req,res)=>{
    res.render('user/change-password',{noHeader: true})
}

const getUserHomePage = async (req, res) => {
  try {

  const [
  data,
  banners,
  brands,
  hotProducts,
  categoryWiseProducts
] = await Promise.all([
  getProducts(),
  getPageWiseBanner(),
  getAllBrands(),
  getHotProductsByMainCategory(6),
  getAllProductsByCategory(6)
]);



    
    res.render('user/home', {
      data,
      banners,
      brands,
      hotProducts,
      categoryWiseProducts,
      title: 'Home | Your Store',
      metaDescription: 'Welcome to our online store. Shop the latest products and deals.'
    });
  } catch (error) {
    res.status(500).render('error', {
      message: 'Failed to load home page',
      error
    });
  }
};

const getVerifyEmailPage = async (req,res) => {
  res.render('user/verify-email', {noHeader: true});
}

const getVerifyEmailOtpPage = async (req,res) => {
  try{
    const userId = req.params.id;
    const user = await findOneUserById(userId);
    if(user.isVerified){
      return res.redirect('/user/login?error=verified')
    }
    res.render('user/email-otp',{ email: user.email, noHeader: true })
  }catch(err){
    res.redirect('/user/verify/email?error=invalid');
  }
}


const getGoogleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

const getGoogleAuthCallback = [
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/user/login?error=blocked'
  }),
  (req, res) => {
    const user = req.user;
    const token = generateToken(user._id);

res.cookie('token', token, {
  httpOnly: true,
  secure: false,       
  sameSite: 'lax',   
  maxAge: 7 * 24 * 60 * 60 * 1000 
});

    res.redirect('/user/home');
  }
];








const registerNewUser = async (req, res) => {
  const { name, phone, email, password } = req.body;
  try {
    
    const newUser = await insertOneUser({ name, phone, email, password });

    console.log(newUser);
    
    const otp = generateOtp();

    await otpModel.create({
      email,
      otp,
      expiresAt: Date.now() +  2 * 60 * 1000, // 2 mins expiry
    });

    await sendOtpToEmail(email, otp);

    res.status(201).json({
      success: true,
      message: 'User created. Please verify your email using the OTP sent.',
      userId: newUser._id
    });

  } catch (err) {
    console.log('Registration Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


const loginUserAccount = async (req,res) =>{
    const {email,password} = req.body;

    try{
        
    const user = await loginUser(email,password);

    const token = generateToken(user._id);

    if(!user.isVerified){
      return   res.status(300).json({
      success: false,
      redirected: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
    }
    

res.cookie('token', token, {
  httpOnly: true,
  secure: false,       
  sameSite: 'strict',   
  maxAge: 7 * 24 * 60 * 60 * 1000 
});

    res.status(201).json({
      success: true,
      redirected: false,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      token
    });

    }catch(err){
    console.log('Login Error:', err.message);
    res.status(500).json({ success: false, redirected: false, message: err.message });
    }
}


const verifyUserEmail = async (req,res) => {
  const {email} = req.body;
  try{
    const user = await findOneUserByEmail(email);
    const otp = generateOtp();
    const dbOtp =  await otpModel.create({
      email,
      otp,
      expiresAt: Date.now() +  2 * 60 * 1000, // 2 mins expiry
      });
    await sendOtpToEmail(user.email,otp);
    res.status(200).json({ email: user.email,userId: user._id, noHeader: true });
  }catch(err){
    res.status(500).json({ message: err.message })
  }
}



const verifyUserEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  try {

    const user = await findOneUserByEmail(email);

    if(user.isVerified){
      res.status(500).json({message: 'user is already verified'})
    }

    const isOtpValid = await verifyEmailOtp(email,otp);

    if(isOtpValid){

      user.isVerified = true;
      await user.save();
      
      const token = generateToken(user._id);
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,      
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        token,
      });
    }else{
      res.status(500).json({message: 'Invalid Otp'})
    }
      
  } catch (err) {    
    res.status(500).json({ success: false, message:  err.message || "Server error during OTP verification" });
  }

};


const resendUserEmailOtp = async (req,res) =>{

  const { email } = req.query;

  try{

    const deleted = await findAndDeletePreviousOtp(email);
    const user = await findOneUserByEmail(email);

    if(user.isVerified){
      res.redirect(`/user/login?error=verified`)
    }

    if(deleted){
      const otp = generateOtp();
      await otpModel.create({
      email,
      otp,
      expiresAt: Date.now() +  2 * 60 * 1000, // 2 mins expiry
      });

      await sendOtpToEmail(email,otp);
      res.redirect(`/user/verify/email/${user._id}/otp?resent=true`)

    }else{

      res.redirect('/user/verify/email?error=invalid')

    }


  }catch(err){

    res.status(500).json({ message: err.message , resent: false })

  }

}

const forgottenUserPassword = async (req,res)=>{

  const {email} = req.body;

  try{
    const resetLink = await getUserResetPasswordLink(email);

    await sendResetPasswordLinkToEmail(email,resetLink);

    return res.status(200).json({message: 'successfully sent mail. check your inbox'})

  }catch(err){
   return res.status(500).json({message: err.message})
  }

} 


const changeUserPassword = async (req, res) => {
  const { password } = req.body;



  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: 'Unauthorized request' });
    }

    const updatedUser = await changePassword(req.user.email, password);

    return res.status(200).json({ success: true, message: 'Password successfully changed' });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return res.redirect('/user/login');
  } catch (err) {
    return res.redirect('/user/login');
  }
};

const getUserProfilePage = async (req, res) => {
  res.render('user/profile', { user: req.user });
};

const getEditProfilePage = async (req, res) => {
  res.render('user/edit-profile', { user: req.user, error: null });
};

const updateProfile = async (req, res) => {
  try {
    const updated = await updateUserProfile(req.user._id, req.body);
    res.status(200).json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};









module.exports = {
  getLoginPage,
  getSignUpPage,
  getForgottenPasswordPage,
  getChangePasswordPage,
  registerNewUser,
  getUserHomePage,
  getGoogleAuth,
  getGoogleAuthCallback,
  loginUserAccount,
  verifyUserEmailOtp,
  getVerifyEmailPage,
  verifyUserEmail,
  getVerifyEmailOtpPage,
  resendUserEmailOtp,
  forgottenUserPassword,
  changeUserPassword,
  logoutUser,
  getUserProfilePage,
  getEditProfilePage,
  updateProfile,
};






