const express = require('express');
const adminReportRouter = express.Router();
const { getSalesReport } = require('../../controllers/admin/adminReportController');

adminReportRouter.get('/sales', getSalesReport);

module.exports = adminReportRouter;
