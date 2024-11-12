const mongoose = require('mongoose');

const PendingOrganizerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  language: { type: String, required: true },
  isValidating : { type: Boolean, required: true, default: false },
  validationToken: { type: String, required: true },
  tokenExpiration: { type: Date, required: true },
}, { timestamps: true });

const OrganizerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  language: { type: String, required: true },
}, { timestamps: true });

const PendingOrganizer = mongoose.model('PendingOrganizer', PendingOrganizerSchema);
const Organizer = mongoose.model('Organizer', OrganizerSchema);

module.exports = { Organizer, PendingOrganizer };
