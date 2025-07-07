const mongoose = require('mongoose');
const { Schema } = mongoose;

const AddressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    street: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 12,
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
    type: {
      type: String,
      enum: [ 'home', 'work', 'gift' ],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,          
      default: true,
    },
  },
  { timestamps: true }
);



async function assignDefaultAddress(userId) {
  const Address = mongoose.model('Address');
  const existingDefault = await Address.findOne({ user: userId, isDefault: true, isActive: true });

  if (!existingDefault) {
    const addr = await Address.findOne({ user: userId, isActive: true }).sort({ updatedAt: -1 });
    if (addr) {
      addr.isDefault = true;
      await addr.save();
    }

  }
  
}

AddressSchema.post('save', async function () {
  await assignDefaultAddress(this.user);
});

AddressSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await assignDefaultAddress(doc.user);
  }
});

const Addresses = mongoose.model('Address', AddressSchema);

module.exports = Addresses;
