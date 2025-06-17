const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-dev-secret';
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'your-dev-admin-secret';
const RESET_SECRET = process.env.RESET_SECRET || 'your-dev-reset-secret';



const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

const generateAdminToken = (userId,role) => {
  return jwt.sign({ id: userId, role: role || 'admin' }, JWT_ADMIN_SECRET, { expiresIn: '7d' });
};

const generateResetToken = (id) => {
  return jwt.sign({ id }, RESET_SECRET, { expiresIn: '15m' });
}


const verifyToken = async (token) =>{
  try{
   const decoded = await jwt.verify(token, JWT_SECRET)
   if(!decoded){
    throw new Error('token expired');
   }

   return decoded;
  }catch(err){
    throw new Error(err.message);
  }
}

const verifyResetToken = async (token) =>{
  try{
   const decoded = await jwt.verify(token, RESET_SECRET)
   if(!decoded){
    throw new Error('token expired');
   }

   return decoded;
  }catch(err){
    throw new Error(err.message);
  }
}

const verifyAdminToken = async (token) =>{
  try{
    const decoded = await jwt.verify(token,JWT_ADMIN_SECRET)
    if(!decoded){
      throw new Error('token expired')
    }

    return decoded;
  }catch(err){
    throw new Error(err.message)
  }
}

module.exports = { generateToken, verifyToken, generateResetToken, generateAdminToken, verifyAdminToken, verifyResetToken };