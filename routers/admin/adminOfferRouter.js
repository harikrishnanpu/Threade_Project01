const express = require('express');
const offerRouter = express.Router();
const offerController = require('../../controllers/admin/adminOfferController');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/offers')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({ storage, fileFilter });


offerRouter.get('/', offerController.getOffersPage);
offerRouter.get('/api/offer/:id', offerController.getOffer);

offerRouter.get('/api/products', offerController.getProducts);
offerRouter.get('/api/categories',offerController.getCategories);

offerRouter.post('/create', upload.single('image'), offerController.createOffer);
offerRouter.put('/update/:id', upload.single('image'), offerController.updateOffer);

offerRouter.patch('/toggle-status/:id', offerController.toggleOfferStatus);

module.exports = offerRouter;
