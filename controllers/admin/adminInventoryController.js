const adminInventoryServices = require('../../services/adminInventoryService');


const getInventoryPage = async (req, res) => {
  try {

    const inventory  = await adminInventoryServices.listInventory(req.query);
    const stockRegistry = await adminInventoryServices.listStockHistory();

    const categories = [];

    console.log(inventory);
    

    res.render('admin/inventory', {
      inventory  : inventory.data.items,
      totalItems   : inventory.data.total,
      totalPages : Math.ceil(inventory.data.total / 10),
      currentPage  : parseInt(req.query.page) || 1,
      stockHistory : stockRegistry.success ? stockRegistry.data : [],
      status : req.query.status  || 'all',
      categoryFilter : req.query.categoryFilter || 'all',
      sortField    : req.query.sortField  || 'lastUpdated',
      sortOrder  : req.query.sortOrder || 'desc',
      search  : req.query.search    || '',
      showLowStock  : req.query.showLowStock  || false,
      categories
    });


  } catch(err) {
    console.log(err);
    res.status(500).json({message: err.message})
  }
};

const getVariantProduct = async (req, res) =>{
    try{
        const product = await adminInventoryServices.getProductById(req.params.id)
        res.status(200).json({product});
    }catch(err){
        res.status(500).json({message: err.message})
    }

}

const updateStock = async (req, res) => {
    try{

        const payload = { ...req.body, updatedBy: req.admin?.name  };
        res.status(200).json(await adminInventoryServices.updateStock(payload));
    }catch(err){
        res.status(500).json({ message: err.message })
    }
};


module.exports = { getInventoryPage, getVariantProduct, updateStock };
