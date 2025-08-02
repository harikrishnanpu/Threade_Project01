const express = require('express');
const {
  getInventoryPage,
  updateStock,
  getVariantProduct,
  getInventorypageList
} = require('../../controllers/admin/adminInventoryController');

const adminInventoryRouter = express.Router();

adminInventoryRouter.get('/', getInventoryPage);
adminInventoryRouter.get('/api/list', getInventorypageList);


adminInventoryRouter.post('/update-stock', updateStock);

adminInventoryRouter.get('/api/product/:id',  getVariantProduct);

module.exports = adminInventoryRouter;
