const express = require('express');
const bannerRouter = express.Router();
const path = require('path');
const fs = require('fs');
const { 
  listBanners, 
  apiBannerList, 
  createNewBanner, 
  getBannerDetails, 
  updateBannerById, 
  toggleBannerStatusById, 
  uploadBannerImage, 
  getBannersList
} = require('../../controllers/admin/bannerController');

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLODINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png']
  }
});

const upload = multer({ storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});




bannerRouter.get('/', listBanners);

bannerRouter.get('/api/filtered/all', getBannersList);
bannerRouter.get('/api/list', apiBannerList);
bannerRouter.get('/api/get/:id', getBannerDetails);
bannerRouter.post('/api/create', createNewBanner);
bannerRouter.put('/api/update/:id', updateBannerById);
bannerRouter.patch('/toggle-status/:id', toggleBannerStatusById);

bannerRouter.post('/upload-image', upload.single('image'), uploadBannerImage);

module.exports = bannerRouter;