const Order = require('../../models/orderModel');
const puppeteer = require('puppeteer');
const moment = require('moment');
const ExcelJS = require('exceljs');





const getSalesReport = async (req, res) => {

  try {

    let {
      page = 1,
      dateRange = 'month',
      status = 'all',
      paymentMethod = 'all',
      category = 'all',
      sortField = 'createdAt',
      sortOrder = 'desc',
      startDate = '',
      endDate = '',
      limit = 10
    } = req.query;

    page = parseInt(page);

    const filters = {};

    const now = new Date();
    let from, to;

    if (dateRange && dateRange !== 'custom') {
      to = new Date();

      switch (dateRange) {
        case 'today':
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          from = new Date(now.setDate(now.getDate() - 1));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setHours(23, 59, 59);
          break;
        case 'week':
          from = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last-week':
          from = new Date(now.setDate(now.getDate() - 14));
          to = new Date(now.setDate(now.getDate() + 7));
          break;
        case 'month':
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'year':
          from = new Date(now.getFullYear(), 0, 1);
          break;
      }


    } else if (dateRange === 'custom' && startDate && endDate) {
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      to = new Date(endDate);
      to.setHours(23, 59, 59);
    }

    if (from && to) {
      filters.createdAt = { $gte: from, $lte: to };
    }

    if (status !== 'all') {
      filters.orderStatus = status;
    }

    if (paymentMethod !== 'all') {
      filters.paymentMethod = paymentMethod;
    }


    const totalOrderDateWise = await Order.find(filters).populate('user','name email').populate('items.productId').lean();    

    const orders = await Order.find(filters).sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 }).skip((page - 1) * limit)
    .limit(limit).populate('user', 'name email').lean();

    const totalRecords = totalOrderDateWise.length;
    const totalSales = totalOrderDateWise.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = totalOrderDateWise.length;
    const totalDiscounts = totalOrderDateWise.reduce((sum, o) =>  sum + (o?.coupon?.discountAmount || 0), 0);


    const salesTrendMap = new Map();

    for (const order of totalOrderDateWise) {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      salesTrendMap.set(date, ( salesTrendMap.get(date) || 0) + order.totalAmount );
    }

    const salesTrend = {
      labels: [...salesTrendMap.keys()],
      data: [...salesTrendMap.values()]
    };

    const paymentMap = {};

    for (const order of totalOrderDateWise) {
      const method = order.paymentMethod;
      paymentMap[method] = (paymentMap[method] || 0) + 1;
    }

    const paymentMethods = {
      labels: Object.keys(paymentMap),
      data: Object.values(paymentMap)
    };


    const totalPages = Math.ceil(totalRecords / limit);

    res.render('admin/salesReport', {
      totalSales,
      totalOrders,
      totalDiscounts,
      chartData: {
        salesTrend,
        paymentMethods
      },
      salesData: orders,
      dateRange,
      status,
      paymentMethod,
      category,
      startDate,
      endDate,
      currentPage: page,
      totalPages,
      totalRecords,
      sortField,
      sortOrder
    });

  } catch (err) {
    console.log('Error in getSalesReport:', err.message);
    res.status(500).send('Server Error');
  }
};




const getSalesPdfReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      dateRange = 'month',
      status,
      paymentMethod,
      category
    } = req.query;

    const filters = {};

    const now = new Date();
    let from, to;


    if (dateRange && dateRange !== 'custom') {
      to = new Date();


      switch (dateRange) {
        case 'today':
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          from = new Date(now.setDate(now.getDate() - 1));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setHours(23, 59, 59);
          break;
        case 'week':
          from = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last-week':
          from = new Date(now.setDate(now.getDate() - 14));
          to = new Date(now.setDate(now.getDate() + 7));
          break;
        case 'month':
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'year':
          from = new Date(now.getFullYear(), 0, 1);
          break;
      }


    } else if (dateRange === 'custom' && startDate && endDate) {
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      to = new Date(endDate);
      to.setHours(23, 59, 59);
    }

   if (from && to) {
      filters.createdAt = { $gte: from, $lte: to };
    }


    if (status && status !== 'all') {
      filters.orderStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filters.paymentMethod = paymentMethod;
    }

    let orders = await Order.find(filters)
      .populate('user', 'name email')
      .populate('items.productId', 'name brand category')
      .lean();


    const html = await new Promise((resolve, reject) => {
      res.render('admin/sales-report-pdf', {
        orders,
        moment,
        filters: { startDate: moment(from).format('DD-MM-YYYY'), endDate: moment(to).format('DD-MM-YYYY'), status, paymentMethod, category },
        generatedDate: moment().format('YYYY-MM-DD'),
        noFooter: true,
        noSidebar: true
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });


    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.pdf"');
    res.send(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



const getSalesExcelReport = async (req, res) => {

  try {
    const {
      startDate,
      endDate,
      status,
      dateRange = 'month',
      paymentMethod,
      category
    } = req.query;

    const filters = {};


    const now = new Date();
    let from, to;


    if (dateRange && dateRange !== 'custom') {
      to = new Date();


      switch (dateRange) {
        case 'today':
          from = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          from = new Date(now.setDate(now.getDate() - 1));
          from.setHours(0, 0, 0, 0);
          to = new Date(from);
          to.setHours(23, 59, 59);
          break;
        case 'week':
          from = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'last-week':
          from = new Date(now.setDate(now.getDate() - 14));
          to = new Date(now.setDate(now.getDate() + 7));
          break;
        case 'month':
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last-month':
          from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'year':
          from = new Date(now.getFullYear(), 0, 1);
          break;
      }


    } else if (dateRange === 'custom' && startDate && endDate) {
      from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      to = new Date(endDate);
      to.setHours(23, 59, 59);
    }

   if (from && to) {
      filters.createdAt = { $gte: from, $lte: to };
    }


    if (status && status !== 'all') {
      filters.orderStatus = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filters.paymentMethod = paymentMethod;
    }

    let orders = await Order.find(filters)
      .populate('user', 'name email')
      .populate('items.productId', 'name brand category')
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');


    sheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 25 },
      { header: 'User Name', key: 'userName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Total Amount (₹)', key: 'totalAmount', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Payment Method', key: 'payment', width: 20 },
      { header: 'Order Date', key: 'date', width: 20 }
    ];

    for (const order of orders) {
      sheet.addRow({
        orderId: order.orderNumber || order._id.toString(),
        userName: order.user?.name || 'Guest',
        email: order.user?.email || '',
        totalAmount: order.totalAmount.toFixed(2),
        status: order.orderStatus,
        payment: order.paymentMethod,
        date: moment(order.createdAt).format('YYYY-MM-DD')
      });
    }

    res.setHeader('Content-Disposition',`attachment; filename="sales-report-${moment().format('YYYY-MM-DD')}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};



module.exports = { getSalesReport , getSalesPdfReport , getSalesExcelReport};
