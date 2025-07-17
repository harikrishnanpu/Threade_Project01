const puppeteer = require('puppeteer');
const Orders = require('../../models/orderModel');
const orderService = require('../../services/adminOrderServices');
const moment = require('moment');

const getAllOrders = async (req, res) => {
  try {
    const { orders, totalOrders, totalRevenue, totalPages, currentPage, filters } =
    
    
    await orderService.fetchAllOrders(req);

    res.render('admin/allOrders', {
      orders,
      totalOrders,
      totalRevenue,
      totalPages,
      currentPage,
      ...filters,
    });


  } catch (err) {

    console.log('ORDERS:', err);

    res.status(500).render('admin/orders/all-orders', {
      orders: [],
      totalOrders: 0,
      totalRevenue: 0,
      totalPages: 1,
      currentPage: 1,
      error: err.message,
    });

  }
};


const getAllOrdersFilteredList = async (req, res) => {
  try {
    const { orders, totalOrders, totalRevenue, totalPages, currentPage, filters } =
    
    
    await orderService.fetchAllOrders(req);

    res.status(200).json({
      orders,
      totalOrders,
      totalRevenue,
      totalPages,
      currentPage,
      ...filters,
      success: true
    });


  } catch (err) {

    res.status(500).json({
      orders: [],
      totalOrders: 0,
      totalRevenue: 0,
      totalPages: 1,
      currentPage: 1,
      error: err.message,
      success: false
    });

  }
};

const getOneOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};



const updateOrderStatus = async (req, res) => {
  try {
    const result = await orderService.updateOrderStatus(req.body);
    res.status(200).json(result);


  } catch (err) {

    // console.log(err);
    
    res.status(500).json({ success: false, message: err.message });
  }
};



const renderOrderDetail = async (req, res) => {
  try {
    const order = await orderService.getOrderDetail(req.params.orderId);
    if (!order) throw new Error('order not found')
    return res.render('admin/order-detail', { order });
  } catch (err) {
    // console.log('ORDER ERROR ', err);
    return res.status(500).render('errors/500');
  }
};


const updateFullOrder = async (req, res) => {
  try {
    const result = await orderService.saveOrderEdits(req.body);    
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};


const orderDetailsStatusUpdate = async (req, res) => {
  try {
    const {orderId} = req.params
    // console.log(req.body);
    const result = await orderService.quickStatusUpdate(orderId,req.body);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};



const bulkUpdateOrders = async (req, res) => {
  try {
    const { orderIds, action } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error('No orders selected');
    }

    const statusMap = {
      confirm: 'confirmed',
      ship: 'shipped',
      deliver: 'delivered',
      cancel: 'cancelled'
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      throw new Error('Invalid bulk action');
    }

const operations = orderIds.map(orderId => ({
  updateOne: {
    filter: { _id: orderId },
    update: {
      $set: {
        orderStatus: newStatus,
        'items.$[elem].status': newStatus
      }
    },
    arrayFilters: [
      {
        'elem.status': { $nin: ['cancelled', 'delivered'] },
        'elem.status': { $not: { $regex: '^return' } } // starts with retur
      }
    ]
  }
}));


    // console.log(operations);
    

    await Orders.bulkWrite(operations);

    res.status(200).json({ success: true, message: 'Orders updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



const returnRequestAction = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { itemIndex, actionType, notes, pickupDate } = req.body;

    // console.log(req.body);
    

    const result = await orderService.updateReturnReuqestAction(orderId, {
      itemIndex: parseInt(itemIndex),
      actionType,
      notes,
      pickupDate
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    res.status(200).json({ success: true, data: result.data });
  } catch (err) {

    // console.log(err);
    
    res.status(500).json({ success: false, message: err.message });
  }
};







const renderInvoice = async (req, res) => {
  try {
    const order = await orderService.getOrderDetail(req.params.orderId);
    if (!order) return res.status(404).render('errors/404');
    return res.render('admin/invoice', { order });
  } catch (err) {
    console.error(' renderInvoice →', err);
    return res.status(500).render('errors/500');
  }
};


const getOrderPdf = async (req,res) =>{ 

  try{
    const order = await Orders.findOne({ _id: req.params.orderId });
  
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
      console.log(err);
      
      res.status(500).json({message: err.message, success: false})
  
    }

}

module.exports = {
  getAllOrders,
  getOneOrder,
  updateOrderStatus,
  renderOrderDetail,
  updateFullOrder,
  orderDetailsStatusUpdate,
  bulkUpdateOrders,
  returnRequestAction,
  renderInvoice,
  getOrderPdf,
  getAllOrdersFilteredList
};
