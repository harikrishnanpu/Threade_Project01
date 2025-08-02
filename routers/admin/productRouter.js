const express = require('express');
const productRouter = express.Router();
const path = require('path');
const { 
  listProducts, 
  ApilistProducts, 
  createNewProduct, 
  updateProductById,
  getProductById,
  toggleProductStatus,
  toggleProductFeatured,
  uploadProductImage,
  showCreateProductPage,
  showEditProductPage,
  getProductsFilteredList
} = require('../../controllers/admin/productController');
const { createProductValidator } = require('../../validators/bodyValidator');
const { handleValidationErrors } = require('../../validators/validator');
const { validateProductId } = require('../../validators/ParamValidator');
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


productRouter.get('/all', listProducts);
productRouter.get('/create', showCreateProductPage);
productRouter.get('/edit/:id', validateProductId, handleValidationErrors, showEditProductPage);

productRouter.get('/api/all', ApilistProducts);
productRouter.get('/api/product/:id', validateProductId, handleValidationErrors, getProductById);
productRouter.get('/api/all', getProductsFilteredList)

productRouter.post('/api/create',createProductValidator, handleValidationErrors, createNewProduct);
productRouter.put('/api/update/:id', validateProductId, createProductValidator , handleValidationErrors , updateProductById);
productRouter.patch('/toggle-status/:id',validateProductId, handleValidationErrors, toggleProductStatus);
productRouter.patch('/toggle-featured/:id', validateProductId,  handleValidationErrors, toggleProductFeatured);
productRouter.post('/upload-image', upload.single('image'), uploadProductImage);

module.exports = productRouter;