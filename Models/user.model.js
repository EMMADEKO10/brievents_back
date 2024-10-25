// Models/users.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'sponsor', 'admin'],
        default: 'user'
    },
    newsletter: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

const User = mongoose.model('User', UserSchema);

// Models/sponsor.model.js
const SponsorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    company: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Sponsor = mongoose.model('Sponsor', SponsorSchema);

// Models/pending.model.js
const PendingRegistrationSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    newsletter: {
        type: Boolean,
        default: false
    },
    validationToken: {
        type: String,
        required: true
    },
    tokenExpiration: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

const PendingRegistration = mongoose.model('PendingRegistration', PendingRegistrationSchema);