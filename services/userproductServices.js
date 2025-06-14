const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Brand = require('../models/brandModel');


const getProducts = async (filters = {}, sortOptions = { createdAt: -1 }, page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
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


const createProduct = async (productData) => {
  try {
    const newProduct = new Product(productData);
    await newProduct.save();
    
    return newProduct;
  } catch (error) {
    console.error('Error in createProduct service:', error);
    throw error;
  }
};


const updateProduct = async (id, updateData) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    return updatedProduct;
  } catch (error) {
    console.error('Error in updateProduct service:', error);
    throw error;
  }
};





const getProductsByCategory = async (categoryId, page = 1, limit = 9) => {
  try {
    const childCategories = await Category.find({ parentCategory: categoryId });
    const categoryIds = [categoryId, ...childCategories.map(cat => cat._id)];
    
    const filters = {
      category: { $in: categoryIds },
      isActive: true
    };
    
    return await getProducts(filters, { createdAt: -1 }, page, limit);
  } catch (error) {
    console.error('Error in getProductsByCategory service:', error);
    throw error;
  }
};


const getProductsByBrand = async (brandId, page = 1, limit = 9) => {
  try {
    const filters = {
      brand: brandId,
      isActive: true
    };
    
    return await getProducts(filters, { createdAt: -1 }, page, limit);
  } catch (error) {
    console.error('Error in getProductsByBrand service:', error);
    throw error;
  }
};


const searchProducts = async (keyword, page = 1, limit = 9) => {
  try {
    const filters = {
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [keyword] } }
      ],
      isActive: true
    };
    
    return await getProducts(filters, { createdAt: -1 }, page, limit);
  } catch (error) {
    console.error('Error in searchProducts service:', error);
    throw error;
  }
};


const getFeaturedProducts = async (limit = 8) => {
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

const getAllFeaturedBrands = async (limit = 8) => {
  try {
    const brands = await Brand.find({ isListed: true, isActive: true })
      .sort({ createdAt: -1  })
      .limit(limit)
      .populate('category', 'name')
      .lean();
    
    return brands;
  } catch (error) {
    console.error('Error in getFeaturedProducts service:', error);
    throw error;
  }
};




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


const getProductsByIds = async (ids) => {
  try {
    const products = await Product.find({
      _id: { $in: ids },
      isActive: true
    })
      .populate('category', 'name')
      .populate('brand', 'name')
      .lean();
    
    return products;
  } catch (error) {
    console.error('Error in getProductsByIds service:', error);
    throw error;
  }
};


const getLowStockProducts = async (threshold = 5) => {
  try {
    const products = await Product.find({
      stock: { $gt: 0, $lte: threshold },
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

module.exports = {
  getProducts,
  getProductById,
  getAllTags,
  createProduct,
  updateProduct,
  getProductsByCategory,
  getProductsByBrand,
  searchProducts,
  getFeaturedProducts,
  getNewProducts,
  getRelatedProducts,
  getProductsByIds,
  getLowStockProducts,
  getAllFeaturedBrands
}; 