const  puppeteer  = require('puppeteer');
const moment = require('moment');
const Orders = require('../../models/orderModel');
const orderService = require('../../services/userOrderServices');
const paymentService = require('../../services/userPaymentServices');
const coupounModel = require('../../models/coupounModel');

const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body;


    if(paymentMethod && !['cod', 'online','wallet'].includes(paymentMethod)){
     return res.status(400).json({ message: 'payment method is requored', success: false }) 
    }


    if (paymentMethod === 'cod') {
      const order = await orderService.createCodOrder(userId);
      return res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        redirectUrl: `/user/orders/success/${order._id}`
      });
    }

  if (paymentMethod === 'wallet') {
      const order = await orderService.createWalletOrder(userId);
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
    return res.status(500).json({ success: false, message: err.message });
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
    // console.log(err);
    
    return res.status(500).json({ success: false, message: err.message });
  }
};



const renderOrderSuccessPage = async (req,res) => {
  try{
    // console.log(req.params.id);
    
    const order = await orderService.getUserOrderById(req.user._id,req.params.id);

    // console.log(order);
    
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

    // console.log(order);
    
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
// console.log(req.body);

const io = req.app.get('socketio')


    const result = await paymentService.verifyRazorpayPayment(req.body,req.user._id,io);
    if (result.success) {
// console.log("SUCCESS");


      return res.status(200).json(result);

    } else {

      // console.log(result);
      

      return res.status(400).json(result);
    }
  } catch (err) {
    // console.log(err);
    
    return res.status(500).json({ success: false, message: err.message });
  }
};


const renderOrderPyamentSuccessPage = async (req,res) => {
  try{
    // console.log(req.params.id);
    
    const order = await orderService.getUserOrderById(req.user._id,req.params.id);

    // console.log(order);
    
    if(!order){
      throw new Error('order not found')
    }

    res.render('user/order-payment-success',{ order })
  }catch(err){
    next(err)
  }
}




const cancelFullOrder = async (req, res) => {

  try {
    const { cancellationReason, additionalComments = '' } = req.body
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

      const io = req.app.get('socketio')

    const data = await orderService.cancelFullOrder({
      orderId: req.params.orderId,
      userId: req.user._id,
      reason: cancellationReason,
      note: additionalComments
    });


        io.to(`admin:order:${req.params.orderId}`).emit('order:updated', { orderId: req.params.orderId });

    res.status(200).json({ success: true, data });

  } catch (err) {
    // console.log(err);
    
    res.status(500).json({ message: err.message })
  }
  
}


const cancelSingleItem = async (req, res) => {
  try {

    const { itemId, cancellationReason, notes = '' } = req.body

    const io = req.app.get('socketio')

    if (!itemId) return res.status(400).json({ message: 'itemId required' })
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

    const data = await orderService.cancelSingleItem({orderId: req.params.orderId, userId: req.user._id,
      itemId,
      reason: cancellationReason,
      note: notes
    })

        io.to(`admin:order:${req.params.orderId}`).emit('order:updated', { orderId: req.params.orderId });

    res.status(200).json({ success: true, data })
  } catch (err) {
    // console.log(err);

    res.status(500).json({ message: err.message, success: false })
  }
}



const returnFullOrder = async (req, res) => {
  try {
    const { returnReason, returnNote } = req.body
    if (!returnReason || !returnNote) return res.status(400).json({ message: 'returnReason and returnNote required' })

      const io = req.app.get('socketio')

    const data = await orderService.returnFullOrder({
      orderId: req.params.orderId,
      userId: req.user._id,
      reason: returnReason,
      note: returnNote
    })

        io.to(`admin:order:${req.params.orderId}`).emit('order:updated', { orderId: req.params.orderId });

    res.json({ success: true, data })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}


const returnSingleItem = async (req, res) => {

  try {


    const { itemId, returnReason, returnNote } = req.body
    // console.log(itemId);
    
    if (!itemId) return res.status(400).json({ message: 'itemId required' })
    if (!returnReason || !returnNote) return res.status(400).json({ message: 'returnReason and returnNote required' })

      const io = req.app.get('socketio')

    const data = await orderService.returnSingleItem({
      orderId: req.params.orderId,
      userId: req.user._id,
      itemId,
      reason: returnReason,
      note: returnNote
    })

        io.to(`admin:order:${req.params.orderId}`).emit('order:updated', { orderId: req.params.orderId });

    res.json({ success: true, data })
  } catch (err) {
    // console.log(err);
    
    res.status(400).json({ message: err.message })
  }


}


const getOrderPdf = async (req,res) => {

  try{
  const order = await Orders.findOne({ user: req.user?._id , _id: req.params.orderId });

    if(!order){
      throw new Error('order not found')
    }

        res.locals.layout = './layout/invoiceLayout'

     const html = await new Promise((resolve, reject) => {
          res.render('user/order-pdf', {
            order,
            moment,
            generatedDate: moment().format('YYYY-MM-DD'),
            noFooter: true,
            noSidebar: true
          }, (err, html) => {
            if (err) reject(err);
            else resolve(html);
          });
        });
    
    
        const browser = await puppeteer.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    
        const page = await browser.newPage();
        await page.setContent(html, {
          waitUntil: 'networkidle0',
        });
    
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true
        });
    
        await browser.close();
    
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
        res.send(pdfBuffer);

  }catch(err){
    // console.log(err);
    
    res.status(500).json({message: err.message, success: false})

  }

}



const getOrderDeatilsPageContent = async (req, res) => {
  try {

    const userId = req.user._id;
    const orderId = req.params.id;

    const order = await orderService.getUserOrderById(userId, orderId);
    const coupon = await coupounModel.findOne({ code: order?.coupon?.code });

    
    if (!order) {
      throw new Error('order not found');
    }

    // console.log(coupon);
    


    res.status(200).json({ order, coupon: coupon ? coupon : null , success: true});

  } catch (err) {

    // console.log(err);
    res.status(500).json({message: err.message, success: false})

  }
};




module.exports = { placeOrder ,   renderOrderSuccessPage, cancelFullOrder, cancelSingleItem,
  returnFullOrder,
  returnSingleItem,
  renderOrderFailurePage,
  renderOrderPyamentSuccessPage,
  retryOrderPayment,
  verifyRazorpayPayment,
  getOrderPdf,
  getOrderDeatilsPageContent
};
