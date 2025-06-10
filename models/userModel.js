const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    name: { type: String, trim: true, required: true },
    email: { type: String, trim: true, required: true, unique: true },
    phone: { type: String, trim: true , unique: true },
    password: { type: String, trim: true, },
    googleId: {type: String, trim: true},
    dateOfBirth: {type: Date},
    isVerified: {type: Boolean, default: false},
    isBlocked: { type: Boolean, default: false },
    isListed: { type: Boolean, default: true }
}, { timestamps: true });

const Users = mongoose.model('users', UserSchema);

module.exports = Users;