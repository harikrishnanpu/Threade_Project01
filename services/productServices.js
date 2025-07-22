const Product = require("../models/productModel");
const { getFilteredProductList } = require("../utils/queries/getAllProductsQuery");

const getAllProducts = async (query) => {

  try{
 
  const { 
        validSortFields,
        sortField,
        sortOrderValue,
        sort,
        parsedPage,
        parsedLimit,
        skip,
        status,
        trimmedSearch,
        categoryFilter,
        brandFilter,
        filter} = await getFilteredProductList(query);
        

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name')
      .populate('brand', 'name')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parsedLimit),
    Product.countDocuments(filter)
  ]);

  return {
    data: products,
    total,
    currentPage: parsedPage || 1,
    totalPages: Math.ceil(total / parsedLimit),
    limit: parsedLimit,
    filters: {
      search: trimmedSearch,
      status,
      categoryFilter,
      brandFilter
    },
    sortField,
    sortOrder: sortOrderValue === 1 ? 'asc' : 'desc'
  };

}catch(err){
  throw new Error(err.message);
}
};


const insertOneProduct = async (data) => {
  const { 
    name, 
    description, 
    category, 
    brand,
    images,
    isFeatured = false,
    isActive = true, 
    createdBy,
    maxCartQuantity,
    variants
  } = data;
  
  try {

    const existingProduct = await Product.findOne({ name: {$regex:  new RegExp(name.trim() , 'i') }});
    
    if (existingProduct) {
      throw new Error('Product with this name already exists');
    }

    const newProduct = new Product({
      name: name.trim(),
      description: description?.trim(),
      category,
      brand: brand || null,
      images,
      isFeatured: Boolean(isFeatured),
      isActive: Boolean(isActive),
      createdBy,
      maxCartQuantity,
      variants
    });

    return await newProduct.save();
  } catch (err) {
    throw new Error(err.message);
  }
};

const findOneProductById = async (productId) => {
  try {
    const productData = await Product.findById(productId)
      .populate('createdBy', 'name email');

    if (!productData) {
      throw new Error('Product not found');
    }

    return productData;
  } catch (err) {
    throw new Error(err.message);
  }
};

const editProductById = async (productId, data) => {
  const { 
    name,
    description,
    category,
    brand,
    images,
    isFeatured,
    isActive,
    createdBy,
    variants ,
    maxCartQuantity
  } = data;

  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    if (name && name.trim() !== product.name) {
      const conflict = await Product.findOne({
        name: {$regex: new RegExp(name.trim() , 'i')},
        _id: { $ne: productId }
      });
      if (conflict) throw new Error('product with this name already exists');
    }

    const updateData = {};
    if (name!== undefined) updateData.name = name.trim();
    if (description!== undefined) updateData.description  = description.trim();
    if (category!== undefined) updateData.category = category;
    if (brand!== undefined) updateData.brand = brand || null;
    if (images!== undefined)updateData.images = images;
    if (isFeatured!== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isActive!== undefined) updateData.isActive = Boolean(isActive);
    if (createdBy !== undefined) updateData.createdBy   = createdBy;
    if (maxCartQuantity !== undefined) updateData.maxCartQuantity   = maxCartQuantity;


    if (variants !== undefined) {
      updateData.variants = variants.map(v => ({
        size: v.size,
        color: v.color,
        price: Number(v.price),
        salePrice: Number(v.salePrice) || 0,
        stock:  Number(v.stock),
        images:   v.images,
        isActive:  v.isActive
      }));
    }

    Object.assign(product, updateData);
    return await product.save();
  } catch (err) {
    throw new Error(err.message);
  }
};


const toggleProductStatusById = async (productId, isActive) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    
    product.isActive = isActive == 'true' ? false : true
    return await product.save();
  } catch (err) {
    throw new Error(err.message);
  }
};

const toggleProductFeaturedById = async (productId, isFeatured) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }
    
    product.isFeatured = isFeatured == 'true' ? false : true;
    return await product.save();
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  getAllProducts,
  insertOneProduct,
  findOneProductById,
  editProductById,
  toggleProductStatusById,
  toggleProductFeaturedById,
};