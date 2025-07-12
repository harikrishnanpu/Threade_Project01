const Category = require("../models/categoryModel");
const productModel = require("../models/productModel");
const {
  getAllCategoriesQuery,
} = require("../utils/queries/getAllCategoryQuery");

const getAllCategories = async (query) => {
  const {
    filter,
    sort,
    page,
    limit,
    search,
    status,
    isFeatured,
    showInactive,
    parentFilter,
  } = getAllCategoriesQuery(query);

  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    Category.find(filter)
      .populate("parentCategory", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Category.countDocuments(filter),
  ]);

  return {
    data: categories,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    limit,
    filters: {
      search,
      status,
      isFeatured,
      showInactive,
      parentFilter,
    },
    sortField: Object.keys(sort)[0],
    sortOrder: Object.values(sort)[0] === 1 ? "asc" : "desc",
  };
};

const insertOneCategory = async (body) => {
  const {
    name,
    description,
    parentCategory = null,
    isActive = "on",
    isFeatured = "on",
    createdBy,
  } = body;

  try {
    const existingCategory = await Category.findOne({
      name: name.trim(),
      ...(parentCategory && { parentCategory }),
    });

    if (existingCategory) {
      throw new Error("Category with this name already exists");
    }

    const newCat = new Category({
      name: name.trim(),
      description: description?.trim(),
      parentCategory: parentCategory || null,
      isActive: isActive == "on" ? true : false,
      isFeatured: isFeatured == "on" ? true : false,
      createdBy,
    });

    return await newCat.save();
  } catch (err) {
    throw new Error(err.message);
  }
};

const findOneCategoryById = async (catId) => {
  try {
    const categoryData = await Category.findById(catId).populate(
      "parentCategory",
      "name"
    );

    if (!categoryData) {
      throw new Error("Category not found");
    }

    return categoryData;
  } catch (err) {
    throw new Error(err.message);
  }
};

const editCategoryById = async (catId, body) => {

  const {
    name,
    description,
    parentCategory,
    isActive,
    isFeatured,
    createdBy,
  } = body;

  try {

    const cat = await Category.findById(catId);

    if (!cat) throw new Error("category not found");

    const trimmedDescription = description?.trim();

    if (name &&  name !== cat.name) {

      let query = {
        name: name.trim(),
        _id: { $ne: catId }
      };

if (parentCategory) {
  query.parentCategory = parentCategory;
}

      const existingCategory = await Category.findOne(query);

      if (existingCategory) {
        throw new Error("another category with this name already exists");
      }

    }

    if (parentCategory && parentCategory.toString() === catId.toString()) {
      throw new Error("category cannot be its own parent");
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (trimmedDescription !== undefined) updateData.description = trimmedDescription;
    if (parentCategory !== undefined)updateData.parentCategory = parentCategory || null;

    if (isActive !== undefined) {


      const isActiveCat = isActive == 'on';

      updateData.isActive = isActiveCat;

      if (!isActiveCat) {

        const subCategoiries = await Category.find({ parentCategory: cat._id });

        const subCategoiryIds = subCategoiries.map(cat => cat._id);

       const updatedProds = await productModel.updateMany(

        {category: {$in: [  cat._id, ...subCategoiryIds   ] } },
        {$set: {isActive: false,'variants.$[].isActive': false}}
      );


for (let subCat of subCategoiries) {
  subCat.isActive = false;
  await subCat.save();
}


        console.log("jknfck f");
        

        console.log(updatedProds);
        
      }else{


        const subCategoiries = await Category.find({ parentCategory: cat._id  });

        const subCategoryIds = subCategoiries.map(cat =>  cat._id);

        const updateProds = await productModel.updateMany(
          { category: { $in: [cat._id, ...subCategoryIds ] } },
          { $set: { isActive: true, 'variants.$[].isActive' : true } }
        )


for (let subCat of subCategoiries) {
  subCat.isActive = true;
  await subCat.save();
}



      }



    }

    if (isFeatured !== undefined) {
      updateData.isFeatured = isFeatured == 'on';
    }

    if (createdBy !== undefined) updateData.createdBy = createdBy;

    Object.assign(cat, updateData);
    return await cat.save();
  } catch (err) {
    throw new Error(err.message);
  }
};


const toggleCategoryStatusById = async (catId, isActive) => {

  try {

    const category = await Category.findById(catId);


    if (!category) {
      throw new Error("category not found");
    }
    
    isActive = isActive == "true" ? false : true;


    if(isActive){


  const subCategoiries = await Category.find({ parentCategory: category._id  });

  const subCategoryIds = subCategoiries.map(cat =>  cat._id);

  // const updateProds = await productModel.updateMany(
  //         { category: { $in: [category._id, ...subCategoryIds ] } },
  //         { $set: { isActive: true, 'variants.$[].isActive' : true } }
  //       )


for (let subCat of subCategoiries) {
  subCat.isActive = true;
  await subCat.save();
}

    }else{



  const subCategoiries = await Category.find({ parentCategory: category._id  });

  const subCategoryIds = subCategoiries.map(cat =>  cat._id);

  // const updateProds = await productModel.updateMany(
  //         { category: { $in: [category._id, ...subCategoryIds ] } },
  //         { $set: { isActive: false, 'variants.$[].isActive' : false } }
  //       )


for (let subCat of subCategoiries) {
  subCat.isActive = false;
  await subCat.save();
}



    }

    category.isActive = isActive;

    return await category.save();
    
  } catch (err) {
    throw new Error(err.message);
  }

};

module.exports = {
  getAllCategories,
  insertOneCategory,
  findOneCategoryById,
  editCategoryById,
  toggleCategoryStatusById,
};
