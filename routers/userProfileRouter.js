

const express = require('express');
const { renderProfilePage, renderAdderssBookPage } = require('../controllers/userProfileController');

const userProfileRouter = express.Router();



userProfileRouter.get('/', renderProfilePage);
userProfileRouter.get('/address', renderAdderssBookPage);

userProfileRouter.post('/add', )


module.exports = userProfileRouter;