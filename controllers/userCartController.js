const  cartService = require('../services/userCartService');



const renderCartPage = async (req,res) =>{

  try{

    const cartItems = await cartService.getCartItems(req.params.id);    

    res.render('user/cart', { cartItems: cartItems.items })

  }catch(err){
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
    const { id } = req.params;
    try{
        const count = await cartService.getCartCount(id);
        res.status(200).json({count})
    }catch(err){
        res.status(500).json({message: err.message})
    }
}


const updateCart = async (req, res) => {
  const { id } = req.params; 
  const { quantity } = req.body;
  const userId = req.user._id;

  try {
    const updatedItem = await cartService.updateCart(userId, id, parseInt(quantity, 10));

    res.status(200).json({message: 'cart updated successfully',updatedItem});

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



module.exports = {
  addToCart,
  getCartCount,
  renderCartPage,
};
