const { 
  getAllCategories, 
  insertOneCategory, 
  findOneCategoryById, 
  editCategoryById,
  toggleCategoryStatusById,
} = require("../../services/categoryService");

const listCategories = async (req, res) => {
  try {
    const {
      data,
      total,
      currentPage,
      totalPages,
      limit,
      filters,
      sortField,
      sortOrder
    } = await getAllCategories(req.query);

    res.render('admin/allCategories', {
      categories: data,
      totalCategories: total,
      totalPages,
      currentPage,
      limit,
      search: filters.search,
      status: filters.status,
      showFeatured: filters.isFeatured,
      parentFilter: filters.parentFilter,
      sortField,
      sortOrder,
      showInactive: filters.showInactive
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const ApilistCategories = async (req, res) => {
  try {
    const {
      data,
      total,
      currentPage,
      totalPages,
      limit,
      filters,
      sortField,
      sortOrder
    } = await getAllCategories(req.query);

    res.status(200).json({
      success: true,
      data: data,
      totalCategories: total,
      totalPages,
      currentPage,
      limit,
      search: filters.search,
      status: filters.status,
      showFeatured: filters.isFeatured,
      parentFilter: filters.parentFilter,
      showInactive: filters.showInactive,
      sortField,
      sortOrder
    });
  } catch (error) {
    console.error('Error listing categories:', error);
    res.status(500).json({ message: 'Internal Server Error', success: false });
  }
};

const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await findOneCategoryById(id);
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(404).json({ message: err.message, success: false });
  }
};


const createNewCategory = async (req, res) => {
  try {

    console.log(req.body);
    

    const createCategory = await insertOneCategory(req.body);
    res.status(201).json({message: 'created successfully', 
      success: true, 
      data: createCategory
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const updateCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const errors = validateCategoryInput(req.body);
    
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'validation failed', 
        errors 
      });
    }

    const updatedCategory = await editCategoryById(id, req.body);
    res.status(200).json({message: 'updated successfully', success: true, data: updatedCategory
    });

  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};



const toggleCategoryStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  console.log(active);
  

  try {
    const updatedCategory = await toggleCategoryStatusById(id, active);
    res.status(200).json({message: 'success', success: true,data: updatedCategory});
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};


const validateCategoryInput = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Category name is required';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Category name cannot exceed 100 characters';
  }
  
  if (data.description && data.description.trim().length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }
  
  return errors;
};

module.exports = { 
  listCategories, 
  ApilistCategories, 
  createNewCategory, 
  updateCategoryById,
  getCategoryById,
  toggleCategoryStatus,
};