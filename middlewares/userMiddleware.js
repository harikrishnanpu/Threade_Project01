const Users = require('../models/userModel.js');
const { verifyToken } = require('../utils/jwt');

const checkIsUserAuthenticated = async (req,res,next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  

  if (!token) {
    return res.redirect('/user/login');
  }

  try {
    const decoded = await verifyToken(token);
    next(); 
  } catch (err) {
    return res.redirect('/user/login');
  }

}


const checkIsUserExists = async (req,res,next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  try {
    const decoded = await verifyToken(token);
    return res.redirect('/user/home');
  } catch {
    next(); 
  }

}


const checkIsUserVerified = async (req,res,next) =>{
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  try{

    const decoded = await verifyToken(token);
    const user = await Users.findById(decoded.id);
    
    

    if (!user) {
      return res.redirect('/user/login');
    }

    if (!user.isVerified) {
      return res.redirect('/user/verify/email');
    }

    if (user.isBlocked) {
      return res.redirect('/user/login?error=blocked');
    }

    req.user = user;
    next();
  }catch(err){
     return res.redirect('/user/login');
  }


}





module.exports = { checkIsUserAuthenticated, checkIsUserExists, checkIsUserVerified }