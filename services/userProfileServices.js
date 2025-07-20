const Address = require("../models/addressModel")
const User = require("../models/userModel")

const getUserAddressById = async (userId) => {
  try {
    const addresses = await Address.find({ user: userId, isActive: true }).sort({ isDefault: -1 , createdAt: -1 })
    return addresses
  } catch (err) {
    throw new Error(err.message)
  }
}

const findUserByEmail = async (email, excludeUserId = null) => {
  try {
    const query = { email: email.toLowerCase() }
    if (excludeUserId) {
      query._id = { $ne: excludeUserId }
    }
    const user = await User.findOne(query)
    return user
  } catch (err) {
    throw new Error(err.message)
  }
}

const insertOneUserAddressById = async (userId, reqBody) => {

  const { fullName, phone, street, city, state, pincode, type, isDefault } = reqBody;

  // console.log(reqBody);
  

  try {

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      throw new Error("all address fields are required")
    }

    if ( isDefault == true || isDefault == "on" ) {
      await Address.updateMany({ user: userId }, { isDefault: false })
    }

    const newAddress = new Address({
      user: userId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      type,
      isDefault: isDefault == true || isDefault == "on" ,
    })

    const savedAddress = await newAddress.save()
    return savedAddress

    
  } catch (err) {
    throw new Error(err.message)
  }
}

const updateUserAddressById = async (userId, addressId, reqBody) => {

  const { fullName, phone, street, city, state, pincode, type, isDefault } = reqBody

  console.log(isDefault);
  

  try {

    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      throw new Error("all address fields are required")
    }

    // console.log(isDefault);
    

    if ( isDefault == true || isDefault == "on" ) {
      await Address.updateMany({ user: userId, _id: { $ne: addressId } }, { isDefault: false })
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        type,
        isDefault: (isDefault == true  || isDefault == "on" ),
      })

    return updatedAddress
  } catch (err) {
    throw new Error(err.message)
  }
}

const deleteUserAddressById = async (userId, addressId) => {
  try {

    const deletedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },{ isActive: false })
      
    return deletedAddress
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = {
  getUserAddressById,
  findUserByEmail,
  insertOneUserAddressById,
  updateUserAddressById,
  deleteUserAddressById,
}
