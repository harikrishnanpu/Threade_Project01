const express = require('express');
const adminReportRouter = express.Router();
const { getSalesReport, getSalesPdfReport, getSalesExcelReport } = require('../../controllers/admin/adminReportController');

adminReportRouter.get('/sales', getSalesReport);
adminReportRouter.get('/pdf/sales', getSalesPdfReport);
adminReportRouter.get('/excel/sales', getSalesExcelReport)


module.exports = adminReportRouter;
