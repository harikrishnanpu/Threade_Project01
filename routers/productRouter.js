const express = require('express');
const productRouter = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  listProducts, 
  ApilistProducts, 
  createNewProduct, 
  updateProductById,
  getProductById,
  toggleProductStatus,
  toggleProductFeatured,
  deleteProduct,
  uploadProductImage,
  showCreateProductPage,
  showEditProductPage
} = require('../controllers/productController');
const { createProductValidator } = require('../validators/bodyValidator');
const { handleValidationErrors } = require('../validators/validator');
const { validateProductId } = require('../validators/ParamValidator');


const uploadDir = 'uploads/products/';


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
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


productRouter.get('/all', listProducts);
productRouter.get('/create', showCreateProductPage);
productRouter.get('/edit/:id', validateProductId, handleValidationErrors, showEditProductPage);

productRouter.get('/api/all', ApilistProducts);
productRouter.get('/api/product/:id', validateProductId, handleValidationErrors, getProductById);

productRouter.post('/api/create',createProductValidator, handleValidationErrors, createNewProduct);
productRouter.put('/api/update/:id', validateProductId, createProductValidator , handleValidationErrors , updateProductById);
productRouter.patch('/toggle-status/:id',validateProductId, handleValidationErrors, toggleProductStatus);
productRouter.patch('/toggle-featured/:id', validateProductId,  handleValidationErrors, toggleProductFeatured);
productRouter.post('/upload-image', upload.single('image'), uploadProductImage);

module.exports = productRouter;