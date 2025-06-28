const Wishlist = require('../models/wishListModel');
const Product = require('../models/productModel');

const getWishlist = async (userId) => {
  const wishlist = await Wishlist
    .findOne({ user: userId })
    .populate('items.product')
    .lean();
  return wishlist ? wishlist.items : [];
};

const getCountWishlist = async (userId) => {
  try{

    const wishlist = await Wishlist.findOne({ user: userId }).lean();
    return wishlist && wishlist.items ? wishlist.items.length : 0;


  }catch(err){
    throw new Error(err.message)
  }
};

const addToWishlist = async (userId, productId, size, color) => {

  const product = await Product.findById(productId);

  if (!product || !product.isActive) throw new Error('Product not found or unavailable');

  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = new Wishlist({ user: userId, items: [] });
  }

  const already = wishlist.items.some(
    item =>
      item.product.toString() == productId &&
      item.variant.size == size &&
      item.variant.color == color
  );


  if (already) throw new Error('Item already in wishlist');

  wishlist.items.push({ product: productId, variant: { size, color } });
  await wishlist.save();
  return wishlist;
};

const removeFromWishlist = async (userId, itemId) => {

  try{
      
  const wishlist = await Wishlist.findOne({ user: userId }).populate('items.product');
  if (!wishlist) throw new Error('Wishlist not found');

  console.log(wishlist);
  

  wishlist.items = wishlist?.items.filter(
    item => item.product._id.toString() !== itemId
  );
  await wishlist.save();
  return wishlist;

}catch(err){
  throw new Error(err.message)
}

};

const clearWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({ user: userId });
  if (wishlist) {
    wishlist.items = [];
    await wishlist.save();
  }
};

module.exports = {
  getWishlist,
  getCountWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
