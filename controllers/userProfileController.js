const userProfileService = require("../services/userProfileServices")
const { findOneUserById, findOneUserByEmail } = require("../services/userServices")
const bcrypt = require("bcrypt")
const { generateOtp } = require("../utils/otp")
const otpModel = require("../models/otpModel")
const { sendOtpToEmail, verifyEmailOtp } = require("../services/emailVerificationService")
const Users = require("../models/userModel")
const { hashPassword, comparePassword } = require("../utils/bcrypt")
const { getUserOrders, getUserOrderById } = require("../services/userOrderServices")

const renderProfilePage = async (req, res) => {
  const userId = req.user._id
  try {
    const user = await findOneUserById(userId)
    const addresses = (await userProfileService.getUserAddressById(userId)) || []

    res.render("user/profile", {
      user,
      addresses: addresses,
      currentPage: 'dashboard',
      pageTitle: 'ff',
      orders: [],
      coupons: [],
      success: true,
      error: null
    })
  } catch (err) {
    res.status(500).render("error", { message: err.message })
  }
}

const renderEditProfilePage = async (req, res) => {
  const userId = req.user._id
  try {
    const user = await findOneUserById(userId)
    res.render("user/profile-edit", { user ,
            currentPage: 'edit',
      pageTitle: 'ff',
      orders: [],
      coupons: [],
      success: true,
      error: null
    })
  } catch (err) {
    res.status(500).render("error", { message: err.message })
  }
}

const renderChangePasswordPage = async (req, res) => {
  const userId = req.user._id;
  try{
    const user = await Users.findById(userId);
    if(!user.password){
      return res.render("user/profile-change-password", { googleAuth: true })
    }
    return res.render("user/profile-change-password", { googleAuth: false })
  }catch(err){
    res.status(500).json({ message: err.message, googleAuth: false})
  }
}

const renderEmailVerificationPage = async (req,res) =>{
  res.render('user/profile-verify', { email: req.user.email })
}



const renderOrdersPage = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      status = '',
      dateRange = '',
      paymentMethod = '',
      sortBy = 'createdAt_desc',
      search = '',
      page = 1
    } = req.query;

    const limit = 1;
    const filters = { status, dateRange, paymentMethod, search, sortBy };
    const currentPage = parseInt(page) || 1;

    const {
      orders,
      totalOrders,
      pendingOrders,
      deliveredOrders
    } = await getUserOrders(userId, filters, currentPage, limit);

    const totalPages = Math.ceil(totalOrders / limit);
    const startIndex = (currentPage - 1) * limit + 1;
    const endIndex = Math.min(currentPage * limit, totalOrders);

    res.render('user/orders',{
      req,
      orders,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      currentPage,
      totalPages,
      startIndex,
      endIndex,
      filters,
      cancelledOrders: []
    });
  } catch (err) {
    console.error('Error rendering orders page:', err);
    res.status(500).render('error', { message: 'Failed to load orders page.' });
  }
};

const renderOrderDetailsPage = async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.id;

    const order = await getUserOrderById(userId, orderId);

    if (!order) {
      return res.status(404).render('error', {
        message: 'Order not found or access denied'
      });
    }

    res.render('user/order-details', {
      order
    });
  } catch (err) {
    console.error('Error loading order details:', err);
    res.status(500).render('error', { message: 'Failed to load order details' });
  }
};

const updateProfile = async (req, res) => {
  const userId = req.user._id;
  const { name, email, phone, dateOfBirth } = req.body;

  console.log(req.body);
  

  try {

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const existingUser = await userProfileService.findUserByEmail(email.trim(), userId);
    if (existingUser) {
      return res.status(400).json({ message: "This email is already taken by another user." });
    }

    const currentUser = await findOneUserById(userId);

    if (currentUser.email !== email.trim()) {

      const updatedData = {
      name: name.trim(),
    };

    if (phone) {
      updatedData.phone = phone.trim();
    }

    if (dateOfBirth) {
      updatedData.dateOfBirth = new Date(dateOfBirth);
    }

    await Users.findByIdAndUpdate(userId, updatedData);
        const otp = generateOtp();
        console.log(otp);

        await otpModel.deleteOne({ email });
            await otpModel.create({
            email,
            otp,
            expiresAt: Date.now() +  2 * 60 * 1000, // 2 mins expiry
            });
      
          await sendOtpToEmail(email,otp);
         return res.status(200).json({ message: 'successfully send code', verifyEmail: true, oldEmail: currentUser.email,  email })
    }

    const updatedData = {
      name: name.trim(),
      email: email.trim(),
    };

    if (phone) {
      updatedData.phone = phone.trim();
    }

    if (dateOfBirth) {
      updatedData.dateOfBirth = new Date(dateOfBirth);
    }

    await Users.findByIdAndUpdate(userId, updatedData);

    return res.status(200).json({ success: true, message: "Profile updated successfully." , verifyEmail: false});

  } catch (err) {
    return res.status(500).json({ message: err.message});
  }

};


const verifyUserProfileEmail = async (req,res) => {
  const { email, otp, oldEmail } = req.body;
  try{

  const isOtpValid = await verifyEmailOtp(email,otp);

    if(isOtpValid){

      console.log(req.body);
      

      const user = await findOneUserByEmail(oldEmail);

      console.log(user);
      

      const existingUser = await Users.findOne({ email });

      if(existingUser){
        return res.status(500).json({ message: 'user with this mail already exists' })
      }

      
      user.email = email;
      user.isVerified = true;

      await user.save();
      
      // const token = generateToken(user._id);
      
      // res.cookie('token', token, {
      //   httpOnly: true,
      //   secure: true,      
      //   sameSite: 'strict',
      //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // });
      
      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
      });

  }
}catch(err){
  res.status(500).json({message: err.message})
  }
}



const changePassword = async (req, res) => {

  const userId = req.user._id;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  

  try {
    const user = await findOneUserById(userId);

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All password fields are required" })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" })
    }


    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" })
    }

    if (!user.password) {
    const hashedNewPassword = await hashPassword(newPassword);
    await Users.findByIdAndUpdate(userId, { password: hashedNewPassword });
    return res.status(200).json({ success: true, message: 'successfully updated' })
    }

    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" })
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await Users.findByIdAndUpdate(userId, { password: hashedNewPassword });

    return res.status(200).json({ success: true, message: 'successfully updated' })


  } catch (err) {
    res.status(500).json({message : err.message})
  }
}






const uploadProfileImage = async (req, res) => {
  const userId = req.user._id

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" })
    }

    const profileImagePath = `/uploads/profiles/${req.file.filename}`
    await updateUserById(userId, { profileImage: profileImagePath })

    res.json({
      message: "Profile image updated successfully",
      profileImage: profileImagePath,
    })
  } catch (err) {
    console.error("Upload profile image error:", err)
    res.status(400).json({ message: err.message })
  }
}




const renderAddressBookPage = async (req, res) => {
  const userId = req.user._id
  try {
    const addresses = (await userProfileService.getUserAddressById(userId)) || []
    res.render("user/address-book", { addresses })
  } catch (err) {
    console.error("Address book page error:", err)
    res.status(500).render("error", { message: "Unable to load address book" })
  }
}

const addAddress = async (req, res) => {
  const userId = req.user._id
  try {
    const newAddress = await userProfileService.insertOneUserAddressById(userId, req.body)
    res.status(201).json({
      message: "Address added successfully",
      address: newAddress,
    })
  } catch (err) {
    console.error("Add address error:", err)
    res.status(400).json({ message: err.message })
  }
}

const editAddress = async (req, res) => {
  const userId = req.user._id
  const addressId = req.params.id

  try {
    const updatedAddress = await userProfileService.updateUserAddressById(userId, addressId, req.body)
    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" })
    }
    res.json({
      message: "Address updated successfully",
      address: updatedAddress,
    })
  } catch (err) {
    console.error("Edit address error:", err)
    res.status(400).json({ message: err.message })
  }
}

const deleteAddress = async (req, res) => {
  const userId = req.user._id
  const addressId = req.params.id

  try {
    const deletedAddress = await userProfileService.deleteUserAddressById(userId, addressId)
    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" })
    }
    res.json({ message: "Address deleted successfully" })
  } catch (err) {
    console.error("Delete address error:", err)
    res.status(400).json({ message: err.message })
  }
}

module.exports = {
  renderProfilePage,
  renderEditProfilePage,
  renderEmailVerificationPage,
  renderChangePasswordPage,
  updateProfile,
  verifyUserProfileEmail,
  uploadProfileImage,
  changePassword,
  renderAddressBookPage,
  addAddress,
  editAddress,
  deleteAddress,
  renderOrdersPage,
  renderOrderDetailsPage
}
