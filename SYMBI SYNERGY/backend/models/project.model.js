const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  aiProvider: { type: String, enum: ['openai', 'anthropic', 'other'], default: 'openai' },
  model: { type: String, default: '' },
}, { _id: true });

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
}, { _id: true });

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [MemberSchema], default: [] },
  departments: { type: [DepartmentSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ProjectSchema.index({ owner: 1, createdAt: -1 });
ProjectSchema.index({ 'members.user': 1 });

ProjectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', ProjectSchema);
