const Banner = require('../models/bannerModel');
const { getAllBannerListQuery } = require('../utils/queries/getAllBannerQuery');

const getAllBanners = async (query) => {

  const {  
    filter,
    page,
    limit,
    skip,
    sort,
    status,
    finalSortField,
    finalSortOrder,
    trimmedSearch
   } = await getAllBannerListQuery(query)


    const [banners, total] = await Promise.all([
    Banner.find(filter)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Banner.countDocuments(filter)
  ]);

  const uniquePages = await Banner.distinct('page');

  return {
    data: banners,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
    filters: {
      search: trimmedSearch,
      status,
      pageFilter: filter.page
    },
    sortField: finalSortField,
    sortOrder: finalSortOrder === 1 ? 'asc' : 'desc', 
    uniquePages
  };
};

const getPageWiseBanner = async (page='home',limit=3) =>{
  try{
    const banners = await Banner.find({ page: page, isActive: true }).sort({createdAt: -1}).limit(limit);
    return banners
  }catch(err){
    throw new Error(err.message);
  }
}

const createBanner = async (data) => {
  try {
    const banner = new Banner({
      name: data.name.trim(),
      description: data.description?.trim(),
      page: data.page.trim(),
      image: data.image,
      buttonText: data.buttonText?.trim(),
      buttonLink: data.buttonLink?.trim(),
      isActive: Boolean(data.isActive),
      isListed: Boolean(data.isListed),
      createdBy: data.createdBy
    });

    return await banner.save();
  } catch (error) {
    throw new Error(`Failed to create banner: ${error.message}`);
  }
};

const getBannerById = async (id) => {
  try {
    const banner = await Banner.findById(id).populate('createdBy', 'name email');
    if (!banner) {
      throw new Error('Banner not found');
    }
    return banner;
  } catch (error) {
    throw new Error(`Failed to retrieve banner: ${error.message}`);
  }
};

const updateBanner = async (id, data) => {
  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new Error('Banner not found');
    }

    // Update only the fields that are provided
    if (data.name !== undefined) banner.name = data.name.trim();
    if (data.description !== undefined) banner.description = data.description?.trim();
    if (data.page !== undefined) banner.page = data.page.trim();
    if (data.image !== undefined) banner.image = data.image;
    if (data.buttonText !== undefined) banner.buttonText = data.buttonText?.trim();
    if (data.buttonLink !== undefined) banner.buttonLink = data.buttonLink?.trim();
    if (data.isActive !== undefined) banner.isActive = Boolean(data.isActive);
    if (data.isListed !== undefined) banner.isListed = Boolean(data.isListed);

    return await banner.save();
  } catch (error) {
    throw new Error(`Failed to update banner: ${error.message}`);
  }
};


const toggleBannerStatus = async (id, isActive) => {
  try {
    const banner = await Banner.findById(id);
    if (!banner) {
      throw new Error('Banner not found');
    }
    
    banner.isActive = isActive ? false : true;
    return await banner.save();
  } catch (error) {
    throw new Error(`Failed to update banner status: ${error.message}`);
  }
};

module.exports = {
  getAllBanners,
  createBanner,
  getBannerById,
  updateBanner,
  toggleBannerStatus,
  getPageWiseBanner
};