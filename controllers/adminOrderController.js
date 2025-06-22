const Orders = require('../models/orderModel');
const orderService = require('../services/adminOrderServices');

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
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).render('admin/orders/all-orders', {
      orders: [],
      totalOrders: 0,
      totalRevenue: 0,
      totalPages: 1,
      currentPage: 1,
      error: 'Failed to fetch orders. Please try again later.',
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status' });
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
    console.log(req.body);
    
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
        update: { $set: { orderStatus: newStatus } }
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

    console.log(req.body);
    

    const result = await orderService.updateReturnReuqestAction(orderId, {
      itemIndex: parseInt(itemIndex),
      actionType,
      notes,
      pickupDate
    });

    if (!result.success) {
      return res.json({ success: false, message: result.message });
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
};







const exportSingleOrder = async (req, res) => {
  try {
    const { csv, json } = await orderService.exportSingleOrder(req.params.orderId);
    res.header('Content-Type', 'text/csv');
    res.attachment(`order-${req.params.orderId}.csv`);
    return res.send(csv || '');
  } catch (err) {
    console.error('exportSingleOrder →', err);
    return res.status(500).send('Export failed');
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
  exportSingleOrder
};
