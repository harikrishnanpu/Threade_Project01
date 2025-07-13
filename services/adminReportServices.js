const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Category = require('../models/categoryModel');


const getSalesReport = async (req,res) => { 

    try{

        const result = await Order.find({}).populate('user' , 'name email').populate()

        // console.log(result);
        
        return false;

    }catch(err){
        throw new Error(err.message)
    }


}


getSalesReport();

module.exports = { getSalesReport };
