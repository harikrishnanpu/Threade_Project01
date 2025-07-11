const express = require('express');
const bannerRouter = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  listBanners, 
  apiBannerList, 
  createNewBanner, 
  getBannerDetails, 
  updateBannerById, 
  toggleBannerStatusById, 
  uploadBannerImage 
} = require('../../controllers/admin/bannerController');


const uploadDir = 'uploads/banners/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});



bannerRouter.get('/', listBanners);

bannerRouter.get('/api/list', apiBannerList);
bannerRouter.get('/api/get/:id', getBannerDetails);
bannerRouter.post('/api/create', createNewBanner);
bannerRouter.put('/api/update/:id', updateBannerById);
bannerRouter.patch('/toggle-status/:id', toggleBannerStatusById);

bannerRouter.post('/upload-image', upload.single('image'), uploadBannerImage);

module.exports = bannerRouter;