const Addresses = require('../../models/addressModel');
const cartModel = require('../../models/cartModel');
const CheckoutSession = require('../../models/checkoutSessionModel');
const coupounModel = require('../../models/coupounModel');
const UserWallet = require('../../models/userWalletModel');
const cartService = require('../../services/userCartService');
const userProductService = require('../../services/userproductServices');
const { findOneUserById } = require('../../services/userServices');



const renderCartPage = async (req,res) =>{
  try{

    const userId = req.user._id;
    const cartItems = await cartService.getCartItems(userId);   
    const cartItemIds = cartItems.items.map(item => item.product);
    const products = await userProductService.getProductByIds(cartItemIds); 
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

const updatedCartItems = cartItems.items.map(item => {
  const matchedProduct = productMap.get(item.product.toString());

  if (!matchedProduct || !matchedProduct.isActive || !matchedProduct.category.isActive || !matchedProduct.brand.isActive) {
    return {
      ...item,
      isActive: false,
      maxCartQuantity: 0,
      price: 0,
      salePrice: 0,
      stock: 0
    };
  }

  const matchedVariant = matchedProduct.variants.find(
    v => v.size === item.variant.size && v.color === item.variant.color 
  );

  return {
    ...item,
    isActive: matchedProduct.isActive && matchedVariant.isActive,
    price: matchedVariant?.price || item.price, 
    salePrice: matchedVariant?.salePrice || 0,
    stock: matchedVariant?.stock || 0,
    maxCartQuantity: matchedProduct.maxCartQuantity || 0
  };

});



    res.render('user/cart', { cartItems: updatedCartItems || [], products })

  }catch(err){
    // console.log(err);
    
    res.render('user/cart', { error: err.message, cartItems: [], products: []})
  }

}


const addToCart = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { variant, quantity } = req.body;
    const userId = req.user._id;

    // console.log("IBUBUJBHBUBHBUHBHUB");
    
  
    const result = await cartService.addToCart(productId,variant,quantity,userId);

    if(result){
        return res.status(200).json({ message: 'Item added to cart', userId: userId });
    }else{
        return res.status(500).json({ message: 'error occured'  })
    }

  } catch (err) {
    return res.status(500).json({ message: err.message});
  }

};

const renderCheckout = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await cartModel.findOne({ userId }).populate('items.product').lean();
    
    // console.log(cart);
    
    const productIds = cart.items.map(item => item.product._id.toString());

    const products = await userProductService.getProductByIds(productIds);

    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart?error=cartisempty'); 
    }

    const activeItems = cart.items.map(item => {

        const product = productMap.get(item.product._id.toString());
        if (!product || !product.isActive) return null;

      
        const variant = product.variants.find(
          v => v.color == item.variant.color && v.size == item.variant.size && v.isActive
        );

        if (!variant || !product.isActive || variant.stock < item.quantity) return null;

        return {
          ...item,
          salePrice: variant?.salePrice || 0,
          stock: variant?.stock ||  0,
          isActive: product.isActive && variant.isActive
        };


      })

    if (activeItems.length <= 0 ) {
      return res.redirect('/user/cart?error=cartempyt')
    }

    const subtotal = activeItems?.reduce((sum, item) =>{
       return sum + item.salePrice * item.quantity
      },0);

    const shippingCost = 100;
    const grandTotal = subtotal + shippingCost;

    const addresses = await Addresses.find({ user: userId , isActive: true }).sort({ createdAt: -1 }).lean().limit(3);


    res.render('user/checkout', {
      cartItems: activeItems,
      addresses,
      subtotal,
      shippingCost,
      grandTotal,
      user: req.user
    });

  } catch (err) {
    // console.log(err);
    
    res.redirect(`/user/cart?error=${err.message}`)
    // res.status(500).json({ message: err.message });
  }
};




const verifyAndRedirectCheckout = async (req, res) => {
  
  try {
    const userId = req.user._id;

    const cart = await cartModel.findOne({ userId }).populate('items.product');
    const cartItems = cart.items.map(item => item);
    const cartItemIds = cartItems.map(item => item.product._id);
    const products = await userProductService.getProductByIds(cartItemIds);

    const productsMap = new Map(products.map(item => [item._id.toString(), item]));
    
    // console.log(productsMap);
    

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'your cart is empty.' });
    }

    

for (const item of cartItems) {
  const product = productsMap.get(item.product._id.toString());

  if (!product) {
    return res.status(400).json({ message: 'Product no longer exists.', item: { ...item.toObject(), _id: product._id.toString() } });
  }

  const variantMatch = product.variants.find(v =>
    v.color == item.variant.color && v.size == item.variant.size && v.isActive
  );

  // console.log("VARIANTKJNJHBHJB",variantMatch);
  

  if (!variantMatch || !product.isActive) {
    return res.status(400).json({ message: 'this variant is not available.', item: { ...item.toObject(), _id: product._id.toString() } });
  }

  if (item.quantity > variantMatch.stock) {
    return res.status(400).json({
      message: `Only ${variantMatch.stock} in stock for this variant.`,
    item: { ...item.toObject(), _id: product._id.toString() }
    });
  }

  if (item.quantity > product.maxCartQuantity) {
    return res.status(400).json({
      message: `Only ${product.maxCartQuantity} can be added to cart for this product.`,
     item: { ...item.toObject(), _id: product._id.toString() }
    });
  }

}


    return res.status(200).json({ redirectUrl: '/user/cart/checkout' });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

};



const renderPaymentPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await CheckoutSession.findOne({ userId });
    if (!session) {
      return res.redirect('/user/cart/checkout?error=nosession');
    }

    const cart = await cartModel.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart'); 
    }

    // console.log(cart);
    

    const orderItems = cart.items.map(item => {
      const product = item.product.variants.find(v => v.size == item.variant.size && v.color == item.variant.color  );
      const price = product.salePrice;
      return {
        name: item.name,
        image: item.image,
        variant: item.variant,
        quantity: item.quantity,
        price
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const shippingCost = session.shippingMethod === 'express'
      ? 100
      : session.shippingMethod === 'regular'
      ? 50
      : 0;

const coupon = await coupounModel.findOne({ 
  code: session.couponCode, 
  isActive: true 
});

let discount = 0;

if (coupon) {

  const notExpired = !coupon.expiresAt || coupon.expiresAt >=  new Date();;
  const minAmount = subtotal >= (coupon.minOrderAmount || 0);
  const notOver = coupon.maxUsage > coupon.usedCount;

  if (notExpired && minAmount && notOver) {
    const calculatedDiscount = (subtotal * coupon.discount) / 100;
    discount = Math.min(calculatedDiscount, coupon.maxDiscount);
  }

}


const grandTotal = subtotal + shippingCost - discount;

const wallet = await UserWallet.findOne({ user: userId  });

res.render('user/payment', {
  orderItems,
  subtotal,
  discount,
  shippingCost,
  grandTotal,
  appliedCoupon: {...coupon?.toObject() , appliedDiscount: discount || 0} || null,
  walletBalance:  wallet?.balance  || 0
});


  } catch (err) {
    // console.log(err);
    
    res.status(500).json({message: err.message});
  }
};



const getCartCount = async (req,res) => {
    const userId = req.user._id;
    try{
        const count = await cartService.getCartCount(userId);
        res.status(200).json({count})
    }catch(err){
        res.status(500).json({message: err.message})
    }
}

const getCheckoutSession = async (req,res) => {
    const userId = req.user._id;
    try{
        const session = await cartService.getCheckoutSession(userId);
        // console.log(session);
        res.status(200).json({session, success:true})
    }catch(err){
        res.status(500).json({message: err.message, success:false})
    }
}


const updateCart = async (req, res) => {
  const {id: itemId } = req.params;
  const { quantity, variant } = req.body;
  const userId = req.user._id;

  // console.log("TEST ");
  

  try {
    const result = await cartService.updateCart(userId,itemId, variant, quantity);


    if(result.isNotActive){
      // console.log("1");
      
  return res.status(400).json({
    success:false,
    code:'UNAVAILABLE',
  });
    }else if(result.outOfStock){
      // console.log("2");

  return res.status(400).json({
    success:false,
    code:'OUT_OF_STOCK',
    stock: result.stock
  });
    }else if(result.maxCartCount){
      // console.log("3");

  return res.status(400).json({
    success:false,
    code:'MAX_LIMIT',
    limit: result.limit,
  });
    }
     
    
    res.status(200).json({message: 'cart updated successfully', success: true, stock: result.stock, isActive: true});
    

  } catch (err) {

    // console.log(err);
    res.status(500).json({ message: err.message, success: false });
  }

};


const applyCoupon = async (req, res) => {
  try {
    const userId = req.user._id;
    const { code, subTotal } = req.body;

    // console.log(req.body);

    if (!code || !userId || !subTotal) {
      return res.status(400).json({ success: false, message: 'all fields required' });
    }

    const user = await findOneUserById(userId);

    let userType = 'all';

    // if (user.isPremium) {
    //   userType = 'premiumUsers';
    // } else if (user.createdAt && (Date.now() - new Date(user.createdAt)) < 1000 * 60 * 60 * 24 * 7) {
    //   userType = 'newUsers'; 
    // }

    const result = await cartService.applyCoupon(code.trim(), userId, subTotal, userType);

    res.status(200).json({
      success: true,
      message: 'coupon applied successfully',
      data: result
    });


  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};



const getAllCouponsAvailable = async (req, res) => {
  try {
    const userId = req.user?._id;

    const coupons = await coupounModel.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).lean();

    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCheckoutSession = async (req, res) => {

  try {
    const userId = req.user._id; 
    const { addressId, shippingMethod, couponCode } = req.body;

    // console.log(req.body);
    

    if (!addressId || !shippingMethod) {
      return res.status(400).json({ success: false, message: 'Address and shipping method are required.' });
    }

    const session = await cartService.saveCheckoutSession(userId, { addressId, shippingMethod, couponCode });
    
    return res.status(200).json({
      success: true,
      message: 'Checkout session saved successfully.',
      redirectUrl: '/user/cart/payment'
    });

  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Failed to create checkout session.'
    });
  }
};


module.exports = {addToCart, getCartCount, renderCartPage, renderCheckout, updateCart, verifyAndRedirectCheckout, applyCoupon, createCheckoutSession, renderPaymentPage, getCheckoutSession, getAllCouponsAvailable};

