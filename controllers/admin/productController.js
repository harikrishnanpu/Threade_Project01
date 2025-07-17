const { 
  getAllProducts, 
  insertOneProduct, 
  findOneProductById, 
  editProductById,
  deleteProductById,
  toggleProductStatusById,
  toggleProductFeaturedById
} = require("../../services/productServices");
const { getAllCategories } = require("../../services/categoryService");
const { getAllBrands } = require("../../services/brandServices");




const listProducts = async (req, res) => {
  try {
    const [categoriesResult, brandsResult] = await Promise.all([
      getAllCategories({ status: 'active', limit: 1000 }),
      getAllBrands({ status: 'active', limit: 1000 })
    ]);
  
    const {
      data,
      total,
      currentPage,
      totalPages,
      limit,
      filters,
      sortField,
      sortOrder
    } = await getAllProducts(req.query);

    

    res.render('admin/allProducts', {
      products: data,
      totalProducts: total,
      totalPages,
      currentPage,
      limit,
      search: filters.search,
      status: filters.status,
      categoryFilter: filters.categoryFilter,
      brandFilter: filters.brandFilter,
      categories: categoriesResult.data,
      brands: brandsResult,
      sortField,
      sortOrder,
      messages: []
    });
  } catch (error) {
    next(error)
  }
};



const getProductsFilteredList = async (req, res) => {
  try {
    const [categoriesResult, brandsResult] = await Promise.all([
      getAllCategories({ status: 'active', limit: 1000 }),
      getAllBrands({ status: 'active', limit: 1000 })
    ]);

    const result = await getAllProducts(req.query);
    if (!result) throw new Error('Failed to fetch products');

    const {
      data,
      total,
      currentPage,
      totalPages,
      limit,
      filters,
      sortField,
      sortOrder
    } = result;

    const sortOrderForFrontend = sortOrder === -1 ? 'desc' : 'asc';

    res.status(200).json({
      success: true,
      products: data || [],
      totalProducts: total || 0,
      totalPages: totalPages || 0,
      currentPage: currentPage || 1,
      limit: limit || 10,
      search: filters?.search || '',
      status: filters?.status || 'all',
      categoryFilter: filters?.categoryFilter || 'all',
      brandFilter: filters?.brandFilter || 'all',
      categories: categoriesResult.data || [],
      brands: brandsResult.data || [],
      sortField: sortField || 'createdAt',
      sortOrder: sortOrderForFrontend,
      message: null // Optional message for success
    });
  } catch (error) {
    console.error('Error in getProductsFilteredList:', error);

    res.status(500).json({
      success: false,
      products: [],
      totalProducts: 0,
      totalPages: 0,
      currentPage: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || '',
      status: req.query.status || 'all',
      categoryFilter: req.query.categoryFilter || 'all',
      brandFilter: req.query.brandFilter || 'all',
      categories: [],
      brands: [],
      sortField: req.query.sortField || 'createdAt',
      sortOrder: 'desc',
      message: error.message || 'Failed to load products. Please try again.'
    });
  }
};


const showCreateProductPage = async (req, res) => {
  try {

    const [categoriesResult, brandsResult] = await Promise.all([
      getAllCategories({ status: 'active', limit: 1000 }),
      getAllBrands({ status: 'active', limit: 1000 })
    ]);

    res.render('admin/createProduct', {
      categories: categoriesResult.data,
      brands: brandsResult,
      messages: []
    });
  } catch (error) {
    res.redirect('/admin/products/all');
  }
};

const showEditProductPage = async (req, res) => {
  try {
    const { id } = req.params;
    
    
    const [product, categoriesResult, brandsResult] = await Promise.all([
      findOneProductById(id),
      getAllCategories({ status: 'active', limit: 100}),
      getAllBrands({ status: 'active', limit: 100 })
    ]);

    res.render('admin/editProduct', {
      product,
      categories: categoriesResult.data,
      brands: brandsResult,
      messages: []
    });


  } catch (error) {
    console.error('Error loading edit product page:', error);
    res.redirect('/admin/products/all');
  }
};

const ApilistProducts = async (req, res) => {
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
    } = await getAllProducts(req.query);

    res.status(200).json({
      success: true,
      data: data,
      totalProducts: total,
      totalPages,
      currentPage,
      limit,
      search: filters.search,
      status: filters.status,
      categoryFilter: filters.category,
      brandFilter: filters.brand,
      sortField,
      sortOrder
    });
  } catch (error) {

    console.log(error);

    res.status(500).json({ message: error.message, success: false });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await findOneProductById(id);
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(404).json({ message: err.message, success: false });
  }
};

const updateProductById = async (req, res) => {
  const { id } = req.params;

  try {

    const updateData = {
      ...req.body,
      createdBy: req.admin._id
    };
    

    const updatedProduct = await editProductById(id, updateData);

    res.status(200).json({
      message: 'Product updated successfully', 
      success: true, 
      data: updatedProduct,
    });

  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

const createNewProduct = async (req, res) => {

  try {

    const productData = {
      ...req.body,
      createdBy: req.admin._id,
    };

    // console.log(req.body);
    

    const newProduct = await insertOneProduct(productData);
    res.status(201).json({
      message: 'Product created successfully', 
      success: true, 
      data: newProduct
    });

  } catch (err) {

    res.status(500).json({ message: err.message, success: false });

  }
};

const toggleProductStatus = async (req, res) => {

  const { id } = req.params;
  const { active } = req.body;
  
  try {

    const updatedProduct = await toggleProductStatusById(id, active);
    res.status(200).json({
      message: `Product ${active ? 'activated' : 'deactivated'} successfully`,
      success: true,
      data: updatedProduct
    });

  } catch (err) {

    res.status(500).json({ message: err.message, success: false });
    
  }
};

const toggleProductFeatured = async (req, res) => {
  const { id } = req.params;
  const { featured } = req.body;
  
  try {
    const updatedProduct = await toggleProductFeaturedById(id, featured);
    res.status(200).json({
      message: `Product ${featured ? 'featured' : 'unfeatured'} successfully`,
      success: true,
      data: updatedProduct
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};



const uploadProductImage = async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({success: false,message: 'no image file provided' });
    }
    
    const imageUrl = req.file.path;
    
    res.status(200).json({success: true,message:'sucess',imageUrl: imageUrl});

  } catch (err) {
    // console.log(err);

    res.status(500).json({success: false, message: err.message});
  }


};


module.exports = { 
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
};