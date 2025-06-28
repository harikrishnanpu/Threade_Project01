const adminReportServices = require('../../services/adminReportServices');


const getSalesReport = async (req, res) => {
  try {
    const data = await adminReportServices.getSalesReport(req.query, 20);
console.log(data);

    return res.render('admin/salesReport', {data , dateRange});

  } catch (err) {

    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};


module.exports = { getSalesReport };
