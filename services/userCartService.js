const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require('../models/coupounModel');
const Addresses = require("../models/addressModel");
const CheckoutSession = require('../models/checkoutSessionModel');
const Wishlist = require("../models/wishListModel");



const addToCart = async (productId, variant, quantity , userId) => {

  quantity = parseInt(quantity, 10);

if (isNaN(quantity) || quantity <= 0) {
  throw new Error('Invalid quantity');
}


// console.log("QUANTITY:   ",quantity);



    try{

     const product = await Product.findById(productId);


    if (!product || !product.isActive){
       throw new Error('product not found or inactive')
    }

    const variantMatch = product.variants.find(
      v => v.size === variant.size && v.color === variant.color && v.isActive == true
    );

    if (!variantMatch){
      throw new Error('variant not found or inactive')
    }

    let cart = await Cart.findOne({ userId: userId });

    if (!cart){
        cart = new Cart({ userId: userId, items: [] });
    }

    const existingCartItem = cart.items.findIndex((item) =>
      item.product.toString() === productId &&
      item.variant.size === variant.size &&
      item.variant.color === variant.color
    );

const existingCartItemQty = existingCartItem !== -1 ? cart.items[existingCartItem].quantity : 0;

    // console.log("EXISTING CART ITEM QTY:", existingCartItemQty);

    
    if((existingCartItemQty + quantity) > variantMatch.stock){
      throw new Error('out of stock');
    }

    // console.log("MAXCARTQUANTITY",product.maxCartQuantity);
    
    if(existingCartItemQty + quantity > product.maxCartQuantity){
      // console.log("FHBJHDBJF HJV FJHHB VHJF HBXHJBCHJBHJCBHJSBCVHJBFSHJVBHJFHBVJH FHJVBHJFBVJHB FHJ");
      throw new Error('max cart count for the product exceeds')
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


    const wishlist = await Wishlist.findOne({ user: userId })
    // console.log("Wishlist Found",wishlist);

 if (wishlist) {
  wishlist.items = wishlist.items.filter(
    (itm) => itm.product?.toString() !== product._id.toString()
  );

  await wishlist.save();
}
    

    await cart.save();

    return true;

}catch(err){
    throw new Error(err.message);
}
}


const getCartCount = async (userId) => {

  // console.log(userId);
  
  
  try {
    const cart = await Cart.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if(cart){
      // console.log(cart);
      return cart ? cart.items.length : 0; 
    }else{
      return 0;
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


const updateCart = async (userId, itemId, variant, quantity) => {
  quantity = parseInt(quantity, 10);

  if (isNaN(quantity)) {
    throw new Error('Invalid quantity');
  }

  try {
    const cart = await Cart.findOne({ userId });
    const item = await Product.findById(itemId);

    if (!cart) {
      throw new Error('cart not found');
    }


        // console.log(quantity);


    const cartItemIndex = cart.items.findIndex(item =>
      item.product.toString() === itemId && item.variant.color === variant.color && item.variant.size === variant.size
    );
    
    if (cartItemIndex === -1) {
      return {isNotActive: true }
    }



        if(quantity === 0){
          cart.items.splice(cartItemIndex, 1); 
          return await cart.save()
        }

    if(!item || !item.isActive){
      return {isNotActive: true};
    }


    const cartItem = cart.items[cartItemIndex];


    const variantMatch = item.variants.find(
      v => v.size === cartItem.variant.size && v.color === cartItem.variant.color && v.isActive == true
    );


    if(!variantMatch){
       return {isNotActive: true }
    }



    


    if (quantity === 0) {
      
      cart.items.splice(cartItemIndex, 1); 
    } else {

    // console.log("MAXCARTQUANTITY", item.maxCartQuantity);
    
    if(quantity > item.maxCartQuantity){
       return {maxCartCount: true, limit: item.maxCartQuantity }
    }

      if(variantMatch.stock < quantity){
        return { outOfStock: true, stock: variantMatch.stock}
      }

      cartItem.quantity = quantity; 
    }

    await cart.save();

    // console.log(variantMatch);
    

    const result = { stock: variantMatch.stock, isNotActive:false }

    return result;
  } catch (err) {
    // console.log(err);
    
    throw new Error(err.message);
  }

};



const applyCoupon = async (code, userId, cartTotal, userType) => {

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) throw new Error('coupon not found');
    if (!coupon.isActive) throw new Error('coupon is not active');


    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      throw new Error('coupon has expired');
    }

    if (coupon.usedCount >= coupon.maxUsage) {
      throw new Error('coupon usage limit reached');
    }

    if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
      throw new Error(`minimum order amount is ₹${coupon.minOrderAmount}`);
    }
    
    if (coupon.onlyFor !== 'all' && coupon.onlyFor !== userType) {
      throw new Error(`coupon is not valid for user`);
    
    }
    

    if(coupon.usedBy.includes(userId)){
      throw new Error('coupon is already applied by user')
    }

    const discount = (coupon.discount / 100) * cartTotal;
    const finalDiscount = Math.min(discount, coupon.maxDiscount);

    return {
      couponCode: coupon.code,
      discount: finalDiscount,
      maxDiscount: coupon.maxDiscount
    };

  } catch (error) {
    throw new Error(error.message);
  }

};


const saveCheckoutSession = async (userId, { addressId, shippingMethod, couponCode, shippingCharge }) => {
  try {

    const address = await Addresses.findOne({ _id: addressId, user: userId });
    if (!address) throw new Error('invalid delivery address');

    const validMethods = ['free', 'regular', 'express'];
    if (!validMethods.includes(shippingMethod)) {
      throw new Error('invalid shipping method');
    }

    let validCoupon = null;
    if (couponCode) {
      validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (!validCoupon) throw new Error('Invalid or expired coupon code.');
    }

    let verifiedShippingCharge = 100;
    if(shippingMethod && shippingCharge){
      
    }

    const session = await CheckoutSession.findOneAndUpdate(
      { userId },
      {
        userId,
        addressId,
        shippingMethod,
        couponCode: couponCode || null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return session;
  } catch (err) {
    throw new Error(err.message || 'faileed to save checkout session');
  }
};

const getCheckoutSession = async (userId) =>{
  try{
    const session = await CheckoutSession.findOne({ userId });
    if(!session){
      throw new Error('caanot find checkout session for user')
    }
    return session;
  }catch(err){
    throw new Error(err.message)
  }
}



module.exports = {addToCart, getCartCount, getCartItems, updateCart, applyCoupon, saveCheckoutSession, getCheckoutSession};