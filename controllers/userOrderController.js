const orderService = require('../services/userOrderServices');

const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { paymentMethod } = req.body;

    if(paymentMethod == 'cod'){   
        const order = await orderService.createCodOrder(userId);
        return res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            redirectUrl: `/user/order/success/${order._id}`
        });
    }
            
    return res.status(400).json({ success: false, message: 'payment method not found' });
    
    } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};




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

const cancelMultipleItems = async (req, res) => {
  try {
    const { itemIds = [], cancellationReason, additionalComments = '' } = req.body
    if (!itemIds.length) return res.status(400).json({ message: 'itemIds required' })
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

    const data = await orderService.cancelMultipleItems({
      orderId: req.params.orderId,
      userId: req.user._id,
      itemIds,
      reason: cancellationReason,
      note: additionalComments
    })
    res.json({ success: true, data })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}

const cancelSingleItem = async (req, res) => {
  try {
    const { itemId, cancellationReason, additionalComments = '' } = req.body
    if (!itemId) return res.status(400).json({ message: 'itemId required' })
    if (!cancellationReason) return res.status(400).json({ message: 'cancellationReason required' })

    const data = await orderService.cancelSingleItem({
      orderId: req.params.orderId,
      userId: req.user._id,
      itemId,
      reason: cancellationReason,
      note: additionalComments
    })
    res.json({ success: true, data })
  } catch (err) {
    console.log(err);
    
    res.status(400).json({ message: err.message })
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

const returnMultipleItems = async (req, res) => {
  try {
    const { itemIds = [], returnReason, returnNote } = req.body
    if (!itemIds.length) return res.status(400).json({ message: 'itemIds required' })
    if (!returnReason || !returnNote) return res.status(400).json({ message: 'returnReason and returnNote required' })

    const data = await orderService.returnMultipleItems({
      orderId: req.params.orderId,
      userId: req.user._id,
      itemIds,
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
    res.status(400).json({ message: err.message })
  }
}




module.exports = { placeOrder ,   cancelFullOrder,
  cancelMultipleItems,
  cancelSingleItem,
  returnFullOrder,
  returnMultipleItems,
  returnSingleItem};
