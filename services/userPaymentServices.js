const Razorpay = require('razorpay');
const orderService = require('./userOrderServices');
const Product = require('../models/productModel');
const Orders = require('../models/orderModel');
const Users = require('../models/userModel');
const crypto = require('crypto');
const UserWallet = require('../models/userWalletModel');
const StockRegistry = require('../models/stockRegsitryModel');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createRazorpayOrder = async (userId) => {
  try {

    const { amount, orderId, orderNumber, customer } = await orderService.prepareOnlineOrder(userId);

 const razorpayOrder = await razorpay.orders.create({
    amount: amount * 100,
    currency: 'INR',
    receipt: orderId.toString(),
    payment_capture: 1
  });

  return {
    orderId: orderId.toString(),
    razorpayOrderId: razorpayOrder.id,
    amount: amount * 100,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID,
    customer
  };

  } catch (err) {
    // console.log(err);
    
    throw new Error(err.message);
  }
};


const orderPayment = async (orderId,userId) => {
  try{


     const order = await Orders.findById(orderId);
     const user = await Users.findById(userId);

     if(!user || user.isBlocked ){
       throw new Error('user nnot found or inactove')
     }

    if (!order || order.paymentStatus !== 'pending') {
      throw new Error('invalid order');
    }

    const razorpayOrder = await razorpay.orders.create({
    amount: order.totalAmount * 100,
    currency: 'INR',
    receipt: orderId.toString(),
    payment_capture: 1
    });

    return {
    orderId: orderId.toString(),
    razorpayOrderId: razorpayOrder.id,
    amount: order.totalAmount * 100,
    currency: 'INR',
    key: process.env.RAZORPAY_KEY_ID,
    customer: {name: user.name, email: user.email, phone: user.phone  }
    }


  }catch(err){


    throw new Error(err.message)
  }
}



const addToWallet = async (amount, userId) => {
  try {

    if (!amount || amount <= 0) {
      throw new Error('invalid amount');
    }

    const user = await Users.findById(userId);

    if (!user || user.isBlocked) {
      throw new Error('user not found or inactive');
    }

    let wallet = await UserWallet.findOne({ user: user._id });


    if (!wallet) {
      wallet = await UserWallet.create({ user: user._id });
    }

    wallet.lastRequestedAmount = amount;

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: wallet._id.toString(),
    });
    
    await wallet.save();

    return {
      walletId: wallet._id,
      razorpayOrderId: razorpayOrder.id,
      amount: amount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };


  } catch (err) {
    console.log(err);
    
    throw new Error(err.message);
  }
};



const verifyWalletPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  walletId,
  userId
}) => {

  try {

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return { success: false, message: 'invalid Razorpay signature' };
    }

    const wallet = await UserWallet.findOne({ _id: walletId , user: userId }).populate('user');

    if (!wallet) {
      return { success: false, message: 'wallet not found' };
    }

    const lastRequestedAmount = wallet.lastRequestedAmount;

    if(lastRequestedAmount > 0){

      wallet.transactions.push({
        type: 'credit',
        amount: wallet.lastRequestedAmount || 0, 
        description: 'wallet top-up via Razorpay',
        reference: razorpay_payment_id,
        createdAt: new Date()
      });
      
      wallet.balance += wallet.lastRequestedAmount || 0;
      
      await wallet.save();
      
    }

    return { success: true, message: 'Wallet updated successfully' };
  } catch (err) {
    console.log(err);
    return { success: false, message: 'Server error' };
  }

};



const verifyRazorpayPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) => {
  try {


    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto.createHmac('sha256', secret).update(body.toString()).digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return { success: false, message: 'Invalid signature' };
    }

    const order = await Orders.findById(orderId);
    if (!order) return { success: false, message: 'order not found' };



       const dbProducts = await Product.find({ _id: { $in: order.items.map(i => i.productId.toString()) } });
    
        for(const item of order.items){
    
          const dbproduct = dbProducts.find( prod => prod._id.equals(item.productId) );
          const matchedVariant = dbproduct.variants.find(v => v.color == item.variant.color && v.size == item.variant.size);
    
          if(matchedVariant){
            const previousStock = matchedVariant.stock;
            if(previousStock - item.quantity >= 0) {
              matchedVariant.stock -= item.quantity;
    
              await StockRegistry.create({
                  productId: dbproduct._id,
                  variant: { size: item.variant.size, color: item.variant.color },
                  productName: dbproduct.name,
                  action: 'stock_out',
                  quantity: item.quantity,
                  previousStock: previousStock,
                  newStock: matchedVariant.stock,
                  reason: 'Order confirmed',
                  updatedBy: 'admin'
                });
    
              await dbproduct.save();
    
            }
          }

          item.status = 'confirmed'
    
        }

    order.orderStatus = 'confirmed';
    order.paymentStatus = 'paid';
    order.paymentId = razorpay_payment_id;
    
    order.timeline.push({
      status: 'paid',
      note: 'Payment successful via Razorpay',
      date: new Date()
    });

    await order.save();

    return { success: true, message: 'Payment verified and order updated' };
  } catch (err) {
    // console.log(err);
    
    throw new Error(err.message);
  }
};

module.exports = { createRazorpayOrder, orderPayment, verifyRazorpayPayment,addToWallet, verifyWalletPayment };
