const { getCartItems, getCheckoutSession } = require("../services/userCartService");


const checkCartExists = async (req,res,next) => {
    try{
        const userId = req.user._id;
        const cart = await getCartItems(userId)
        if(!cart || cart.items.length <= 0 ){
            return res.redirect('/user/cart?err=cartempty')
        }
        next();
    }catch(err){
        res.redirect(`/user/cart?err=${err.message}`) 
    }
}



const checkIsCheckoutSessionExists = async (req,res,next) =>{
    try{
        const userId = req.user._id;
        const session = await getCheckoutSession(userId);
        next();
    }catch(err){
        res.redirect(`/user/cart/checkout?=${err.message}`)
    }
}


module.exports = { checkCartExists,checkIsCheckoutSessionExists };