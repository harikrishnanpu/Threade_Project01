const express = require('express');
const adminReportRouter = express.Router();
const { getSalesReport, getSalesPdfReport, getSalesExcelReport } = require('../../controllers/admin/adminReportController');
const { getListAdminDashboardContents } = require('../../controllers/admin/adminController');

adminReportRouter.get('/sales', getSalesReport);
adminReportRouter.get('/pdf/sales', getSalesPdfReport);
adminReportRouter.get('/excel/sales', getSalesExcelReport);

adminReportRouter.get('/api/filtered/all', getListAdminDashboardContents)


module.exports = adminReportRouter;
