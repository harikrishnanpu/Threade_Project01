const passport = require("passport")
const { insertOneUser, loginUser, findOneUserByEmail, findOneUserById, getUserResetPasswordLink } = require("../services/userServices")
const { generateToken } = require("../utils/jwt");
const { sendOtpToEmail, verifyEmailOtp, findAndDeletePreviousOtp, sendResetPasswordLinkToEmail } = require("../services/emailVerificationService.js");
const otpModel = require("../models/otpModel.js");
const { generateOtp } = require("../utils/otp");
const { body, validationResult } = require('express-validator');
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

const getUserHomePage = async (req,res) =>{
    res.render('user/home')
}

const getVerifyEmailPage = async (req,res) =>{
  res.render('user/verify-email', {noHeader: true});
}

const getVerifyEmailOtpPage = async (req,res) => {
  try{
    const userId = req.params.id;
    const user = await findOneUserById(userId);
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

  // await Users.deleteMany({});

  try {
    
    const newUser = await insertOneUser({ name, phone, email, password });

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
      return res.redirect(`/user/verify/email/${user._id}/otp`)
    }
    

res.cookie('token', token, {
  httpOnly: true,
  secure: true,       
  sameSite: 'strict',   
  maxAge: 7 * 24 * 60 * 60 * 1000 
});

    res.status(201).json({
      success: true,
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
    res.status(500).json({ success: false, message: err.message });
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

    const isOtpValid = await verifyEmailOtp(email,otp);

    if(isOtpValid){

      user.isVerified = true;
      await user.save();
      
      // 4. Generate token
      const token = generateToken(user._id);
      
      // 5. Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,       // set to false in development if not using HTTPS
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // 6. Send response
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








module.exports = { getLoginPage, getSignUpPage, getForgottenPasswordPage, getChangePasswordPage, registerNewUser , getUserHomePage, getGoogleAuth , getGoogleAuthCallback, loginUserAccount, verifyUserEmailOtp, getVerifyEmailPage,verifyUserEmail, getVerifyEmailOtpPage, resendUserEmailOtp, forgottenUserPassword};






