const Product = require('../models/productModel');
const Brand = require('../models/brandModel');
const { default: mongoose } = require('mongoose');
const Category = require('../models/categoryModel');


const getProducts = async (filters = {}, sortOptions = { createdAt: -1 }, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    filters.isActive = true;
    
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
  } catch (error) {
    console.error('Error in getProducts service:', error);
    throw error;
  }
};


const getProductById = async (id) => {
  try {
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();

      if(!product){
        throw new Error('product not found')
      }

      if(!product.isActive){
        throw new Error('product is currently unavailbale')
      }
    
    return product;
  } catch (err) {
    throw new Error(err.message);
  }

};


const getAllTags = async () => {
  
  try {
    const tagsArray = await Product.aggregate([
      { $match: { isActive: true } },
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
      {$match: { isActive: true, category: new mongoose.Types.ObjectId(mainCat) }},
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
    const products = await Product.find({ isFeatured: true, isActive: true })
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
      {$match: { isActive: true }},
      {$addFields: { discountPercentage: { $round: [ { $multiply: [
        {$divide: [ {$subtract: ['$regularPrice', '$salePrice' ] } , '$regularPrice']},
        100
      ]},0]} }},
      {$sort: { discountPercentage: -1 }},
      {$limit: limit}
    ])    
    
    return products;
  } catch (err) {
    throw new Error(err.message);
  } 
};


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
  {$sort: {'products.discountPercentage': -1 }},
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
    const products = await Product.find({ isNew: true, isActive: true })
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
      isActive: true
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
      isActive: true
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
      {$match: { isActive: true }},
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
  getProductByIds
}; 