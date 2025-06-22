const {  getPageWiseBanner } = require('../services/bannerService');
const { getAllBrands } = require('../services/brandServices');
const { getCartCount } = require('../services/userCartService');
const { getProducts, getHotProducts, getAllProductsByCategory, getHotProductsByMainCategory } = require('../services/userproductServices');
const { findOneUserById } = require('../services/userServices');
const { verifyToken, verifyResetToken } = require('../utils/jwt');


const checkIsUserAuthenticatedAndRedirect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect('/user/login')
  }

  try {
    const decoded = await verifyToken(token);
    const user = await findOneUserById(decoded.id);
    
    if (!user) {
      return res.redirect('/user/login');
    }
    
    if (!user.isListed) {
      res.locals.user = null;
      return res.redirect(`/user/login?error=deleted`);
    }
    
    if (!user.isVerified) {
      res.locals.user = null;
      return res.redirect(`/user/verify/email/${user._id}/otp`);
    }
    
    if(user.isBlocked) {
      res.locals.user = null;
      return res.redirect('/user/login?error=blocked');
    }
    
    const cartCount = await getCartCount(user._id);

    res.locals.user = user;
    res.locals.cartCount = cartCount;
    req.user = user;
    return next(); 
  } catch (err) {
    if(err.message == "deleted"){
      return res.redirect('/user/login?error=deleted')
    }

    return res.redirect(`/user/login?error=${err.message}`);
  }
};


const checkIsUserAuthenticated = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return next();
  }

  try {
    const decoded = await verifyToken(token);
    const user = await findOneUserById(decoded.id);

    if (!user.isListed) {
      return next();
    }

    if (!user.isVerified) {
      res.locals.user = null;
      return next();
    }

    if(user.isBlocked) {
      res.locals.user = null;
      return next();
    }

    const cartCount = await getCartCount(user._id);

    res.locals.user = user;
    res.locals.cartCount = cartCount;
    req.user = user;
    return next(); 
  } catch (err) {
    return next();
  }
};



const checkIsUserExists = async (req,res,next) => {
    const token = req.cookies?.token;
  try {
    const decoded = await verifyToken(token);
    const user = await findOneUserById(decoded.id);
    
    if(user.isBlocked){
      return next();
    }
    return res.redirect('/user/home');
  } catch {
    next(); 
  }
}


const checkIsUserVerified = (req, res, next) => {
  const user = req.user;

  if(!user){
   return next();
  }
  
  if (!user.isVerified) {
    return res.redirect('/user/verify/email');
  }

  if (user.isBlocked) {
    return res.redirect('/user/login?error=blocked');
  }

  return next();

};


const checkAndRedirect = async (req, res) => {

 const token = req.cookies?.token;


 try{

  const [
  data,
  banner,
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

 
 try {

    const decoded = await verifyToken(token);
    
    if (decoded) {
      return res.redirect('/user/home');
    }
    res.locals.user = null;
    return res.render('user/landing',{ noHeader: false, user: null, noFooter: false, products: data.products, banners: banner, brands, hotProducts, categoryWiseProducts });
  } catch (err) {
    res.locals.user = null;
    return res.render('user/landing',{ noHeader: false, user: null, noFooter: false, products: data.products, banners: banner, brands, hotProducts, categoryWiseProducts });
  }


}catch(err){
  return res.status(500).json({message: err.message})
}

};

const checkResetPasswordTokenValid = async (req,res,next) =>{
  const {token} = req.query;
  

  if(!token){
    return res.status(500).json({message: 'token expired'})
  }

  try{

    const decoded = await verifyResetToken(token);

    if(!decoded){
      return res.status(500).json({message: 'token expired'})
    }

    const user = await findOneUserById(decoded.id);

    req.user = user;
    return next();
 
  }catch(err){
    return res.status(500).json({message: err.message || 'netwrok error'})
  }

}


const checkIsResetPasswordLinkValid = async (req,res,next) =>{
    const {token} = req.query;

    console.log(req.query);
    

  if(!token){
    return res.redirect('/user/forgotten-password?error=expired')
  }

    try{

    const decoded = await verifyResetToken(token);

    if(!decoded){
      return res.redirect('/user/forgotten-password?error=expired')
    }

    const user = await findOneUserById(decoded.id);

    req.user = user;
    return next();

  }catch(err){
    return res.redirect('/user/forgotten-password?error=expired')
  }

}





module.exports = { checkIsUserAuthenticatedAndRedirect, checkIsUserAuthenticated, checkIsUserExists, checkIsUserVerified, checkAndRedirect, checkResetPasswordTokenValid, checkIsResetPasswordLinkValid }