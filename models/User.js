const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    first_name: {type: String, required:false},
    last_name: {type: String, required:false},
    username: {type: String, required:false},
    email: {type: String, required:true},
    otp: {type: String, required:false, default:'none'},
    fcm:{type: String, required:false, default:"none"},
    password: {type: String, required:false, default: "non"},
    pin: {type: String, required:false, default: "none"}, // New field for storing hashed PINs
    otpExpires: {type: Date},
    verification: {type: Boolean, default:false},
    phone: {type: String, default:"08034256783"},
    phoneVerification: {type: Boolean, default:false},
    address:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
        required: false,
    },
    userType: {type: String, required:true, default: "Client", enum: ['Client', 'Admin', 'Vendor', 'Driver']},
    profile: {type: String}

    
},{
    toJSON: {
        transform(doc, ret){
            delete ret.__v;
        }
    },
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema)