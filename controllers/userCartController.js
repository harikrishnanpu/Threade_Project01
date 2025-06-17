const cartService = require('../services/userCartService');
const userProductService = require('../services/userproductServices');



const renderCartPage = async (req,res) =>{
  try{
    const userId = req.user._id;
    const cartItems = await cartService.getCartItems(userId);   
    const cartItemIds = cartItems.items.map(item => item.product);
    const products = await userProductService.getProductByIds(cartItemIds); 
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

const updatedCartItems = cartItems.items.map(item => {
  const matchedProduct = productMap.get(item.product.toString());

  if (!matchedProduct || !matchedProduct.isActive) {
    return {
      ...item,
      isActive: false,
      price: 0,
      salePrice: 0,
      stock: 0
    };
  }

  const matchedVariant = matchedProduct.variants.find(
    v => v.size === item.variant.size && v.color === item.variant.color
  );

  return {
    ...item,
    isActive: true,
    price: matchedVariant?.price || item.price, 
    salePrice: matchedVariant?.salePrice || 0,
    stock: matchedVariant?.stock || 0
  };
});



    res.render('user/cart', { cartItems: updatedCartItems, products })

  }catch(err){
    console.log(err);
    
    res.render('user/cart', { error: err.message})
  }

}


const addToCart = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { variant, quantity } = req.body;
    const userId = req.user._id;
  
    const result = await cartService.addToCart(productId,variant,quantity,userId);

    if(result){
        return res.status(200).json({ message: 'Item added to cart', userId: userId });
    }else{
        return res.status(500).json({ message: 'error occured'  })
    }

  } catch (err) {
    return res.status(500).json({ message: err.message});
  }

};


const getCartCount = async (req,res) => {
    const userId = req.user._id;
    try{
        const count = await cartService.getCartCount(userId);
        res.status(200).json({count})
    }catch(err){
        res.status(500).json({message: err.message})
    }
}


const updateCart = async (req, res) => {
  const {id: itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user._id;

  try {
    const result = await cartService.updateCart(userId,itemId, quantity);
    if(result.isNotActive){
      res.status(200).json({message: 'cart updated successfully', success: true, stock: 0 , isActive: false});
    }else{
      res.status(200).json({message: 'cart updated successfully', success: true, stock: result.stock, isActive: true});
    }

  } catch (err) {
    res.status(400).json({ message: err.message, success: false });
  }

};



module.exports = {addToCart, getCartCount, renderCartPage, updateCart};