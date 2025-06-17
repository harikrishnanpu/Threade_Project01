const Users = require("../models/userModel.js");
const bcrypt = require('bcrypt');
const { generateResetToken } = require("../utils/jwt.js");
const { comparePassword, hashPassword } = require("../utils/bcrypt.js");
const Brand = require("../models/brandModel.js");
const Product = require("../models/productModel.js");
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


const insertOneUser = async ({name,phone,email,password, isBlocked=false, isListed=true, isVerified=false}) => {
    try{
        
        const user = await Users.findOne({ email });

        if(user){
            throw new Error('User Already Exists');
        }
        

const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new Users({
    name,
    phone: phone || null,
    email,
    password: hashedPassword,
    isBlocked: Boolean(isBlocked),
    isListed: Boolean(isListed),
    isVerified: Boolean(isVerified)
  });

  

  return await newUser.save();

    }catch(err){
        throw new Error('Error Creating User: '+err);
    }
}


const findOneUserByEmail = async (email) =>{
    try{
        const user = await Users.findOne({email});

        if(!user){
            throw new Error('User not found')
        }

        if(!user.isListed) {
            throw new Error('user account is deleted')
        }
        
        return user;
    }catch(err){
        throw new Error(err.message)
    }
}


const findOneUserById = async (userId) =>{
    try{
        const user = await Users.findById(userId);

        if(!user){
            throw new Error('User not found')
        }

        if(!user.isListed) {
            throw new Error('deleted')
        }
        
        return user;
    }catch(err){
        throw new Error(err.message)
    }
}


const loginUser = async (email,password) => {

    try{
        
        const user = await Users.findOne({email});
        console.log(user);
        

        if(!user){
            throw new Error('User not Found');
        }

        if(!user.isListed){
            throw new Error('Account is deleted')
        }
        
        if (user.isBlocked) {
            throw new Error('Your account is blocked. Contact support.');
        }

        if(user.googleId && !user.password){
            throw new Error('Your account is connected via Google. To manage your password, visit your Google account')
        }


        const comparePassword = await bcrypt.compare(password,user.password);

        if(!comparePassword){
            throw new Error('Password Not Match')
        }

        return user;

    }catch(err){
        throw new Error('Error Login:'+err.message)
    }

}


const getUserResetPasswordLink = async (email) =>{
    try{
        const user = await findOneUserByEmail(email);

        if(!user){
            throw new Error('user not found');
        }

        if(user.isBlocked){
            throw new Error('user account is blocked. contact support center')
        }

        if(!user.isListed){
           throw new Error('user account is deleted') 
        }

        if(!user.isVerified){
            throw new Error('user is not verified.please verify you email')
        }

        if(user.googleId && !user.password){
            throw new Error('Your account is connected via Google. To manage your password, visit your Google account')
        }

        const resetToken = generateResetToken(user._id);

        const resetLink = `${BASE_URL}/user/reset/user/password?token=${resetToken}`;

        return resetLink;

    }catch(err){
        throw new Error(err.message);
    }
}


const changePassword = async (email,newPassword) =>{
    try{

        const user = await findOneUserByEmail(email);

        if(!user){
            throw new Error('user not found')
        }

        if(!user.isListed){
            throw new Error('user account is deleted')
        }

        if(user.isBlocked){
            throw new Error('user account is blocked')
        }

        if(!user.isVerified){
            throw new Error('user account is not verified , verify first')
        }

       const compareResult = await comparePassword(newPassword, user.password);

       if(compareResult){
        throw new Error('new password must not be previous password')
       }

       user.password = await hashPassword(newPassword);
       return await user.save();

    }catch(err){
        throw new Error(err.message);
    }
}

const getHomePageData = async () => {
  try {
    // Fetch all brands
    const brands = await Brand.find({ isActive: true });
    
    // Fetch featured products
    const featuredProducts = await Product.find({ isFeatured: true, isActive: true })
      .limit(8)
      .sort({ createdAt: -1 });
    
    // Fetch new arrivals
    const newArrivals = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8);
    
    // Fetch hot sales products
    const hotSales = await Product.find({ isOnSale: true, isActive: true })
      .limit(8);
    
    // Fetch deal of the day
    const dealOfTheDay = await Product.findOne({ isDealOfTheDay: true, isActive: true });
    
    return {
      brands,
      featuredProducts,
      newArrivals,
      hotSales,
      dealOfTheDay
    };
  } catch (err) {
    console.error('Error in service layer:', err);
    throw err;
  }
};


const updateUserProfile = async (userId, { name, phone, dateOfBirth }) => {
  try {
    const user = await Users.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;

    await user.save();
    return user;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  insertOneUser,
  loginUser,
  findOneUserByEmail,
  findOneUserById,
  getUserResetPasswordLink,
  changePassword,
  getHomePageData,
  updateUserProfile,
};
