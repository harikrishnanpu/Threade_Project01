const Brand = require('../models/brandModel');
const productModel = require('../models/productModel');
const mongoose = require('mongoose');

const getAllBrands = async () => {
  try {
    return await Brand.find({}).populate('category', 'name').populate('createdBy', 'name email').sort({createdAt: -1});
  } catch (err) {
     throw new Error(err.message);
  }
};

const getBrands = async (query, sort, skip, limit) => {
  
  try {
    return await Brand.find(query).populate('category', 'name').sort(sort).skip(skip).limit(limit);
  } catch (err) {
    throw new Error(err.message);
  }
  
};

const countBrands = async (query) => {
  try {
    return await Brand.countDocuments(query);
  } catch (err) {
     throw new Error(err.message);
  }
};

const getBrandById = async (id) => {
  try {
    const brand = await Brand.findById(id)
      .populate('category', 'name')
      .populate('createdBy', 'name email');
    if (!brand) {
      return null;
    }
    return brand;
  } catch (error) {
    throw new Error('Error fetching brand');
  }
};

const createBrand = async (reqBody) => {

    const { name, description, category, isActive, isListed, image } = reqBody;

    try {
    
        const brandData = {
          name: name.trim(),
          description: description?.trim() || '',
          category,
          isActive: isActive === 'true' || isActive === true,
          isListed: isListed === 'true' || isListed === true,
          image: image?.trim() || '',
            };
        
    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(brandData.name.trim(), 'i') } });

    if (existingBrand) {
      throw new Error('brand name already exists');
    }

    const brand = new Brand(brandData);
    return await brand.save();
  } catch (error) {
    throw new Error(error.message);
  }
};




const updateBrand = async (id, reqBody) => {

      const { name, description, category, isActive, isListed, image } = reqBody;

  try {
        const brandData = {
      name: name.trim(),
      description: description?.trim() || '',
      category,
      isActive: isActive == 'true' || isActive === true,
      isListed: isListed == 'true' || isListed === true,
      image: image?.trim() || ''
    };

    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(brandData.name.trim(), 'i') }, _id: { $ne: id } });

    if (existingBrand) {
      throw new Error('Brand name already exists');
    }

    const brand = await Brand.findByIdAndUpdate(id, brandData, { new: true }).populate('category', 'name');

    if(brandData.isActive){
      const products = await productModel.updateMany({ brand: id  }, {$set: { isActive: true , isBrandActive: true } });
    }else{
      const products = await productModel.updateMany({ brand: id  }, {$set: { isActive: false , isBrandActive: false } });
    }
    
    return brand;
  } catch (error) {
    throw new Error(error.message);
  }
};





const toggleStatus = async (id, isActive) => {
  try {

    const brand = await Brand.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).populate('category', 'name');

    if(isActive == true){
      const products = await productModel.updateMany({ brand: id  }, {$set: { isActive: true , isBrandActive: true } });
    }else{
      const products = await productModel.updateMany({ brand: id  }, {$set: { isActive: false , isBrandActive: false } });
    }
    
    return brand;
  } catch (error) {
    throw new Error('Error toggling brand status');
  }
};

const toggleListed = async (id, isListed) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      id,
      { isListed },
      { new: true }
    ).populate('category', 'name');
    
    return brand;
  } catch (error) {
    throw new Error('Error toggling brand listed status');
  }
};

module.exports = {
  getAllBrands,
  getBrands,
  countBrands,
  getBrandById,
  createBrand,
  updateBrand,
  toggleStatus,
  toggleListed
};
