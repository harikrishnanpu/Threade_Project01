const express = require('express');
const {
  getInventoryPage,
  updateStock,
  getVariantProduct
} = require('../../controllers/admin/adminInventoryController');

const adminInventoryRouter = express.Router();

adminInventoryRouter.get('/', getInventoryPage);

adminInventoryRouter.post('/update-stock', updateStock);

adminInventoryRouter.get('/api/product/:id',  getVariantProduct);

module.exports = adminInventoryRouter;
