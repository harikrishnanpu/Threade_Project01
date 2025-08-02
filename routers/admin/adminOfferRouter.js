const express = require('express');
const offerRouter = express.Router();
const offerController = require('../../controllers/admin/adminOfferController');
const path = require('path');

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

const upload = multer({ storage });


offerRouter.get('/', offerController.getOffersPage);

offerRouter.get('/api/filtered/all', offerController.getOffersListFiltered);
offerRouter.get('/api/offer/:id', offerController.getOffer);

offerRouter.get('/api/products', offerController.getProducts);
offerRouter.get('/api/categories',offerController.getCategories);

offerRouter.post('/create', upload.single('image'), offerController.createOffer);
offerRouter.put('/update/:id', upload.single('image'), offerController.updateOffer);

offerRouter.patch('/toggle-status/:id', offerController.toggleOfferStatus);

module.exports = offerRouter;
