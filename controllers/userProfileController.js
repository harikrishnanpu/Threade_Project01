const userProfileService = require("../services/userProfileServices");
const { findOneUserById } = require("../services/userServices");


const renderProfilePage = async (req,res) =>{
    const userId = req.user._id;
    try{
        const user = await findOneUserById(userId);
        res.render('user/profile',{user})
    }catch(err){

    }
}


const renderAdderssBookPage = async (req,res) => {
    const userId = req.user._id;
    try{
        const addresses = await userProfileService.getUserAddressById(userId) || [];
        res.render('user/address-book', { addresses })
    }catch(err){
        res.status(500).json({ message: err.message })
    }
}


const addNewAddress = async (req,res) => {
    const userId = req.user._id;
    try{
        const address = await 
    }catch(err){

    }
}


module.exports = { renderProfilePage, renderAdderssBookPage };