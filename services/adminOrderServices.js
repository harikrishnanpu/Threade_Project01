const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const StockRegistry = require('../models/stockRegsitryModel');
const UserWallet = require('../models/userWalletModel');

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

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.orderStatus = status;
    order.adminNotes = notes;

    order.items = order.items.map(item => {
      if (!item.isCancelled && !item.status.includes('return')) {
        return { ...item.toObject(), status };
      }
      return item;
    });



    if (status === 'shipped' && trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    order.timeline.push({
      status,
      date: now,
      note: notes || `Status changed to ${status}`
    });

    await order.save();

if (status === 'confirmed') {
      for (const item of order.items) {
        if (item.isCancelled || item.status.includes('return')) continue;

        const product = await Product.findById(item.productId);
        
        if (!product || !product.isActive) continue;

        const variant = product.variants.find(v =>  v.size == item.variant.size && v.color == item.variant.color );

        if (!variant || !variant.isActive) continue;
        const previousStock = variant.stock;

        const newStock = previousStock - item.quantity;
        if (newStock < 0) continue;

        variant.stock = newStock;
        await product.save();

        await StockRegistry.create({
          productId: product._id,
          variant: { color: item.color , size: item.size  },
          productName: product.name,
          action: 'stock_out',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: 'Order confirmed',
          updatedBy: 'admin'
        });
      }
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



const saveOrderEdits = async (data) => {


  try {
    const {
      orderId,
      orderStatus,
      trackingNumber,
      adminNotes,
      paymentStatus,
      isUrgent,              
      shippingAddress,
      items = [],   
    } = data;



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
    else if (itemStatuses.every(s => s === 'shipped')) order.orderStatus ='shipped';
    else if (itemStatuses.every(s => s === 'confirmed')) order.orderStatus =    'confirmed';
    else if (itemStatuses.every(s => s === 'pending')) order.orderStatus = 'pending';
  
    else if (itemStatuses.every(s => s === 'delivered')) order.orderStatus = 'delivered';
    else if (itemStatuses.every(s => s === 'cancelled')) order.orderStatus = 'cancelled';



    await order.save();
    return { success: true, data: order.toObject(), message: 'successfully editted' }; 
  } catch (err) {
    throw new Error(err.message);
  }
};



const quickStatusUpdate = async (orderId, {
  newStatus,
  trackingNumber,
  reason,
  notes,
  updatedBy = 'admin'
}) => {
  try {



    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'return-complete'];
    if (!allowed.includes(newStatus)) {
      return { success: false, message: 'Invalid status' };
    }

    const now = new Date();

    const update = {
      $set: {
        orderStatus: newStatus,
        'items.$[elem].status': newStatus
      },
      $push: {
        timeline: {
          status: newStatus,
          date: now,
          note: notes || `Status changed to ${newStatus}`
        }
      }
    };


    if (trackingNumber) {
      update.$set.trackingNumber = trackingNumber;
    }

    if (reason && newStatus === 'cancelled') {
      update.$set.cancelledBy = 'admin';
      update.$set.cancelledAt = now;
      update.$set.cancellationReason = reason;
    }

    if (reason && newStatus === 'return-complete') {
      update.$set.returnReason = reason;
    }

    if (notes) {
      update.$set.adminNotes = notes;
    }

    const order = await Order.findById(orderId);

    if (!order) return { success: false, message: 'order not found' };

    for (let item of order.items) {

      if (
        newStatus === 'confirmed' &&
        !item.isCancelled &&
        !item.status.includes('return')
      ) {
        const product = await Product.findById(item.productId);
        if (!product) continue;

        console.log(product.name);
        




        const variant = product.variants.find(
          v => v.size === item.variant.size && v.color === item.variant.color
        );
        if (!variant) continue;

        const previousStock = variant.stock;
        const newStock = previousStock - item.quantity;
        if (newStock < 0) continue;

        variant.stock = newStock;
        await product.save();

        await StockRegistry.create({
          productId: product._id,
          variant: { color: item.color , size: item.size  },
          productName: product.name,
          action: 'stock_out',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: 'order confirmed',
          updatedBy: 'admin'
        });
      }

    }

    await Order.findByIdAndUpdate(
      orderId,
      update,
      { arrayFilters: [{ 'elem.status': { $nin: ['cancelled','return-complete','return-processing','pickup'] } }] }
    );

    return { success: true, message: 'Status updated successfully' };
  } catch (err) {
    throw new Error(err.message);
  }
};



const updateReturnReuqestAction = async (orderId, { itemIndex, actionType, notes, pickupDate }) => {
  
  
  console.log(orderId);

  console.log("RETURN ACTION")
  
  
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
  'return-rejected',
  'return-approved'
];

  if (!validStatuses.includes(item.status)) {
    console.log("dkjdnbjfcnjkd");

      return { success: false, message: 'invalid status code' };
    }

    
if (actionType === 'return-approved') {



      item.status = 'return-pickup';
      item.returnApprovedAt = new Date();
      item.returnNote = notes || '';
      item.pickupScheduledAt = new Date();
      item.pickupDate = pickupDate ? new Date(pickupDate) : null;



      order.timeline.push({
        status: 'return-pickup',
        note: `return pickup for item ${item.productName} scheduled` + `${notes ? ' remark:'+notes : ''}`
      })



    } else if (actionType === 'return-processing') {


      item.status = 'return-processing';
      order.timeline.push({
        status: 'return-processing',
        note: `return processing started for item ${item.productName}` + `${notes ? ' remark:'+notes : ''}`
      })



    } else if (actionType === 'return-complete') {


      console.log("COMPLETED RETURN");
      
      item.status = 'return-complete';
      item.returnCompletedAt = new Date();
      item.returnNote = notes || '';

      order.timeline.push({
        status: 'return-complete',
        note: `Return completed for item ${item.productName}` + (notes ? ' – ' + notes : '')
      });

      const product = await Product.findById(item.productId);
      if (product) {


        const variant = product.variants.find(
          v => v.size === item.variant.size && v.color === item.variant.color
        );
        if (variant) {
          const previousStock = variant.stock;
          const newStock = previousStock + item.quantity;
          variant.stock = newStock;
          await product.save();

          await StockRegistry.create({
            productId: product._id,
            variant: { size: item.variant.size, color: item.variant.color },
            productName: product.name,
            action: 'stock_in',
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: 'return completed',
            updatedBy: 'admin'
          });

        }
      }

      const perItemPrice = item.price / item.quantity;
      const itemTotal = perItemPrice * item.quantity;

      const totalAmount = order.totalAmount;
      const discount = order?.coupon?.discountAmount || 0;

      const refund = Math.round(itemTotal - ((itemTotal / totalAmount) * discount));

      let wallet = await UserWallet.findOne({ user: order.user });

      if (!wallet) {
        wallet = await UserWallet.create({ user: order.user, transactions: [] });
      }

      wallet.transactions.push({
        type: 'credit',
        amount: refund,
        description: 'refund for returned item',
        reference: order._id.toString(),
        note: `refunded for ${item.productName}`
      });

      await wallet.save();


      order.timeline.push({
        status: 'return-complete',
        note: `return completed for item ${item.productName}` + `${notes ? ' remark:'+notes : ''}`
      });



    } else if (actionType === 'return-rejected') {
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
    } else if (itemStatuses.some(s => s === 'delivered' )) {
      order.orderStatus = 'delivered'
    }

    if (notes) item.returnNote = notes;

    await order.save();


    return { success: true, data: order };

  } catch (err) {

    console.log(err);
    
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
