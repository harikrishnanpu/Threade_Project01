const express = require('express');
const router = express.Router();
const brandController = require('../../controllers/admin/brandController');
const { validateBrandListQuery } = require('../../validators/QueryValidator');
const { handleValidationErrors } = require('../../validators/validator');
const { validateBrandIdParam } = require('../../validators/ParamValidator');
const { validateBrandBody } = require('../../validators/bodyValidator');
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

router.get('/all', validateBrandListQuery,handleValidationErrors, brandController.renderAllBrands);


router.get('/api/filtered/all', validateBrandListQuery,handleValidationErrors, brandController.getFilteredBrands);
router.get('/api/all',validateBrandListQuery, handleValidationErrors, brandController.getAllBrands);
router.get('/api/brand/:id',validateBrandIdParam, handleValidationErrors, brandController.getBrandById);

router.post('/api/create',validateBrandBody, brandController.createBrand);
router.put('/api/update/:id',validateBrandBody, brandController.updateBrand);

router.post('/api/upload-image', upload.single('image'), brandController.uploadImage);
router.patch('/toggle-status/:id', validateBrandIdParam, handleValidationErrors, brandController.toggleBrandStatus);




module.exports = router;