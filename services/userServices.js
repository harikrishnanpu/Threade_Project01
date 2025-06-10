const Users = require("../models/userModel.js");
const bcrypt = require('bcrypt');
const { generateResetToken } = require("../utils/jwt.js");
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';


const insertOneUser = async ({name,phone,email,password}) => {
    try{
        
        const user = await Users.findOne({ $or: [{ email }, { phone }] });

        if(user){
            throw new Error('User Already Exists');
        }
        

const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new Users({
    name,
    phone,
    email,
    password: hashedPassword
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
        
        return user;
    }catch(err){
        throw new Error(err.message)
    }
}


const loginUser = async (email,password) => {

    try{
        
        const user = await Users.findOne({email});

        if(!user){
            throw new Error('User not Found');
        }

        if (!user.password) {
            throw new Error('Account linked with Google. Use Google Sign-In instead.');
        }


        const comparePassword = await bcrypt.compare(password,user.password);

        if(!comparePassword){
            throw new Error('Password Not Match')
        }

        if (user.isBlocked) {
            throw new Error('Your account is blocked. Contact support.');
        }

        return user;

    }catch(err){
        throw new Error('Error Login:'+err.message)
    }

}


const getUserResetPasswordLink = async (email) =>{
    try{
        const user = await findOneUserByEmail(email);
        if(user.isBlocked){
            throw new Error('user account is blocked. contact support center')
        }

        if(!user.isVerified){
            throw new Error('user is not verified.please verify you email')
        }

        if(user.googleId && !user.password){
            throw new Error('Your account is connected via Google. To manage your password, visit your Google account')
        }

        const resetToken = generateResetToken();

        const resetLink = `${BASE_URL}/user/reset/user/password?token=${resetToken}`;

        return resetLink;

    }catch(err){
        throw new Error(err.message);
    }
}


module.exports = { insertOneUser, loginUser, findOneUserByEmail, findOneUserById, getUserResetPasswordLink }