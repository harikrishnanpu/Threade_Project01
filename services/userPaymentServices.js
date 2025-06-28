const Razorpay = require('razorpay');
const orderService = require('./userOrderServices');
const Orders = require('../models/orderModel');
const Users = require('../models/userModel');
const crypto = require('crypto');

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
    console.log(err);
    
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
    console.log(err);
    
    throw new Error(err.message);
  }
};

module.exports = { createRazorpayOrder, orderPayment, verifyRazorpayPayment };
