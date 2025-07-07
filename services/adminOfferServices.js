const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel');
const Product= require('../models/productModel');



const updateAllProductSalePrices = async () => {
  try {
    const offers = await Offer.find({ isActive: true });
    // console.log(offers.map(o => o));

    const products = await Product.find({ isActive: true }).populate('category');

    let updatedCount = 0;

    for (const product of products) {

      const productCategoryId = product.category._id.toString();
      const parentCategoryId = product.category.parentCategory?.toString();
      const productId = product._id.toString();

      const matchedOffers = offers.filter(offer => {
        const matchProduct = offer.products.some(prod => prod.toString() == productId);

        const matchCategory = offer.categories.some(id => {
          const cid = id.toString();
          return cid == productCategoryId || cid == parentCategoryId;
        });

        return matchProduct || matchCategory;
      });

      console.log(matchedOffers);
      

      let isUpdated = false;

      for (const variant of product.variants) {

        if (!variant.isActive) continue;

        let bestDiscountAmount = 0;

        if (matchedOffers.length > 0) {

          for (const offer of matchedOffers) {

            const maxDiscount = offer.maxDiscountAmount || 0;

            const discountAmount = (variant.price * offer.discount) / 100;

            let finalDiscount = discountAmount;

            if(maxDiscount !== 0){  
             finalDiscount = Math.min(discountAmount , maxDiscount);
            }

            if (finalDiscount > bestDiscountAmount) {
              bestDiscountAmount = finalDiscount;
            }

          }

        }

        const newSalePrice = bestDiscountAmount > 0 ? variant.price - bestDiscountAmount : variant.price;

        if (variant.salePrice !== newSalePrice){  
          variant.salePrice = newSalePrice;
          isUpdated = true;
        }

      }

      if (isUpdated) {
        await product.save();
        updatedCount++;
      }

    }

    console.log("UPDATEDCOUNT",updatedCount);
    

    return { success: true, updatedCount };
  } catch (err) {
    // console.log(err);

    throw new Error(err.message);
  }
};



const createOffer = async (data) => {
  try {
    console.log(data);

 const { title, description, discount, maxDiscountAmount, applicableOn, startDate, endDate, isActive, products, categories   } = data;

    if(!title || !discount || !applicableOn){
      throw new Error('all fields are required')
    }

    if(parseInt(discount) > 90){
      throw new Error('discont not greater than 90')
    }


    const offer = await Offer.create({
        title,
        description,
        discount,
        maxDiscountAmount,
        applicableOn,
        startDate,
        endDate,
        products,
        categories,        
        isActive: isActive == "on" ? true : false

       });


       return offer

  } catch (err) {
    throw new Error(err.message);
  }


};

const updateOffer = async (id, data) => {
  try {
    console.log(data);

    const { title, description, discount, maxDiscountAmount, applicableOn, startDate, endDate, isActive, products, categories   } = data;

    if(!title || !discount || !applicableOn){
      throw new Error('all fields are required')
    }

    if(parseInt(discount) > 90){
      throw new Error('discont not greater than 90')
    }


    const offer = await Offer.findByIdAndUpdate(id,
       {
        title,
        description,
        discount,
        maxDiscountAmount,
        applicableOn,
        startDate,
        endDate,
        products,
        categories,        
        isActive: isActive == "on" ? true : false

       }, { new: true });


      //  console.log("Updfated", updatedCount)

    return offer;
  } catch (err) {
    throw new Error(err.message);
  }
};



const toggleOfferStatus = async (id, active) => {
  try {
    const offer = await Offer.findByIdAndUpdate(id, { isActive: active }, { new: true });
    return offer;
  } catch (err) {
    throw new Error(err.message);
  }
};


const getOfferById = async (id) => {
  try {
    const offer = await Offer.findById(id);
    return offer;
  } catch (err) {
    throw new Error(err.message);
  }
};


const searchProducts = async (query) => {
  try {
    let { search = '', page = 1, limit = 10 } = query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).select('_id name price').sort({ name: 1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      hasMore: skip + products.length < total,
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


const searchCategories = async (query) => {
  try {
    let { search = '', page = 1, limit = 10 } = query;

    page = parseInt(page);
    limit = parseInt(limit);

    const filter = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const skip = (page - 1) * limit;

    const [categories, total] = await Promise.all([
      Category.find(filter).select('_id name description')
      .sort({ name: 1 }).skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    return {
      categories,
      hasMore: skip + categories.length < total,
    };
  } catch (err) {
    throw new Error(err.message);
  }
};


const listOffers = async (query) => {
  try {
    let {
      page = 1,
      limit = 10,
      status = 'all',
      applicableFilter = 'all',
      sortField = 'createdAt',
      sortOrder = 'desc',
      search = '',
      showExpired = false,
    } = query;

    page = parseInt(page);
    limit = parseInt(limit);

    const now = new Date();
    const filter = {};

    switch (status) {
      case 'active':
        filter.isActive = true;
        filter.startDate = { $lte: now };
        filter.endDate = { $gte: now };
        break;
      case 'inactive':
        filter.isActive = false;
        break;
      case 'expired':
        filter.endDate = { $lt: now };
        break;
      case 'upcoming':
        filter.startDate = { $gt: now };
        break;
      default:
        if (!showExpired) filter.endDate = { $gte: now };
    }

    if (applicableFilter !== 'all') filter.applicableOn = applicableFilter;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [offers, totalOffers] = await Promise.all([
      Offer.find(filter).sort(sort).skip(skip).limit(limit),
      Offer.countDocuments(filter),
    ]);

    return {
      offers,
      totalOffers,
      totalPages: Math.ceil(totalOffers / limit),
      currentPage: page,
    };
  } catch (err) {
    throw new Error(err.message);
  }
}





module.exports = {
  createOffer,
  updateOffer,
  updateAllProductSalePrices,
  toggleOfferStatus,
  getOfferById,
  listOffers,
  searchProducts,
  searchCategories
};
