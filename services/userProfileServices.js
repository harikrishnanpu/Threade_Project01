const Address = require("../models/addressModel")
const User = require("../models/userModel")

const getUserAddressById = async (userId) => {
  try {
    const addresses = await Address.find({ user: userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 })
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
  const { fullName, phone, street, city, state, pincode, isHomeAddress, isWorkAddress, isDefault } = reqBody;

  console.log(reqBody);
  

  try {
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      throw new Error("All address fields are required")
    }

    let type = "home" 
    if (isWorkAddress === "on" || isWorkAddress === true) {
      type = "work"
    } else if (isHomeAddress === "on" || isHomeAddress === true) {
      type = "home"
    }

    if (isDefault === "on" || isDefault === true) {
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
      isDefault: isDefault === "on" || isDefault === true,
    })

    const savedAddress = await newAddress.save()
    return savedAddress
  } catch (err) {
    throw new Error(err.message)
  }
}

const updateUserAddressById = async (userId, addressId, reqBody) => {
  const { fullName, phone, street, city, state, pincode, isHomeAddress, isWorkAddress, isDefault } = reqBody

  try {
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      throw new Error("All address fields are required")
    }

    let type = "home"
    if (isWorkAddress === "on" || isWorkAddress === true) {
      type = "work"
    } else if (isHomeAddress === "on" || isHomeAddress === true) {
      type = "home"
    }

    if (isDefault === "on" || isDefault === true) {
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
        isDefault: isDefault === "on" || isDefault === true,
      })

    return updatedAddress
  } catch (err) {
    throw new Error(err.message)
  }
}

const deleteUserAddressById = async (userId, addressId) => {
  try {

    const deletedAddress = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { isActive: false })
      
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
