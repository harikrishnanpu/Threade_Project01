const express = require("express")
const multer = require("multer")
const path = require("path")
const {
  renderProfilePage,
  renderAddressBookPage,
  addAddress,
  editAddress,
  deleteAddress,
  renderEditProfilePage,
  updateProfile,
  renderChangePasswordPage,
  changePassword,
  uploadProfileImage,
  verifyUserProfileEmail,
  renderOrdersPage,
  renderOrderDetailsPage,
  renderWalletPage,
  addMoneyToWallet,
  verifyWalletPayment,
  getAdddressPageContent,
  getOrderPageContent,
  getWalletPageContent,
} = require("../../controllers/user/userProfileController")


const userProfileRouter = express.Router();



userProfileRouter.use((req,res,next)=>{
      res.locals.isSubheaderHidden = true;
      next();
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `profile-` + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"))
    }
  },
})

userProfileRouter.get("/", renderProfilePage)
userProfileRouter.get("/edit", renderEditProfilePage)
userProfileRouter.get("/password", renderChangePasswordPage);
userProfileRouter.get('/orders', renderOrdersPage);
userProfileRouter.get('/orders/:id', renderOrderDetailsPage);
userProfileRouter.get('/wallet', renderWalletPage);


userProfileRouter.get('/orders/api/filtered/all', getOrderPageContent);
userProfileRouter.get('/wallet/api/filtered/all', getWalletPageContent);


userProfileRouter.put("/api/edit", upload.single('avatar'),updateProfile);
userProfileRouter.post('/api/verify/email/otp', verifyUserProfileEmail);
userProfileRouter.post('/api/change-password', changePassword);
userProfileRouter.post("/password", changePassword);

userProfileRouter.get("/address", renderAddressBookPage);
userProfileRouter.get("/address/api/filtered/all", getAdddressPageContent);
userProfileRouter.post("/address/add", addAddress);
userProfileRouter.put("/address/:id/edit", editAddress);
userProfileRouter.delete("/address/:id/delete", deleteAddress);

userProfileRouter.post('/api/wallet/deposit', addMoneyToWallet);
userProfileRouter.post('/wallet/payment/verify', verifyWalletPayment)

module.exports = userProfileRouter
