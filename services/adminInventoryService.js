const Product       = require('../models/productModel');
const StockRegistry = require('../models/stockRegsitryModel');
const { flattenVariants } = require('../utils/product');


const listInventory = async (q = {}) => {
  try {

    const page      = parseInt(q.page)  || 1;
    const limit     = parseInt(q.limit) || 10;
    const status    = q.status || 'all';        
    const searchKey = (q.search || '').trim().toLowerCase();
    const catFilter = q.categoryFilter  || 'all';
    const showLowStock = q.showLowStock;

    const prodFilter = { isActive: true };
    if (catFilter !== 'all') prodFilter.category = catFilter;

    const products = await Product.find(prodFilter).populate('category', 'name').lean();

    let productArr = products.flatMap(flattenVariants);

    productArr = productArr.filter(r => r.isActive);

    if (searchKey) {
      productArr = productArr.filter(r =>
        r.name.toLowerCase().includes(searchKey) ||
        r.size.toLowerCase().includes(searchKey) ||
        r.color.toLowerCase().includes(searchKey)
      );
    }

    if(showLowStock) productArr.filter(i => i.currentStock <= 5)


    productArr = productArr.filter(r => {
      const s = r.currentStock;
      if (status === 'in_stock')   
        return s > 5;
      if (status === 'low_stock')    
    return s > 0 && s <= 5;
      if (status === 'out_of_stock') return s === 0;
      return true;  

    });

    const sortKey = q.sortField || 'lastUpdated';

    let sortOrder = -1;

    if(q.sortOrder?.trim() !== ''){
      sortOrder =  q.sortOrder == 'desc' ? -1 : 1;
    }
  
    // console.log(sortOrder);
    
    const dir = sortOrder;

    productArr.sort((a, b) => (a[sortKey] > b[sortKey] ? dir : -dir));

    const total = productArr.length;
    const start = (page - 1) * limit;


    const items = productArr.slice(start, start + limit) || [];

    return { success: true, data: { items, total } };

  } catch (err) {
    // console.log(err);
    
    return { success: false, message: err.message };
  }
};




const getProductById = async (id) => {
  try {
    const product = await Product
      .findById(id)
      .populate('category', 'name')
      .lean();

    if (!product) return { success: false, message: 'Product not found' };
    return { success: true, data: product };
  } catch (err) {
    return { success: false, message: err.message };
  }
};



const updateStock = async ({
  productId,
  variantId,
  action,       
  quantity,
  reason,
  updatedBy
}) => {
  try {
    const product = await Product.findById(productId);
    if (!product) return { success: false, message: 'Product not found' };

    const variant = product.variants.id(variantId);
    if (!variant) return { success: false, message: 'Variant not found' };

    const prev = variant.stock;
    const delta = action === 'stock_in' ? quantity : -quantity;
    const next = Math.max(prev + delta, 0);

    variant.stock = next;
    await product.save();

    await StockRegistry.create({
      productId,
      variant: { color: variant.color , size: variant.size  },
      productName   : product.name,
      action,
      quantity,
      previousStock : prev,
      newStock      : next,
      reason,
      updatedBy
    });

    return { success: true, message: 'Stock updated successfully' };
  } catch (err) {
    return { success: false, message: err.message };
  }
};




const listStockHistory = async (limit = 40) => {
  try {
    const history = await StockRegistry.find().sort({ createdAt: -1 }).lean().limit(limit).lean();
    // console.log(history);
    
    return { success: true, data: history };
  } catch (err) {
    return { success: false, message: err.message };
  }
};


module.exports = {
  listInventory,
  getProductById,
  updateStock,
  listStockHistory
};
