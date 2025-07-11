


const flattenVariants = (product) =>
  product.variants.map((v) => ({
    productId : product._id,
    variantId : v._id,
    name  : product.name,
    size    : v.size,
    color : v.color,
    price   : v.price,
    salePrice  : v.salePrice,
    currentStock: v.stock,
    category : product.category.name,  
    isActive : v.isActive,        
    lastUpdated : product.updatedAt
  }));


module.exports = { flattenVariants };