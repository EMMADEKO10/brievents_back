const mongoose = require('mongoose');

const PendingUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  validationToken: { type: String, required: true },
  tokenExpiration: { type: Date, required: true },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'sponsor' },
}, { timestamps: true });

const PendingUser = mongoose.model('PendingUser', PendingUserSchema);
const User = mongoose.model('User', UserSchema);

module.exports = { User, PendingUser };
