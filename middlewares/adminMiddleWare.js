const { findOneAdminById } = require("../services/adminServices");
const { verifyAdminToken } = require("../utils/jwt");


const checkIsAdminExists = async(req,res,next) => {
const token = req.cookies?.token;
  try {
    const decoded = await verifyAdminToken(token);
    return res.redirect('/admin/dashboard');
  } catch {
    next(); 
  }

}


const checkIsAdminAuthenticated = async (req,res,next) => {
    const token = req.cookies?.token;
    

  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const decoded = await verifyAdminToken(token);
    const admin = await findOneAdminById(decoded.id);

    if (!admin) {
      return res.redirect('/admin/login')
    }

    if(admin.isBlocked){
        return res.redirect('admin/login?error=blocked');
    }

    res.locals.admin = admin;
    req.admin = admin;
    
    return next();
  } catch (err) {
    return res.redirect('/admin/login');
  }
}

module.exports = {checkIsAdminExists, checkIsAdminAuthenticated};