const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const Coupon = require('../models/coupounModel');
const CheckoutSession = require('../models/checkoutSessionModel');
const { default: mongoose } = require('mongoose');

const createCodOrder = async (userId) => {
  try{

  const cart = await Cart.findOne({ userId }).populate('items.product');
  if (!cart || cart.items.length === 0) throw new Error('your cart is empty');

  const session = await CheckoutSession.findOne({ userId });
  if (!session) throw new Error('please complete the checkout step again');

  const address = await Address.findOne({ _id: session.addressId, user: userId });
  if (!address) throw new Error('selected Delivery address not found');

  const hasInactive = cart.items.some(item => !item.product || !item.product.isActive);
  if (hasInactive)throw new Error('cart contains inactive products');

  console.log(cart.items);
  

const inactiveCartItemVariants = cart.items.filter(item => {
  const matched = item.product.variants.find(variant =>
    variant.color === item.variant.color &&
    variant.size === item.variant.size &&
    variant.isActive === false
  );
  return matched;
});

// console.log(inactiveCartItemVariants); 


if (inactiveCartItemVariants.length > 0) throw new Error(`cart item: variant is inactive`)

  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.product.salePrice || 0;
    return sum + (price * item.quantity);
  }, 0);

  let discountAmount = 0;
  let couponData = null;

  if (session.couponCode) {
    const coupon = await Coupon.findOne({ code: session.couponCode.toUpperCase() });
    if (!coupon) throw new Error('coupon no longer valid');

    if (!coupon.isActive || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()))
      throw new Error('coupon is expired or inactive');

    if (subtotal < coupon.minOrderAmount)
      throw new Error(`coupon valid only for orders above ₹${coupon.minOrderAmount}`);

    if (coupon.usedCount >= coupon.maxUsage)
      throw new Error('coupon usage limit reached');

    discountAmount = Math.round((coupon.discount / 100) * subtotal);

    couponData = {
      code: coupon.code,
      discountAmount
    };
  }

  const shippingCost = session.shippingMethod === 'free' ? 0 : session.shippingMethod === 'express' ? 100 : 50;
  const totalAmount = subtotal + shippingCost - discountAmount;

    
  const orderNumber = `ORD-${Date.now()}-${userId}`;

  const orderItems = cart.items.map(item => ({
    productId: item.product._id,
    productName: item.name,
    productImage: item.image,
    brand: item.product.brand || '',
    variant: item.variant,
    quantity: item.quantity,
    price: item.quantity * (item.product.salePrice || item.product.price || 0)
  }));

  const order = await Order.create({
    orderNumber,
    user: userId,
    items: orderItems,
    shippingAddress: {
      fullName: address.fullName,
      phone: address.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    },
    coupon: couponData,
    subtotal,
    totalAmount,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending'
  });

  if (session.couponCode && couponData) {
    await Coupon.updateOne(
      { code: session.couponCode.toUpperCase() },
      {
        $inc: { usedCount: 1 },
        $addToSet: { usedBy: userId }
      }
    );
  }

  await Cart.deleteOne({ userId });
  await CheckoutSession.deleteOne({ userId });

  return order;

}catch(err){
  throw new Error(err.message);
}

};



const getUserOrders = async (userId, filters, page = 1, limit = 10) => {
  try {
    const query = { user: userId };
    const { status, dateRange, paymentMethod, search } = filters;

    // Filter
    if (status) query.orderStatus = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    if (dateRange) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
      query.createdAt = { $gte: daysAgo };
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { 'items.productName': regex },
        { 'coupon.code': regex },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }
      ];
    }

    const sort = {};
    const [field, direction] = (filters.sortBy || 'createdAt_desc').split('_');
    sort[field] = direction === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [orders, totalOrders, pendingOrders, deliveredOrders] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Order.countDocuments(query),

      Order.countDocuments({ user: userId, orderStatus: 'pending' }),


      Order.countDocuments({ user: userId, orderStatus: 'delivered' })
    ]);

    return { orders, totalOrders, pendingOrders, deliveredOrders };
  } catch (err) {
    console.error('Order service error:', err);
    throw new Error('Failed to fetch orders');
  }
};


const getUserOrderById = async (userId, orderId) => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) return null;

  const order = await Order.findOne({ _id: orderId, user: userId }).lean();

  return order || null;
};

const findUserOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
  if (!order) throw new Error('order not found')
  return order
}

const saveTimeline = (order, status, note) => {
  order.timeline.push({ status, date: new Date(), note })
}

const cancelFullOrder = async ({ orderId, userId, reason, note }) => {
  const order = await findUserOrder(orderId, userId)
  if (!['pending', 'confirmed'].includes(order.orderStatus)) throw new Error('cannot cancel this order')

  order.orderStatus = 'cancelled'
  order.items.forEach(i => {
    i.isCancelled = true
    i.cancellationReason = reason
    i.cancelledBy = 'user'
    i.cancelledAt = new Date()
  })
  saveTimeline(order, 'cancelled', note)
  return order.save()
}

const cancelMultipleItems = async ({ orderId, userId, itemIds, reason, note }) => {
  const order = await findUserOrder(orderId, userId)
  if (!['pending', 'confirmed'].includes(order.orderStatus)) throw new Error('cannot cancel items now')

  let changed = 0
  order.items.forEach(i => {
    if (itemIds.includes(i._id.toString()) && !i.isCancelled) {
      i.isCancelled = true
      i.cancellationReason = reason
      i.cancelledBy = 'user'
      i.cancelledAt = new Date()
      changed++
    }
  })
  if (!changed) throw new Error('no valid items to cancel')
  saveTimeline(order, 'cancelled', `${changed} item(s) cancelled`)
  return order.save()
}

const cancelSingleItem = async ({ orderId, userId, itemId, reason, note }) => {
  return cancelMultipleItems({ orderId, userId, itemIds: [itemId], reason, note })
}

const returnFullOrder = async ({ orderId, userId, reason, note }) => {
  const order = await findUserOrder(orderId, userId)
  if (order.orderStatus !== 'delivered') throw new Error('order not delivered yet')
  order.orderStatus = 'return-requested'
  order.items.forEach(i => {
    i.status = 'return-requested'
    i.returnReason = reason
    i.returnRequestedAt = new Date()
    i.returnNote = note
  })
  saveTimeline(order, 'return-requested', note)
  return order.save()
}

const returnMultipleItems = async ({ orderId, userId, itemIds, reason, note }) => {
  const order = await findUserOrder(orderId, userId)
  if (order.orderStatus !== 'delivered') throw new Error('order not delivered yet')

  let changed = 0
  order.items.forEach(i => {
    if (itemIds.includes(i._id.toString()) && !i.isCancelled && (!i.status || !i.status.includes('return'))) {
      i.status = 'return-requested'
      i.returnReason = reason
      i.returnRequestedAt = new Date()
      i.returnNote = note
      changed++
    }
  })
  if (!changed) throw new Error('no valid items to return')
  saveTimeline(order, 'partial-return', `${changed} item(s) return-requested`)
  return order.save()
}

const returnSingleItem = async ({ orderId, userId, itemId, reason, note }) => {
  return returnMultipleItems({ orderId, userId, itemIds: [itemId], reason, note })
}




module.exports = { createCodOrder,getUserOrders, getUserOrderById,   cancelFullOrder,
  cancelMultipleItems,
  cancelSingleItem,
  returnFullOrder,
  returnMultipleItems,
  returnSingleItem };
