
const bcrypt = require('bcrypt');

const comparePassword =  async (password,dbPassword) =>{
    return await bcrypt.compare(password,dbPassword)
}

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
}


module.exports = {comparePassword, hashPassword};