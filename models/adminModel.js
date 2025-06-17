const mongoose = require('mongoose');

const AdminSchema = mongoose.Schema({
    name: {type:  String, require: true, trim: true},
    email: { type: String, required: true , unique: true, trim: true},
    password: {type: String, required: true},
    role: {type: String, default: 'admin', enum:['admin','seller', 'super']},
    isBlocked: { type: Boolean, default: false }
}, {timestamps: true});

const Admin = mongoose.model('admin', AdminSchema);
module.exports = Admin;