// src/models/users.model.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false,  // Pas nécessaire pour l'auth Google
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['user', 'admin','advisor'],
    default: 'user' 
  },
  googleId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  image: { type: String },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  confirmationToken:{type:String}
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;




// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// userSchema.methods.comparePassword = async function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };
