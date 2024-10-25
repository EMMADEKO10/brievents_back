const mongoose = require('mongoose');

const AdvisorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});


const Advisor = mongoose.model('Advisor', AdvisorSchema);   

// ---------------------------------------------------------------------------------------

const PendingAdvisorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  language: { 
    type: String, 
    required: true 
  },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
  validationToken: {
    type: String,
    required: true
  },
  tokenExpiration: {
    type: Date,
    required: true
  }
}, { timestamps: true });

PendingAdvisor = mongoose.model('PendingAdvisor', PendingAdvisorSchema);

module.exports ={Advisor, PendingAdvisor};














