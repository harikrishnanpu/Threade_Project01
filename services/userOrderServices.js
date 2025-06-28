const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const Address = require('../models/addressModel');
const Coupon = require('../models/coupounModel');
const Product = require('../models/productModel');
const CheckoutSession = require('../models/checkoutSessionModel');
const UserWallet = require('../models/userWalletModel');
const mongoose = require('mongoose');
const Users = require('../models/userModel');


const findUserOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, user: userId })
  if (!order) throw new Error('order not found')
  return order
}

const saveTimeline = (order, status, note) => {
  return order.timeline.push({ status, date: new Date(), note })
}




const createCodOrder = async (userId) => {
  try {


    const cart = await Cart.findOne({ userId }).populate('items.product');

    console.log(cart);
    

    if (!cart || cart.items.length === 0) throw new Error('cart is empty');

    const session = await CheckoutSession.findOne({ userId });
    if (!session) throw new Error('complete the checkout step');

    const address = await Address.findOne({ _id: session.addressId, user: userId });
    if (!address) throw new Error('delivery address not found');

    const hasInactive = cart.items.some(item => !item.product || !item.product.isActive);
    if (hasInactive) throw new Error('cart contains inactive products');


    const inactiveVariants = cart.items.filter(item => {
      return item.product.variants.some(variant =>
        variant.color === item.variant.color &&
        variant.size === item.variant.size &&
        variant.isActive === false
      );
    });


    if (inactiveVariants.length > 0) throw new Error('cart contains inactive variant');

    const subtotal = cart.items.reduce((sum, item) => {
      const matchedVariant = item.product.variants.find(variant =>
        variant.color === item.variant.color && variant.size === item.variant.size
      );
      const variantPrice = matchedVariant?.salePrice ?? matchedVariant?.price ?? 0;
      return sum + (variantPrice * item.quantity);
    }, 0);


    let discountAmount = 0;
    let couponData = null;

    if (session.couponCode) {
      const coupon = await Coupon.findOne({ code: session.couponCode.toUpperCase() });

      if (!coupon) throw new Error('coupon is no longer valid');
  
  
  if (!coupon.isActive || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())) {
        throw new Error('coupon is expired');
      }

      if (subtotal < coupon.minOrderAmount) {
        throw new Error(`coupon  only valids for orders above ${coupon.minOrderAmount}`);
      }
      if (coupon.usedCount >= coupon.maxUsage) {
        throw new Error('Coupon usage limit reached');
      }

      if (coupon.usedBy?.some(u => u.toString() == userId.toString())) {
        throw new Error('coupon already used by you');
      }

      const discounAmt = Math.round((coupon.discount / 100) * subtotal);

      discountAmount = Math.min(discounAmt, coupon.maxDiscount);

      couponData = {
        code: coupon.code,
        discountAmount
      };

    }

    const shippingCost = session.shippingMethod === 'free' ? 0 : session.shippingMethod === 'express' ? 100 : 50;
    const totalAmount = subtotal + shippingCost - discountAmount;

    const orderNumber = `ORD-${Date.now()}-${userId}`;

    const orderItems = cart.items.map(item => {

      const matchedVariant = item.product.variants.find(v =>
        v.color === item.variant.color && v.size === item.variant.size
      );


      const variantPrice = matchedVariant?.salePrice ?? matchedVariant?.price ?? 0;

      return {
        productId: item.product._id,
        productName: item.product.name,
        productImage: item.product.images?.[0] || '',
        brand: item.product.brand || '',
        variant: item.variant,
        quantity: item.quantity,
        price: item.quantity * variantPrice
      };
    });

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

  } catch (err) {

    console.log(err);
    

    throw new Error(err.message);
  }
};



const prepareOnlineOrder = async (userId) => {
  try {

    const user = await Users.findById(userId);

    if(!user || user.isBlocked){
      throw new Error('user not found or inactive')
    }

    const cart = await Cart.findOne({ userId }).populate('items.product');
    if (!cart || cart.items.length === 0) throw new Error('cart is empty');

    const session = await CheckoutSession.findOne({ userId });
    if (!session) throw new Error('complete the checkout step');

    const address = await Address.findOne({ _id: session.addressId, user: userId });
    if (!address) throw new Error('delivery address not found');

    const hasInactive = cart.items.some(item => !item.product || !item.product.isActive);
    if (hasInactive) throw new Error('cart contains inactive products');

    const inactiveVariants = cart.items.filter(item => {
      return item.product.variants.some(variant =>
        variant.color === item.variant.color &&
        variant.size === item.variant.size &&
        variant.isActive === false
      );
    });

    if (inactiveVariants.length > 0) throw new Error('cart contains inactive variant');

    const subtotal = cart.items.reduce((sum, item) => {
      const matchedVariant = item.product.variants.find(v =>
        v.color === item.variant.color && v.size === item.variant.size
      );
      const variantPrice = matchedVariant?.salePrice ?? matchedVariant?.price ?? 0;
      return sum + (variantPrice * item.quantity);
    }, 0);

    let discountAmount = 0;
    let couponData = null;

    if (session.couponCode) {
      const coupon = await Coupon.findOne({ code: session.couponCode.toUpperCase() });
      if (!coupon) throw new Error('coupon is no longer valid');

      if (!coupon.isActive || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())) {
        throw new Error('coupon is expired');
      }

      if (subtotal < coupon.minOrderAmount) {
        throw new Error(`coupon only valid for orders above ₹${coupon.minOrderAmount}`);
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        throw new Error('Coupon usage limit reached');
      }

      if (coupon.usedBy?.some(u => u.toString() == userId.toString())) {
        throw new Error('coupon already used by you');
      }

      const discounAmt = Math.round((coupon.discount / 100) * subtotal);
      discountAmount = Math.min(discounAmt, coupon.maxDiscount);

      couponData = {
        code: coupon.code,
        discountAmount
      };
    }

    const shippingCost = session.shippingMethod === 'free' ? 0 : session.shippingMethod === 'express' ? 100 : 50;
const totalAmount = subtotal + shippingCost - discountAmount;

    const orderNumber = `ORD-${Date.now()}-${userId}`;

    const orderItems = cart.items.map(item => {
      const matchedVariant = item.product.variants.find(v =>
        v.color === item.variant.color && v.size === item.variant.size
      );
      const variantPrice = matchedVariant?.salePrice ?? matchedVariant?.price ?? 0;

      return {
        productId: item.product._id,
        productName: item.product.name,
        productImage: item.product.images?.[0] || '',
        brand: item.product.brand || '',
        variant: item.variant,
        quantity: item.quantity,
        price: item.quantity * variantPrice
      };


    });

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
      paymentMethod: 'online',
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


    return {
      amount: totalAmount,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: { name: user.name, phone: user.phone , email: user.email }
    };


  } catch (err) {
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
  try{
    if (!mongoose.Types.ObjectId.isValid(orderId)) return null;
    const order = await Order.findOne({ _id: orderId, user: userId }).lean();
    return order || null;
  }catch(err){
    throw new Error(err.message);
  }
};




const cancelFullOrder = async ({ orderId, userId, reason, note }) => {
  try {
    const order = await findUserOrder(orderId, userId);

    if (!['pending', 'confirmed', 'shipped'].includes(order.orderStatus)) {
      throw new Error('cannot cancel this order');
    }

    order.orderStatus = 'cancelled';

    for (const itm of order.items) {

      if (itm.isCancelled) continue;


      if (itm.status === 'pending') {


        const product = await Product.findById(itm.productId);
        if (product) {
          const variant = product.variants.find(
            v => v.size === itm.variant.size && v.color === itm.variant.color
          );
          if (variant) {
            const previousStock = variant.stock;
            const newStock = previousStock + itm.quantity;
            variant.stock = newStock;
            await product.save();

            await StockRegistry.create({
              productId: product._id,
              variant: { size: itm.variant.size, color: itm.variant.color },
              productName: product.name,
              action: 'stock_in',
              quantity: itm.quantity,
              previousStock,
              newStock,
              reason: 'User cancelled full order',
              updatedBy: 'user'
            });
          }
        }
      }

      itm.isCancelled = true;
      itm.cancellationReason = reason;
      itm.cancelledBy = 'user';
      itm.cancelledAt = new Date();
      itm.status = 'cancelled';
    }

    let refundPrice = order.totalAmount;
    
    if(order.coupon){
   const discountAmount = order?.coupon?.discountAmount || 0;
     refundPrice = itemTotal -  ( (itemTotal / totalAmount ) * discountAmount );
    }

    const refundAmount = Math.round(refundPrice);

    let wallet = await UserWallet.findOne({ user: userId });
    if (!wallet) {
      wallet = await UserWallet.create({ user: userId, transactions: [] });
    }

    wallet.transactions.push({
      type: 'credit',
      amount: refundAmount,
      description: 'refund for cancelled order',
      reference: order._id.toString(),
      note: 'order cancelled FULL'

    });

    await wallet.save();

    saveTimeline(order, 'cancelled', note || reason);

    await order.save();

    return {
      success: true,
      message: 'order cancelled and refund processed',
      data: { refundAmount, updatedOrder: order }
    };
  } catch (err) {
    throw new Error(err.message);
  }
};





const cancelSingleItem = async ({ orderId, userId, itemId, reason, note }) => {
  try {
    const order = await findUserOrder(orderId, userId);

    console.log(order);
    
    if (!['pending', 'confirmed'].includes(order.orderStatus)) {
      throw new Error('Cannot cancel items now');
    }

    let changed = 0;
    let refundAmount = 0;
    let originalItem = null;

    order.items.forEach(itm => {
      if (itm._id.toString() === itemId && !itm.isCancelled) {
        changed++;
        originalItem = itm;
        itm.isCancelled = true;
        itm.cancellationReason = reason;
        itm.cancelledBy = 'user';
        itm.cancelledAt = new Date();
        itm.status = 'cancelled';
      }
    });



    if (!changed) {
      throw new Error('no items to cancel');
    }

    if (!originalItem) {
      throw new Error('item not found');
    }

    if(order.items.every(itm => itm.status == 'cancelled')){
      order.orderStatus = 'cancelled'
    }

    const { productId, variant, quantity, price, status } = originalItem;

    const product = await Product.findById(productId);

    if (!product) throw new Error('Product not found');

    const targetVariant = product.variants.find(
      v => v.size === variant.size && v.color === variant.color
    );

    if (!targetVariant) throw new Error('variant not found');


    if (status === 'pending') {
      
      const previousStock = targetVariant.stock;

      const newStock = previousStock + quantity;
      targetVariant.stock = newStock;
      await product.save();

      await StockRegistry.create({
        productId: product._id,
        variant: {
          size: variant.size,
          color: variant.color
        },
        productName: product.name,
        action: 'stock_in',
        quantity,
        previousStock,
        newStock,
        reason: 'User cancelled item',
        updatedBy: 'user'
      });

    }

    const perItemPrice =  price / quantity;

    const itemTotal = perItemPrice * quantity;
    const totalAmount = order.totalAmount;
    const discountAmount = order?.coupon?.discountAmount || 0;

    const refundPrice = itemTotal -  ( (itemTotal / totalAmount ) * discountAmount );

    refundAmount = Math.round(refundPrice);

    let wallet = await UserWallet.findOne({ user: userId });

    if (!wallet) {
      wallet = await UserWallet.create({
        user: userId,
        transactions: []
      });
    }

    wallet.transactions.push({

      type: 'credit',
      amount: refundAmount,
      description: 'Refund for cancelled item',
      reference: order._id.toString(),
      note: `Refunded for cancelled item ${originalItem.productName}`

    });

    await wallet.save();

    saveTimeline(order, 'cancelled', note);

    await order.save();

    return {
      success: true,
      message: 'Item cancelled and refund processed',
      data: {
        refundAmount,
        updatedOrder: order
      }
    };


  } catch (err) {
    throw new Error(err.message);
  }
};

const returnFullOrder = async ({ orderId, userId, reason, note }) => {
  const order = await findUserOrder(orderId, userId)
  if (order.orderStatus !== 'delivered') throw new Error('order not delivered yet')
  order.orderStatus = 'return-requested'
  order.items.forEach(itm => {
    if(!itm.isCancelled && (!itm.status || !itm.status.includes('return'))) {
        itm.status = 'return-requested'
        itm.returnReason = reason
        itm.returnRequestedAt = new Date()
        itm.returnNote = note
    }
  })
  saveTimeline(order, 'return-requested', note)
  return order.save()
}


const returnSingleItem = async ({ orderId, userId, itemId, reason, note }) => {

  try{


   const order = await findUserOrder(orderId, userId)
  if (order.orderStatus !== 'delivered') throw new Error('order not delivered yet')

  let changed = 0;
  order.items.forEach(itm => {
    if (itm._id.toString() == itemId && !itm.isCancelled && (!itm.status || !itm.status.includes('return'))) {
      itm.status = 'return-requested'
      itm.returnReason = reason
      itm.returnRequestedAt = new Date()
      itm.returnNote = note
      changed++
    }
  })


  if (!changed) throw new Error('no valid items to return')

  saveTimeline(order, 'return-requested', `${changed} item(s) return-requested`)
  return order.save()

}catch(err){
  console.log(err);
  throw new Error(err.message)
}
}




module.exports = { createCodOrder,getUserOrders, getUserOrderById,   cancelFullOrder,
  cancelSingleItem,
  returnFullOrder,
  returnSingleItem ,
  prepareOnlineOrder
};
