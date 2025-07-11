const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const brandController = require('../../controllers/admin/brandController');
const { validateBrandListQuery } = require('../../validators/QueryValidator');
const { handleValidationErrors } = require('../../validators/validator');
const { validateBrandIdParam } = require('../../validators/ParamValidator');
const { validateBrandBody } = require('../../validators/bodyValidator');

const uploadDir = 'uploads/brands';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `brand-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});



const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('invalid file type. Only JPG, PNG, and WebP are allowed.'));
};



const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
  onError: (err, next) => {
    console.error('Multer error:', err);
    next(err);
  }
});

router.get('/all', validateBrandListQuery,handleValidationErrors, brandController.renderAllBrands);

router.get('/api/all',validateBrandListQuery, handleValidationErrors, brandController.getAllBrands);
router.get('/api/brand/:id',validateBrandIdParam, handleValidationErrors, brandController.getBrandById);

router.post('/api/create',validateBrandBody, brandController.createBrand);
router.put('/api/update/:id',validateBrandBody, brandController.updateBrand);

router.post('/api/upload-image', upload.single('image'), brandController.uploadImage);
router.patch('/toggle-status/:id', validateBrandIdParam, handleValidationErrors, brandController.toggleBrandStatus);
router.patch('/toggle-listed/:id', validateBrandIdParam, handleValidationErrors, brandController.toggleBrandListed);




module.exports = router;