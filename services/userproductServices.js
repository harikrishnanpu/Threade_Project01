const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const  mongoose  = require('mongoose');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');


const getProducts = async (filters = {}, sortOptions = { createdAt: -1 }, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    filters.isActive = true;
    filters.isCategoryActive = true;
    filters.isBrandActive = true;
    
    const totalProducts = await Product.countDocuments(filters);
    
    const totalPages = Math.ceil(totalProducts / limit);
    
    const products = await Product.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return {
      products,
      totalProducts,
      totalPages
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


const getProductById = async (id) => {
  try {
const product = await Product.findById(id)
  .populate('category')
  .populate('brand')
  .lean();

if (!product) {
  throw new Error('Product not found');
}

if (!product.isActive || !product.isCategoryActive || !product.isBrandActive) {
  throw new Error('product is currently unavailable');
}

product.variants = product.variants.filter(v => v.isActive);

if(product.variants.length == 0) throw new Error('no variants available for this product')

return product;
  } catch (err) {
    throw new Error(err.message);
  }

};


const getAllTags = async () => {
  
  try {
    const tagsArray = await Product.aggregate([
      { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } }
    ]);
    
    const tags = tagsArray.map(tag => tag._id);
    
    return tags;
  } catch (error) {
    console.error('Error in getAllTags service:', error);
    throw error;
  }

};


const getAllVariants = async (mainCat) => {

  try{

    const allVariants = await Product.aggregate([
      {$match: { isActive: true, isCategoryActive: true, isBrandActive: true  , category: new mongoose.Types.ObjectId(mainCat) }},
      {$unwind: '$variants'},
      {
        $facet: {
          allSizes: [
            { $group: { _id: "$variants.size" } },            
            { $project: { _id: 0, size: "$_id" } }
          ],
          allColors: [
            { $group: { _id: "$variants.color" } },
            { $project: { _id: 0, color: "$_id" } }
          ],
          allPrices: [
            { $group: { _id: "$variants.price" } },
            { $project: { _id: 0, price: "$_id" } }
          ]
        }
      }
    ])

    return allVariants;
    
  }catch(err){
    throw new Error(err.message);
  }


}




const getFeaturedProducts = async (limit = 10) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true, isCategoryActive: true, isBrandActive: true  })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return products;
  } catch (error) {
    console.error('Error in getFeaturedProducts service:', error);
    throw error;
  }
};


const getHotProducts = async (limit = 5) => {
  try {

    const products = await Product.aggregate([
      {$match: { isActive: true, isCategoryActive: true, isBrandActive: true }},
      {$addFields: { discountPercentage: { $round: [ { $multiply: [
        {$divide: [ {$subtract: ['$regularPrice', '$salePrice' ] } , '$regularPrice']},
        100
      ]},0]} }},
      {$lookup: { from: 'categories' , foreignField: '_id', localField: 'category' , as: 'category' }  },
      {$unwind: '$category' },
      {$sort: { discountPercentage: -1 }},
      {$limit: limit}
    ])    

    console.log(products);
    
    
    return products;
  } catch (err) {
    throw new Error(err.message);
  } 
};


// getHotProducts()



const getTopRatedProducts = async (limit = 5) => {
  try{

    const result = Product.find({ isActive: true, isCategoryActive: true, isBrandActive: true }).sort({ rating: -1 }).populate('category','name').lean().limit(limit)
    return result
  }catch(err){
    throw new Error(err.message)
  }
}





const getHotProductsByMainCategory = async (limit = 5) => {
  try {

const result = await Category.aggregate([
  { $match: { isActive: true, parentCategory: null } },

  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: 'category',
      as: 'products'
    }
  },

  { $unwind: '$products' },

  {
    $addFields: {
      'products.discountPercentage': {
        $round: [
          {
            $multiply: [
              {
                $divide: [
                  { $subtract: ['$products.regularPrice', '$products.salePrice'] },
                  '$products.regularPrice'
                ]
              },
              100
            ]
          },
          0
        ]
      }
    }
  },
  { $sort: { 'products.discountPercentage' : -1 } },
  {
    $group: {
      _id: '$_id',
      name: { $first: '$name' },
      products: { $push: '$products' }
    }
  },
  {$limit: limit },
  { $project: { _id: 0, name: 1, products: {
      $slice: [
        {
          $filter: {
            input: '$products',
            as: 'prod',
            cond: { $eq: ['$$prod.isActive', true] }
          }
        },
        6
      ]
    } } }
]);

// console.log(result); 

     
    
    return result;
  } catch (err) {
    throw new Error(err.message);
  } 
};

// getHotProductsByMainCategory() 



const getNewProducts = async (limit = 8) => {
  try {
    const products = await Product.find({ isActive: true, isCategoryActive: true, isBrandActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return products;
  } catch (error) {
    console.error('Error in getNewProducts service:', error);
    throw error;
  }
};


const getProductByIds = async (productIds) => {
  try{
    const products = await Product.find({ _id: { $in: productIds }})
    return products
  }catch(err){
    throw new Error(err.message)
  }
}









const getRelatedProducts = async (productId, categoryId, limit = 4) => {
  try {
    const products = await Product.find({
      _id: { $ne: productId },
      category: categoryId,
      isActive: true,
      isCategoryActive: true, isBrandActive: true
    })
      .limit(limit)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return products;
  } catch (error) {
    console.error('Error in getRelatedProducts service:', error);
    throw error;
  }
};




const getLowStockProducts = async (stockLimit = 5) => {
  try {
    const products = await Product.find({
      stock: { $gt: 0, $lte: stockLimit },
      isActive: true,
      isCategoryActive: true,
       isBrandActive: true
    })
      .sort({ stock: 1 })
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return products;
  } catch (error) {
    console.error('Error in getLowStockProducts service:', error);
    throw error;
  }
};


const getAllProductsByCategory  =  async (limit= 5) => {
  try{

    const result = await Product.aggregate([
      {$match: { isActive: true, isCategoryActive: true, isBrandActive: true }},
      {$lookup: { from: 'categories' , localField: 'category' , foreignField: '_id', as: 'categoryData' }},
      {$unwind: '$categoryData'},
      { $match: { 'categoryData.isActive': true } },
      {$group: { _id: '$categoryData.name' , products: { $push: '$$ROOT'  } }},
      {$limit: limit}
    ]);


    return result;
    

  }catch(err){
    throw new Error(err.message);
  }
}


const getAllNewArrivals  =  async (limit= 5) => {
  try{
    const result = await Product.find({isActive: true, isCategoryActive: true, isBrandActive: true}).sort({createdAt: -1}).limit(limit).populate('category','name');
    return result;
  }catch(err){
    throw new Error(err.message);
  }
}


const getAllCategoriesBySubCategories = async (limit = 5) =>{
  try{

    const result = await Category.aggregate([
      { $match: { parentCategory: null, isActive: true } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: 'parentCategory',
          as: 'subCategories'
        }
      },
      {$project: { _id: 1, name: 1, description: 1,    
        subCategories: {
        $filter: {
          input: '$subCategories',
          as: 'sub',
          cond: { $eq: ['$$sub.isActive', true] }
        }
      } }},
      { $sort: { name: 1 } }
    ]);

    return result


    

  }catch(err){
    throw new Error(err.message)
  }


}


const productSuggestions = async (userId='684d0b00b80e185db0828a81' , limit = 5) => {
  try {

    let orderIds = [];

if (userId) {
  const userOrders = await Order.find({ user: new mongoose.Types.ObjectId(userId) }).select('_id').lean();
  orderIds = userOrders.map(order => order._id);
  console.log(orderIds);
}

if (!Array.isArray(orderIds)) {
  throw new Error('orderIds should be an array');
}


    let result = [];

    if (orderIds.length > 0) {
      const orders = await Order.find({ _id: { $in: orderIds } }).lean();

      const orderedProductIds = [];

      orders.forEach(order => {
        order.items.forEach(item => {
          if (!item.isCancelled && item.productId) {
            orderedProductIds.push(item.productId.toString());
          }
        });
      });

      if (orderedProductIds.length > 0) {

        const OrderProducts = await Product.find({ _id: { $in: orderedProductIds } , isCategoryActive: true, isBrandActive: true, isActive: true }).lean();

        const categories = OrderProducts.map(p => p.category?.toString());
        const brands = OrderProducts.map(p => p.brand?.toString());

        const suggestions = await Product.find({
          isActive: true,
          isCategoryActive: true, isBrandActive: true,
          _id: { $nin: orderedProductIds },
          $or: [
            { category: { $in: categories } },
            { brand: { $in: brands } }
          ]
        }).limit(limit).lean();

        result = suggestions;
      }


    }else{

      result = Product.find({ isActive: true}).sort({ createdAt: -1 }).lean().limit(limit)

    }
    console.log(result);

    

    return result;
  } catch (err) {
    console.log(err);
    throw new Error(err.message);
  }
};

// productSuggestions();


const getDealOfTheDayProducts = async(limit = 5) => {
  try{

    const result = await Product.find({ isActive: true, isCategoryActive: true, isBrandActive: true, tags: { $in: [ 'deal-of-the-day', 'top-seller' ] } })

    return result;

  }catch(err){
    throw new Error(err.message)
  }
}



// getAllCategoriesBySubCategories()


module.exports = {
  getProducts,
  getProductById,
  getAllTags,
  getFeaturedProducts,
  getNewProducts,
  getRelatedProducts,
  getLowStockProducts,
  getHotProducts,
  getAllProductsByCategory,
  getAllVariants,
  getHotProductsByMainCategory,
  getProductByIds,
  getAllNewArrivals,
  getAllCategoriesBySubCategories,
  getTopRatedProducts,
  productSuggestions,
  getDealOfTheDayProducts
}; 