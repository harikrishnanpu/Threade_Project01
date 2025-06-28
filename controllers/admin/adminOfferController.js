const offerService = require('../../services/adminOfferServices');
const path = require('path');

const getOffersPage = async (req, res) => {
  try {
    const defaults = {
      page: 1,
      limit: 10,
      status: 'all',
      applicableFilter: 'all',
      sortField: 'createdAt',
      sortOrder: 'desc',
      search: '',
      showExpired: false,
    };

    const query = {
      ...defaults,
      ...req.query,
    };

    query.page = parseInt(query.page) || 1;
    query.limit = parseInt(query.limit) || 10;
    query.showExpired = query.showExpired === 'true' || query.showExpired === true;

    const data = await offerService.listOffers(query);

    res.render('admin/allOffers', { ...query, ...data });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
};


const getProducts = async (req, res) => {
  try {
    const data = await offerService.searchProducts(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const data = await offerService.searchCategories(req.query);
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getOffer = async (req, res) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);
    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const createOffer = async (req, res) => {
  try {


    console.log(path.join(__dirname, '../../uploads/offers'))

    const body = req.body;

    if (req.file) body.image = `/uploads/offers/${req.file.filename}`;
    const offer = await offerService.createOffer(body);
    const updated = await offerService.updateAllProductSalePrices();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const updateOffer = async (req, res) => {
  try {

    const body = req.body;

    console.log(req.file);
    

    if (req.file) body.image = `/uploads/offers/${req.file.filename}`;

    const updtoffer = await offerService.updateOffer(req.params.id, body);
    const updated = await offerService.updateAllProductSalePrices();
    res.status(200).json({ success: true });

  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const toggleOfferStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const offerSts = await offerService.toggleOfferStatus(req.params.id, isActive);
     const updated = await offerService.updateAllProductSalePrices();
    res.status(200).json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};


module.exports = {
  getOffersPage,
  getOffer,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  getProducts,
  getCategories
};
