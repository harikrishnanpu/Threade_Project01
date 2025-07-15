const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const  mongoose  = require('mongoose');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');


const getProducts = async (filters = {}, sortOptions = { createdAt: -1 }, page = 1, limit = 10) => {
  try {
    
    filters.isActive = true;
    filters.isCategoryActive = true;
    filters.isBrandActive = true;
    
    const totalProducts = await Product.countDocuments(filters);
    
    const totalPages = Math.ceil(totalProducts / limit);
    
    const products = await Product.aggregate([
      {$match: filters},
      {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true } },
      {$sort: sortOptions },
      {$skip: (page - 1) * limit },
      {$limit: limit }
    ]);
    

    
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

// console.log(getProductById);


if (!product.isActive || !product.isCategoryActive || !product.isBrandActive || !product.category.isActive) {
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
      {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },
      {$unwind:  '$category'},
      {$match: { 'category.isActive' : true  } },
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
    const products = await Product.aggregate([
        { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
      {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$sort: {createdAt: -1} },
      {$limit: limit}
    ])
    
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
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$addFields: { discountPercentage: { $round: [ { $multiply: [
        {$divide: [ {$subtract: ['$regularPrice', '$salePrice' ] } , '$regularPrice']},
        100
      ]},0]} }},
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

    const result = Product.aggregate([
         { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$sort: {createdAt: -1, rating: -1} },
      {$limit: limit}
    ])

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
    const products = await Product.aggregate([
         { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$sort: {createdAt: -1} },
      {$limit: limit}
    ])
    
    return products;
  } catch (error) {
    console.error('Error in getNewProducts service:', error);
    throw error;
  }
};


const getProductByIds = async (productIds) => {
  try{
    const products = await Product.find({ _id: { $in: productIds }}).populate('category brand')
    return products
  }catch(err){
    throw new Error(err.message)
  }
}









const getRelatedProducts = async (productId, categoryId, limit = 4) => {
  
  try {
    const products = await Product.aggregate([
         { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true , _id: { $ne:  new mongoose.Types.ObjectId(productId) } , category: {$ne: categoryId } }},
      {$sort: {createdAt: -1} },
      {$limit: limit}
    ])
    
    return products;
  } catch (error) {

    // console.log('ERORR PRODUCTS RELATED', error);
    throw error;

  }
};




const getLowStockProducts = async (stockLimit = 5) => {
  try {
    const products = await Product.aggregate([
         { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true  , stock: { $gte: 0 , lte: stockLimit } }},
      {$sort: {sort: 1} },
      {$limit: limit}
    ])
    
    return products;
  } catch (error) {

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
    const result = await Product.aggregate([
        { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$sort: {createdAt: -1} },
      {$limit: limit}
    ])
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
  // console.log(orderIds);
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

        const OrderProducts = await Product.aggregate([
             { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
            {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
        ])

        const categories = OrderProducts.map(p => p.category?._id.toString());
        const brands = OrderProducts.map(p => p.brand?._id.toString());

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

      result = Product.aggregate([
           { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
                {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true }},
      {$sort: {createdAt: -1 }},
      {$limit: limit}
      ])

    }
    // console.log(result);

    

    return result;
  } catch (err) {
    // console.log(err);
    throw new Error(err.message);
  }
};

// productSuggestions();


const getDealOfTheDayProducts = async(limit = 5) => {
  try{

    const result = await Product.aggregate([
        { $match: { isActive: true , isCategoryActive: true, isBrandActive: true } },
        {$lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      } },{ $unwind: '$category' },
      {$lookup: {
        from: 'brands',
        localField: 'brand',
        foreignField: '_id',
        as: 'brand'
      }
      },{$unwind: '$brand' },
      {$match: { 'category.isActive' : true , 'brand.isActive' : true, tags: { $in: [ 'deal-of-the-day' , 'top-seller' ]  } }},
      { $sort: { createdAt: -1  } },
      {$limit: limit }
    ])

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