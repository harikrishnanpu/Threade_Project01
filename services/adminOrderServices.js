const Order = require('../models/orderModel');

const fetchAllOrders = async (req) => {
  try {

    const {
      page = 1,
      status = 'all',
      paymentFilter = 'all',
      dateRange = 'all',
      amountRange = 'all',
      sortField = 'createdAt',
      sortOrder = 'desc',
      search = '',
    } = req.query;

    const limit = 10;
    const skip = (page - 1) * limit;
    const sort = { [sortField] : sortOrder === 'asc' ? 1 : -1 };
    const filters = {};

    if (status !== 'all') filters.orderStatus = status;
    if (paymentFilter !== 'all') filters.paymentMethod = paymentFilter;

    if (dateRange !== 'all') { // date filtering 
      const now = new Date();
      const start = new Date();
      if (dateRange === 'today') start.setHours(0, 0, 0, 0);
      if (dateRange === 'week') start.setDate(now.getDate() - 7);
      if (dateRange === 'month') start.setMonth(now.getMonth() - 1);
      if (dateRange === 'quarter') start.setMonth(now.getMonth() - 3);
      filters.createdAt = { $gte: start, $lte: now };
    }

    if (amountRange !== 'all') {
      const [min, max] = amountRange.split('-');
      filters.totalAmount = {
         $gte: parseInt(min),
         $lte: parseInt(max),
      };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { orderNumber: regex },
        { 'userId.name': regex },
        { 'userId.email': regex },
        { 'shippingAddress.city': regex },
      ];
    }

    const ordersQuery = Order.find(filters)
      .populate('user', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const [orders, totalOrders, revenue] = await Promise.all([
      ordersQuery.lean(),
      Order.countDocuments(filters),
      Order.aggregate([
        { $match: filters },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalRevenue = revenue.length > 0 ? revenue[0].revenue : 0;
    const totalPages = Math.ceil(totalOrders / limit);

    return {
      orders,
      totalOrders,
      totalRevenue,
      totalPages,
      currentPage: parseInt(page),
      filters: {
        status,
        paymentFilter,
        dateRange,
        amountRange,
        sortField,
        sortOrder,
        search,
      },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

const getOrderById = async (orderId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .lean();
    return order;
  } catch (err) {
    throw new Error(err.message);
  }
};



const updateOrderStatus = async (data) => {
  try {
    const { orderId, status, trackingNumber, notes } = data;

const now = new Date();
const update = {
  $set: {
    orderStatus:   status,
    adminNotes:    notes,
    'items.$[].status': status               // update status for every item
  },
  $push: {                         
    timeline: {
      status : status,
      date   : now,
     note   : notes || `Status changed to ${status}`
    }
  }
};

if (status === 'shipped' && trackingNumber) {
  update.$set.trackingNumber = trackingNumber;
}

const order = await Order.findByIdAndUpdate(orderId, update, { new: true });


    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return { success: true, message: 'Order status updated successfully', data: order };
  } catch (err) {
    throw new Error(err.message);
  }
};



const getOrderDetail = async (orderId) => {
  try {
    return await Order.findById(orderId)
      .populate('user', 'name email')
      .populate('items.productId');
  } catch (err) {
    console.error('getOrderDetail', err);
    throw err;
  }
};



const saveOrderEdits = async (payload) => {
  try {
    const {
      orderId,
      orderStatus,
      trackingNumber,
      adminNotes,
      paymentStatus,
      isUrgent,              
      shippingAddress,
      items = [],         // status included with removed if 
    } = payload;



    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    if (orderStatus)  order.orderStatus   = orderStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (adminNotes)   order.adminNotes = adminNotes;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    
    order.isUrgent = !!isUrgent;


    if (shippingAddress) {
      order.shippingAddress = { ...order.shippingAddress, ...shippingAddress };
    }

    items.forEach(({ index, quantity, price, status }) => {
      const itm = order.items[index];
      if (!itm) return;
      if (status) itm.status = status;
      if(status && status == 'pending') itm.isCancelled = false
      if(status && status == 'return-complete') itm.isCancelled = false
      if(status && status == 'cancelled') itm.isCancelled = true
    });

    order.subtotal = order.items.reduce((sum, i) => (sum + i.quantity * i.price ),0);
    const discount = order.coupon?.discountAmount || 0;
    order.totalAmount = order.subtotal - discount;

    const itemStatuses = order.items.map(i => i.status);
    if (itemStatuses.every(s => s === 'return-complete'))    order.orderStatus = 'return-complete';
    else if (itemStatuses.some(s => s === 'return-complete')) order.orderStatus = 'partial-return';
    else if (itemStatuses.every(s => s === 'shipped')) order.orderStatus = 'shipped';
    else if (itemStatuses.every(s => s === 'confirmed')) order.orderStatus = 'confirmed';
    else if (itemStatuses.every(s => s === 'pending')) order.orderStatus = 'pending';
    else if (itemStatuses.every(s => s === 'delivered')) order.orderStatus = 'delivered';
    else if (itemStatuses.every(s => s === 'cancelled')) order.orderStatus = 'cancelled';



    await order.save();
    return { success: true, data: order.toObject(), message: 'successfully editted' }; 
  } catch (err) {
    throw new Error(err.message);
  }
};



const quickStatusUpdate = async (orderId,{
  newStatus,
  trackingNumber,
  reason,
  notes,
}) => {
  try {

    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return-complete'];
    if (!allowed.includes(newStatus))
      return { success: false, message: 'Invalid status' };
    
    const now = new Date();
    const update = {
      $set:{
        orderStatus: newStatus,
        'items.$[elem].status' : newStatus,
      },
      $push: {                         
        timeline: {
          status : newStatus,
          date   : now,
          note   : notes || `Status changed to ${newStatus}`
        }
      }
    };

    if (trackingNumber) update.$set.trackingNumber  = trackingNumber; //shipping track no. MODEL NAME changed
    if (reason && newStatus === 'cancelled'){
      update.$set.cancelledBy = 'admin';
      update.$set.cancelledAt = new Date();
      update.$set.cancellationReason = reason;
    }
    if (reason && newStatus === 'return-complete'){
      update.$set.returnReason = reason;
    }


    if (notes) update.$set.adminNotes = notes;

    const order = await Order.findByIdAndUpdate(orderId, update, {        arrayFilters: [{ 'elem.status': { $nin: ['cancelled', 'pending'] } }]});

    if (!order) return { success: false, message: 'Order not found' };

    return { success: true, data: order };
  } catch (err) {
    throw new Error(err.message);
  }
};


const updateReturnReuqestAction = async (orderId, { itemIndex, actionType, notes, pickupDate }) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const item = order.items[itemIndex];
    if (!item) return { success: false, message: 'Invalid item index' };

    const validStatuses = [
  'return-requested',
  'return-processing',
  'return-pickup',
  'return-complete',
  'return-rejected'
];

    if (!validStatuses.includes(item.status)) {
      return { success: false, message: 'invalid status code' };
    }

    
if (actionType === 'accept') {
      item.status = 'return-pickup';
      item.returnApprovedAt = new Date();
      item.returnNote = notes || '';
      item.pickupScheduledAt = new Date();
      item.pickupDate = pickupDate ? new Date(pickupDate) : null;
      order.timeline.push({
        status: 'return-pickup',
        note: `return pickup for item ${item.productName} scheduled` + `${notes ? ' remark:'+notes : ''}`
      })
    } else if (actionType === 'process') {
      item.status = 'return-processing';
      order.timeline.push({
        status: 'return-processing',
        note: `return processing started for item ${item.productName}` + `${notes ? ' remark:'+notes : ''}`
      })
    } else if (actionType === 'complete') {
      item.status = 'return-complete';
      item.returnCompletedAt = new Date();
      item.returnNote = notes || '';
      order.timeline.push({
        status: 'return-complete',
        note: `return completed for item ${item.productName}` + `${notes ? ' remark:'+notes : ''}`
      })
    } else if (actionType === 'reject') {
      item.status = 'return-rejected';
      item.returnRejectedAt = new Date();
      item.returnNote = notes || '';
      order.timeline.push({
        status: 'return-rejected',
        note: `return rejected for item ${item.productName}` + `${notes ? ' remark:'+notes : ''}`
      })
    }

    const itemStatuses = order.items.map(i => i.status);
    if (itemStatuses.every(s => s === 'return-complete')) {
      order.orderStatus = 'return-complete';
    } else if (itemStatuses.some(s => s === 'return-complete')) {
      order.orderStatus = 'partial-return';
    }

    if (notes) item.returnNote = notes;

    await order.save();
    return { success: true, data: order };
  } catch (err) {
    return { success: false, message: err.message };
  }
};










const exportSingleOrder = async (orderId) => {
  try {
    const order = await getOrderDetail(orderId);
    if (!order) throw new Error('Order not found');

    const json = order.toObject({ depopulate: true });
    const csv  = new Parser().parse(json);

    return { csv, json };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  fetchAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderDetail,
  saveOrderEdits,
  quickStatusUpdate,
  updateReturnReuqestAction,
  exportSingleOrder
};
