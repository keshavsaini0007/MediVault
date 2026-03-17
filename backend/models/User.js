const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['patient', 'doctor'],
        required: true
    },
    phone: {
        type: String,
        trim: true
    },

    //Patient specific fields
    bloodType: {
        type: String,
        trim: true
    },
    allergies: [String],
    emergencyContact: {
        name: String,
        phone: String   
    },
    assignedDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    //Doctor specific fields
    specialization: {
        type: String,
        trim: true  
    },
    hospitalAffiliation: {
        type: String,
        trim: true  
    },
    hospitalId: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

