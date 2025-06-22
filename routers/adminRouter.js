const express = require('express');
const { getAdminDashboardPage, getAdminLoginPage, loginAdminAccount, getAdminAllUsersPage, toggleUserStatusById, toggleUserListedById, getEditUserPage, updateUserAccount, getCreateUserPage, createNewUserAccount } = require('../controllers/adminController');
const { checkIsAdminExists, checkIsAdminAuthenticated } = require('../middlewares/adminMiddleWare');
const { handleValidationErrors } = require('../validators/validator');
const { createAdmin } = require('../services/adminServices');
const categoryRouter  = require('./categoryRouter');
const brandRouter = require('./brandRouter');
const productRouter = require('./productRouter');
const bannerRouter = require('./bannerRouter');
const { validateLogin } = require('../validators/authValidator');
const { validateUserListQuery } = require('../validators/QueryValidator');
const { validateUserIdParam } = require('../validators/ParamValidator');
const { validateUserBody } = require('../validators/bodyValidator');
const couponsRouter = require('./adminCouponsRouter');
const adminOrderRouter = require('./adminOrderRouter');
const adminInventoryRouter = require('./adminInventoryRouter');
const adminRouter = express.Router();



adminRouter.use((req,res,next)=>{
        res.locals.layout = './layout/adminLayout'
        res.locals.noSidebar = false;
        res.locals.noFooter = true;
        res.locals.admin = null;
        next();
});

adminRouter.use('/categories',checkIsAdminAuthenticated, categoryRouter);
adminRouter.use('/brands', checkIsAdminAuthenticated, brandRouter);
adminRouter.use('/products',checkIsAdminAuthenticated, productRouter);
adminRouter.use('/banners',checkIsAdminAuthenticated, bannerRouter);
adminRouter.use('/coupons',checkIsAdminAuthenticated, couponsRouter);
adminRouter.use('/orders',checkIsAdminAuthenticated, adminOrderRouter);
adminRouter.use('/inventory', checkIsAdminAuthenticated, adminInventoryRouter);


adminRouter.get('/login',checkIsAdminExists, getAdminLoginPage);
adminRouter.get('/dashboard', checkIsAdminAuthenticated, getAdminDashboardPage);
adminRouter.get('/users/all', validateUserListQuery, handleValidationErrors, checkIsAdminAuthenticated, getAdminAllUsersPage );
adminRouter.get('/users/edit/:id', validateUserIdParam, handleValidationErrors, checkIsAdminAuthenticated , getEditUserPage);
adminRouter.get('/users/create',checkIsAdminAuthenticated, handleValidationErrors, getCreateUserPage);


adminRouter.get('/create/admin', createAdmin); // admin account


adminRouter.post('/login',validateLogin, handleValidationErrors, checkIsAdminExists , loginAdminAccount );
adminRouter.patch('/users/toggle-status/:id',validateUserIdParam,handleValidationErrors, toggleUserStatusById);
adminRouter.patch('/users/unlist/:id',validateUserIdParam,handleValidationErrors, toggleUserListedById);
adminRouter.post('/users/edit/:id', validateUserBody, validateUserIdParam, handleValidationErrors, checkIsAdminAuthenticated, updateUserAccount);
adminRouter.post('/users/create',validateUserBody,handleValidationErrors, checkIsAdminAuthenticated, createNewUserAccount);


 
 

module.exports = adminRouter;