const orderService = require('../../services/userOrderServices');
const paymentService = require('../../services/userPaymentServices');

const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body;

    if (paymentMethod === 'cod') {
      const order = await orderService.createCodOrder(userId);
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        redirectUrl: `/user/orders/success/${order._id}`
      });
    }

if (paymentMethod === 'online') {
  const razorpayOrder = await paymentService.createRazorpayOrder(userId);
  return res.status(200).json({
    success: true,
    razorpay: razorpayOrder,
    customer: razorpayOrder.customer
  });
}

    return res.status(400).json({ success: false, message: 'Invalid payment method' });
    
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};


const retryOrderPayment = async (req, res) => {
  try {

    const { orderId } = req.params;

    const razorpayOrder = await paymentService.orderPayment(orderId,req.user?._id);

  return res.status(200).json({
    success: true,
    razorpay: razorpayOrder,
    customer: razorpayOrder.customer
  });


  } catch (err) {
    console.log(err);
    
    return res.status(500).json({ success: false, message: err.message });
  }
};



const renderOrderSuccessPage = async (req,res) => {
  try{
    // console.log(req.params.id);
    
    const order = await orderService.getUserOrderById(req.user._id,req.params.id);

    console.log(order);
    
    if(!order){
      throw new Error('order not found')
    }

    res.render('user/order-success',{ order, isSubheaderHidden: true })
  }catch(err){
    res.status(500).json({message: err.message})
  }
}




const renderOrderFailurePage = async (req,res) => {
  try{
    // console.log(req.params.id);
    
    const order = await orderService.getUserOrderById(req.user._id,req.params.id);

    console.log(order);
    
    if(!order){
      throw new Error('order not found')
    }

    res.render('user/order-payment-failure',{ order })
  }catch(err){
    res.status(500).json({message: err.message})
  }
}


const verifyRazorpayPayment = async (req, res) => {
  try {
console.log(req.body);


    const result = await paymentService.verifyRazorpayPayment(req.body);
    if (result.success) {
console.log("SUCCESS");


      return res.status(200).json(result);

    } else {

      return res.status(400).json(result);
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


const renderOrderPyamentSuccessPage = async (req,res) => {
  try{
    // console.log(req.params.id);
    
    const order = await orderService.getUserOrderById(req.user._id,req.params.id);

    console.log(order);
    
    if(!order){
      throw new Error('order not found')
    }

    res.render('user/order-payment-success',{ order })
  }catch(err){
    res.status(500).json({message: err.message})
  }
}




const cancelFullOrder = async (req, res) => {
  try {
    const { cancellationReason, additionalComments = '' } = req.body
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

    const data = await orderService.cancelFullOrder({
      orderId: req.params.orderId,
      userId: req.user._id,
      reason: cancellationReason,
      note: additionalComments
    })
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}


const cancelSingleItem = async (req, res) => {
  try {

    const { itemId, cancellationReason, notes = '' } = req.body


    if (!itemId) return res.status(400).json({ message: 'itemId required' })
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

    const data = await orderService.cancelSingleItem({orderId: req.params.orderId, userId: req.user._id,
      itemId,
      reason: cancellationReason,
      note: notes
    })

    res.status(200).json({ success: true, data })
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: err.message, success: false })
  }
}



const returnFullOrder = async (req, res) => {
  try {
    const { returnReason, returnNote } = req.body
    if (!returnReason || !returnNote) return res.status(400).json({ message: 'returnReason and returnNote required' })

    const data = await orderService.returnFullOrder({
      orderId: req.params.orderId,
      userId: req.user._id,
      reason: returnReason,
      note: returnNote
    })
    res.json({ success: true, data })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}


const returnSingleItem = async (req, res) => {

  try {


    const { itemId, returnReason, returnNote } = req.body
    console.log(itemId);
    
    if (!itemId) return res.status(400).json({ message: 'itemId required' })
    if (!returnReason || !returnNote) return res.status(400).json({ message: 'returnReason and returnNote required' })

    const data = await orderService.returnSingleItem({
      orderId: req.params.orderId,
      userId: req.user._id,
      itemId,
      reason: returnReason,
      note: returnNote
    })
    res.json({ success: true, data })
  } catch (err) {
    console.log(err);
    
    res.status(400).json({ message: err.message })
  }


}




module.exports = { placeOrder ,   renderOrderSuccessPage, cancelFullOrder, cancelSingleItem,
  returnFullOrder,
  returnSingleItem,
  renderOrderFailurePage,
  renderOrderPyamentSuccessPage,
  retryOrderPayment,
  verifyRazorpayPayment
};
