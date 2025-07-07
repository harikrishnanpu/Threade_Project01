const { loginAdmin, getAllUsers, changeUserStatusById, unlistUserById, updateUser, getDashboardData } = require("../../services/adminServices");
const { findOneUserById, insertOneUser } = require("../../services/userServices");
const { hashPassword } = require("../../utils/bcrypt");
const { generateAdminToken } = require("../../utils/jwt");


const getAdminDashboardPage = async(req,res) => {

  try{

    
    const {totals, dateRange, startDate, endDate, paymentMethod, status, chartData, topSellingProducts, topSellingBrands, topSellingCategories, recentOrders} = await getDashboardData(req.query);
    res.render('admin/dashboard',{
       totals, 
       dateRange,
       startDate, 
       endDate,
       paymentMethod,
       status  ,
       chartData,
       topSellingProducts,
       topSellingCategories,
       topSellingBrands,
       recentOrders
      });

  }catch(err){
    res.status(500).json({message: err.message})
  }
}

const getAdminLoginPage = async (req,res) =>{
    res.render('admin/login', {noSidebar: true, noFooter: false})
}

const getAdminAllUsersPage = async (req, res) => {
  try {
    const result = await getAllUsers(req.query);
    
    const sortOrderForFrontend = result.sortOrder === -1 ? 'desc' : 'asc';

    res.render('admin/allusers', {
      ...result,
      sortOrder: sortOrderForFrontend,
      error: null
    });

  } catch (error) {

    res.status(500).render('admin/allusers', {
      users: [],
      totalUsers: 0,
      totalPages: 0,
      currentPage: 1,
      limit: 10,
      search: req.query.search || '',
      status: req.query.status || 'all',
      sortField: req.query.sortField || 'createdAt',
      sortOrder: 'desc',
      showUnlisted: false,
      error: 'Failed to load users. Please try again.',
      success: null
    });
  }
};


const getCreateUserPage = async (req,res) =>{
  res.render('admin/createUser');
}

const getEditUserPage = async (req,res) => {
  const {id: userId} = req.params;
  try{
    const user = await findOneUserById(userId);
    res.render('admin/editUser', { user: user, error: null})
  }catch(err){
    res.render('admin/editUser',{user: null, error: err.message})
  }
}


const logoutAdmin = async (req,res) => {
    try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    });

    return res.redirect('/admin/login');
  } catch (err) {
    return res.redirect('/admin/login');
  }
}






const loginAdminAccount = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await loginAdmin(email, password);
    
    if (admin) {
      const token = await generateAdminToken(admin._id, admin.role); 

      res.cookie('token', token, {
        httpOnly: true,
        secure: false,       
        sameSite: 'strict',   
        maxAge: 7 * 24 * 60 * 60 * 1000 
      });

      res.status(201).json({
        success: true,
        user: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone,
        },
        token
      });
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


const toggleUserStatusById = async (req,res)=> {
  const { id: userId } = req.params;
  try{
    const user = await changeUserStatusById(userId);
    res.status(200).json({success: true, user});
  }catch(err){
    res.status(500).json({message: err.message});
  }
}

const toggleUserListedById = async (req,res) => {
  const {id: userId} = req.params;
    try{
    const unListedUser = await unlistUserById(userId);
    res.status(200).json({success: true, user: unListedUser.deletedUser})
  }catch(err){
    res.status(500).json({message: err.message})
  }
}

const updateUserAccount = async (req,res) =>{
  const {id: userId} = req.params;
  try{
    const udpatedUser = await updateUser(userId, req.body);
    res.status(200).json({success: true, message: 'updated successfully'});
  }catch(err){
    res.status(500).json({message: err.message, success: false})
  }
}

const createNewUserAccount = async (req,res) =>{
  try{
    const newUser = await insertOneUser(req.body);
    res.status(201).json({message: 'user created successfully', success: true})
  }catch(err){
    res.status(500).json({message: err.message})
  }
}





module.exports = { getAdminDashboardPage, getAdminLoginPage, loginAdminAccount, getAdminAllUsersPage, toggleUserStatusById, toggleUserListedById, getEditUserPage, updateUserAccount, getCreateUserPage, createNewUserAccount, logoutAdmin };