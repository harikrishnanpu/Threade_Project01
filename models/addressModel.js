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



// AddressSchema.pre('save', async function (next) {
//   if (this.isDefault) {
//     await this.constructor.updateMany(
//       { user: this.user, _id: { $ne: this._id } },
//       { isDefault: false }
//     );
//   }
//   next();
// });

const Addresses = mongoose.model('Address', AddressSchema);

module.exports = Addresses;
