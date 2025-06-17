const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");



const addToCart = async (productId, variant, quantity , userId) => {

  quantity = parseInt(quantity, 10);

if (isNaN(quantity) || quantity <= 0) {
  throw new Error('Invalid quantity');
}


    try{

     const product = await Product.findById(productId);


    if (!product || !product.isActive){
       throw new Error('product not found or inactive')
    }

    const variantMatch = product.variants.find(
      v => v.size === variant.size && v.color === variant.color
    );

    if (!variantMatch){
      throw new Error('variant not found')
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart){
        cart = new Cart({ userId: userId, items: [] });
    }

    const existingCartItem = cart.items.findIndex(item =>
      item.product.toString() === productId &&
      item.variant.size === variant.size &&
      item.variant.color === variant.color
    );

    const existingCartItemQty = existingCartItem !== -1 ? existingCartItem.quantity : 0;

    
    if((existingCartItemQty + quantity) > variantMatch.stock){
      throw new Error('out of stock');
    }

    const itemData = {
      product: product._id,
      variant: { size: variant.size, color: variant.color },
      quantity,
      price: variantMatch.price,
      salePrice: variantMatch.salePrice,
      image: variantMatch.images?.[0] || product.images?.[0],
      name: product.name
    };

    if (existingCartItem !== -1) {
      cart.items[existingCartItem].quantity += quantity;
    } else {
      cart.items.push(itemData);
    }

    await cart.save();

    return true;

}catch(err){
    throw new Error(err.message);
}
}


const getCartCount = async (userId) => {

  console.log(userId);
  
  
  try {
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if(cart){
      console.log(cart);
      return cart ? cart.items.length : 0; 
    }else{
      throw new Error('cart not found')
    }
  } catch (err) {
    throw new Error(err.message);
  }
};



const getCartItems = async (userId) =>{
  try{
    const items = await Cart.findOne({ userId }).lean();
    if(!items){
      throw new Error('cart not found for user')
    }
    return items
  }catch(err){
        throw new Error(err.message)
  }
}


module.exports = {addToCart, getCartCount, getCartItems};