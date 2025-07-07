const Admin = require("../models/adminModel");
const Orders = require("../models/orderModel");
const Products = require("../models/productModel");
const Users = require("../models/userModel");
const { comparePassword, hashPassword } = require("../utils/bcrypt");
const { getAllUsersQuery } = require("../utils/queries/getAllUsersQueri");



const loginAdmin = async (email,password) => {
    try{
        const admin = await Admin.findOne({email});
        if(!admin){
            throw new Error('admin account not found');
        }

        if(admin.isBlocked){
            throw new Error('your admin account is blocked')
        }

        const compareResult = await comparePassword(password,admin.password);

        if(!compareResult){
                const err = new Error("Password is incorrect");
                err.status = 400;
                throw err;
        }

        return admin;

    }catch(err){
        throw new Error(err.message);
    }
}


const findOneAdminById = async (adminId) =>{
    try{
        const admin = await Admin.findById(adminId);
        if(!admin){
            throw new Error('admin account not found')
        }

        return admin;
    }catch(err){
        throw new Error(err.message);
    }
}


const createAdmin = async(req,res) => {
    try{

        const admin = await Admin.create({
            name: 'Admin',
            email: 'admin@threade.com',
            password: await hashPassword('Admin@1234'),
            role: 'super'
        })
        
        res.json({message: 'admin created successfully', admin});

    }catch(err){
        res.json({err});
    }
}


const getAllUsers = async (query) => {
  try {
    const {
      filter,
      sort,
      limit,
      page,
      search,
      status,
      sortField,
      sortOrder,
      showUnlisted
    } = getAllUsersQuery(query);


    const [users, totalUsers] = await Promise.all([
      Users.find(filter)
        .select('-password -__v')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Users.countDocuments(filter)
    ]);
    

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      totalUsers,
      totalPages,
      currentPage: page,
      limit,
      search,
      status,
      sortField,
      sortOrder,
      showUnlisted
    };
  } catch (error) {
    console.error('Error in getAllUsers service:', error);
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};


const changeUserStatusById = async (userId) =>{
  try{
    const user = await Users.findById(userId);
    if(!user){
      throw new Error('user not found')
    }

    if(user.isBlocked){
      user.isBlocked = false;
    }else{
      user.isBlocked = true;
    }

    return await user.save();
  }catch(err){
    throw new Error(err.message);
  }
};

const unlistUserById = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await Users.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if(user.isListed){
      user.isListed = false;
    }else{
      user.isListed = true;
    }

    await user.save();

    return {
      success: true,
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };
  } catch (err) {
    throw new Error(`Failed to delete user: ${err.message}`);
  }
};

const updateUser = async (userId, reqBody) => {
  const { name, email, phone, password, dateOfBirth } = reqBody;
  
  const isVerified = reqBody.isVerified === "true"
  const isBlocked = reqBody.isBlocked === "true"
  const isListed = reqBody.isListed === "true"

  try {
    const user = await Users.findById(userId)
    if (!user) {
      throw new Error('user not found');
    }

    const updateData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : undefined,
      dateOfBirth: dateOfBirth || undefined,
      isVerified,
      isBlocked,
      isListed,
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    if (password && password.trim()) {
      updateData.password = await hashPassword(password)
    }

    if (email !== user.email) {
      const existingUser = await Users.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userId },
      })
      if (existingUser) {
        throw new Error('user with this email already exists')
      }
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await Users.findOne({
        phone: phone.trim(),
        _id: { $ne: userId },
      })
      if (existingPhone) {
        throw new Error('user with this phone number already exists')
      }
    }

    const updatedUser = await Users.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })

    return updatedUser;
  } catch (err) {
    let errorMessage = err.message
    if (err.code === 11000) {
      if (err.keyPattern.email) {
        errorMessage = "Email address is already in use"
      } else if (err.keyPattern.phone) {
        errorMessage = "Phone number is already in use"
      }
    }

    throw new Error(errorMessage);
  }
}



const getDashboardData = async (query) => {

  const { dateRange = 'month', startDate, endDate ,paymentMethod , status  } = query;

  try{

    const filters = {};
    const now = new Date();
    let from,to;

    if(dateRange && dateRange !== 'custom' ){
      to = new Date();
      switch (dateRange) {
        case 'today':
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          from = new Date(now.setDate(now.getDate() - 1));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setHours(23, 59, 59);
          break;
        case 'week':
          from = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last-week':
          from = new Date(now.setDate(now.getDate() - 14));
          to = new Date(now.setDate(now.getDate() + 7));
          break;
        case 'month':
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'year':
          from = new Date(now.getFullYear(), 0, 1);
          break;
      }

    }else if( dateRange == 'custom' && startDate && endDate ){
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      to = new Date(endDate);
      to.setHours(23, 59, 59);
    }




    if(from && to){
      filters.createdAt = { $gte: from , $lte: to }
    }



    if (status && status !== 'all') {
      filters.orderStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filters.paymentMethod = paymentMethod;
    }

console.log(filters); 



    const orders = await Orders.find(filters).populate('user', 'name email').lean();
    const users = await Users.find({ isBlocked: false, createdAt: filters.createdAt  }).lean();
    

    const totalOrders = orders.length;
    const totalIncome = orders.filter(ord => ord.paymentStatus === 'paid').reduce((total, ord) => total + ord.totalAmount, 0);
    const totalOrderAmount = orders.reduce((total, ord) => total + ord.totalAmount  ,0);
    const totalPendingAmt = totalOrderAmount - totalIncome;
    const totalDiscount = orders.reduce((total,ord) => total + ord.coupon?.discountAmount , 0 );
    const totalUsers = users.length;



    const salesMapTrend = new Map();
    
    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      salesMapTrend.set(date, ( salesMapTrend.get(date) || 0) + order.totalAmount );
    }

const paymentMethodCodMapTrend = new Map();
const paymentMethodOnlineMapTrend = new Map();

for (const order of orders) {
  const date = new Date(order.createdAt).toISOString().split('T')[0];

  if (order.paymentMethod === 'cod') {
    paymentMethodCodMapTrend.set(date, (paymentMethodCodMapTrend.get(date) || 0) + 1);
  }

  if (order.paymentMethod === 'online') {
    paymentMethodOnlineMapTrend.set(date, (paymentMethodOnlineMapTrend.get(date) || 0) + 1);
  }
}



    
    for (const order of orders) {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      salesMapTrend.set(date, ( salesMapTrend.get(date) || 0) + order.totalAmount );
    }
    
    const paymentMap = {};

    for(const order of orders){
        const method = order.paymentMethod || 'unknown';
        paymentMap[method] = (paymentMap[method] || 0) + 1;
    }


    const chartData = {

  salesTrend: {
    labels: [...salesMapTrend.keys()],
    data: [...salesMapTrend.values()]
  }
  ,paymentMethods: {
    labels: Object.keys(paymentMap),
    data: Object.values(paymentMap)
  }

};





const orderedProducts = await Orders.aggregate([
  { $match: { createdAt: filters.createdAt  } },
  { $unwind: '$items' },
  { $unwind: '$items.variant' },
  {$group: {
    _id: {
        productId: '$items.productId',
        variant: '$items.variant',
    },
    itemsSold: { $sum: '$items.quantity' }
    }},
  { $sort: { itemsSold: -1 } }
]);

const products = await Products.find({}).populate('category').populate('brand').lean();
const productMap = new Map(products.map(p => [ p._id.toString(), p ]));

const topSellingProducts = orderedProducts.map((p) => {
  const prod = productMap.get(p._id.productId.toString())
  return{
    productId: prod._id,
    name: prod.name,
    itemSold: p.itemsSold,
    variant: prod.variants.find(i => i.color ==  p._id.variant.color && i.size == p._id.variant.size),
    category: prod.category,
    brand: prod.brand,
    stock: prod.variants.find(i => i.color ==  p._id.variant.color && i.size == p._id.variant.size).stock,
  }
});


const topSellingCategories = topSellingProducts.sort((a,b) =>  b.itemSold - a.itemSold)
.reduce((categories,product) => {

  const catIndex = categories.findIndex(c =>  c.category._id.toString() == product.category._id.toString())

  if(catIndex !== -1){
    categories[catIndex].sold += product.itemSold
  }else{
    categories.push({
      category: product.category,
      sold: product.itemSold
    })
  }

  return categories

  },[]);


const topSellingBrands = topSellingProducts.sort((a,b) =>  b.itemSold - a.itemSold)
.reduce((brands,products)=> { 

  const brandIndex = brands.findIndex(b => b.brand._id.toString() == products.brand._id.toString())

  if(brandIndex !== -1){

    brands[brandIndex].sold +=  products.itemSold

  }else{

    brands.push({
      brand: products.brand,
      sold: products.itemSold
    })

  }

  return brands

},[]);


const recentOrders = await Orders.find({ createdAt: filters.createdAt }).sort({ createdAt: -1  }).lean().limit(6);



    const totals = {totalOrders , totalIncome,  totalOrderAmount, totalOrderAmount , totalPendingAmt , totalDiscount , totalUsers  }

    return {  totals, startDate, endDate, paymentMethod, status , dateRange , chartData, topSellingProducts, topSellingCategories , topSellingBrands, recentOrders}

  }catch(err){
    console.log(err);
    
    throw new Error(err.message);
  }

}



 


module.exports = {loginAdmin , findOneAdminById, createAdmin, getAllUsers, changeUserStatusById, unlistUserById, updateUser, getDashboardData}; 