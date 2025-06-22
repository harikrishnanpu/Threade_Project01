const { getCartItems, getCheckoutSession } = require("../services/userCartService");


const checkCartExists = async (req,res,next) =>{
    try{
        const userId = req.user._id;
        const cart = await getCartItems(userId)
        next();
    }catch(err){
        res.redirect(`/user/cart?=${err.message}`) 
    }
}



const checkIsCheckoutSessionExists = async (req,res,next) =>{
    try{
        const userId = req.user._id;
        const session = await getCheckoutSession(userId)
        next();
    }catch(err){
        res.redirect(`/user/cart/checkout?=${err.message}`)
    }
}


module.exports = { checkCartExists,checkIsCheckoutSessionExists };