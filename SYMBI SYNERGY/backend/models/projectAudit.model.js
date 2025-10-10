const mongoose = require('mongoose');

const ProjectAuditSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['owner_transfer', 'member_add', 'member_role_change', 'member_remove', 'knowledge_ingest', 'build_start', 'build_complete'], required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

ProjectAuditSchema.index({ project: 1, createdAt: -1 });

module.exports = mongoose.model('ProjectAudit', ProjectAuditSchema);

