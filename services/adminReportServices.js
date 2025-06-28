const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Category = require('../models/categoryModel');


const getSalesReport = async (req,res) => { 

    try{


        
        return false;

    }catch(err){
        throw new Error(err.message)
    }


}

module.exports = { getSalesReport };
