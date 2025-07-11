const express = require('express');
const categoryRouter = express.Router();
const { 
  listCategories, 
  ApilistCategories, 
  createNewCategory, 
  updateCategoryById,
  getCategoryById,
  toggleCategoryStatus
} = require('../../controllers/admin/categoryController');
const { handleValidationErrors } = require('../../validators/validator');
const { validateListCategoryQuery } = require('../../validators/QueryValidator');
const { validateCategoryIdParam } = require('../../validators/ParamValidator');
const { validateCategoryBody } = require('../../validators/bodyValidator');


categoryRouter.get('/all', validateListCategoryQuery, handleValidationErrors, listCategories);
categoryRouter.get('/api/all',validateListCategoryQuery,handleValidationErrors, ApilistCategories);
categoryRouter.get('/api/category/:id', validateCategoryIdParam,handleValidationErrors, getCategoryById);


categoryRouter.post('/create',validateCategoryBody,handleValidationErrors, createNewCategory);
categoryRouter.put('/update/:id',validateCategoryIdParam,handleValidationErrors, updateCategoryById);
categoryRouter.patch('/toggle-status/:id',validateCategoryIdParam,handleValidationErrors, toggleCategoryStatus);

module.exports = categoryRouter;