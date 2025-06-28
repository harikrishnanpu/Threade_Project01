const Wishlist = require('../../models/wishListModel');
const wishlistService = require('../../services/userWishListServices');
const productService = require('../../services/userproductServices');

const renderWishlistPage = async (req, res) => {
  try {
    const userId = req.user._id;
    const wishlistItems = await wishlistService.getWishlist(userId);
        const allMainCatsbySub       = await productService.getAllCategoriesBySubCategories(8);

            const userWishlist           = await Wishlist.findOne({ user: req.user._id }).lean()
            const wishlistItemIds        = userWishlist?.items.map(i => i.product.toString()) || []
    
    res.render('user/wishlist', { wishlistItems, allMainCatsbySub, wishlistItemIds });
  } catch (err) {
    console.log(err);

    res.status(500).send('Something went wrong');
  }
};

const getWishlistItems = async (req, res) => {
  try {
    const userId = req.user._id;
    const wishlistItems = await wishlistService.getWishlist(userId);
    res.status(200).json({ success: true, wishlistItems });
  } catch (err) {
    console.log(err);

    res.status(500).json({ success: false , message: err.message });
  }
};

const countWishLists = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await wishlistService.getCountWishlist(userId);
    res.status(200).json({ count, success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const addToWishlist = async (req, res) => {
  try {

    const userId = req.user._id;
    const { productId, size, color } = req.body;

    console.log("req.body");
    

    const item = await wishlistService.addToWishlist(userId, productId, size, color);

    res.status(200).json({ success: true, item });
  } catch (err) {
    console.log(err);
    
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromWishlist = async (req, res) => {
  try {

    const userId = req.user._id;
    const itemId = req.params.itemId;

    await wishlistService.removeFromWishlist(userId, itemId);
    res.status(200).json({ success: true });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    await wishlistService.clearWishlist(userId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  renderWishlistPage,
  getWishlistItems,
  countWishLists,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
