const Addresses = require("../models/addressModel");
const Address = require("../models/addressModel");


const getUserAddressById = async (userId) => {
    try{
        const address = await Address.find({ user: userId })
    }catch(err){
        throw new Error(err.message);
    }

}


const insertOneUserAddressById = async (userId, reqBody) =>{
    const { name, phone, street, city, state, zip, isHomeAddress, isWorkAddress } = reqBody;

    try{
        const addr = new Address({
            name,
            phone,
            city,
            state,
            street,
            type: isHomeAddress == 'on' && 'home' || isWorkAddress == 'on' && 'work'
        })
    }catch(err){

    }
}


module.exports = { getUserAddressById };