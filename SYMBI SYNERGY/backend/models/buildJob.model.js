const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  ts: { type: Date, default: Date.now },
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'info' },
  msg: { type: String, required: true }
}, { _id: false });

const BuildJobSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  spec: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['queued', 'running', 'success', 'failed'], default: 'queued' },
  logs: { type: [LogSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BuildJobSchema.index({ project: 1, createdAt: -1 });

BuildJobSchema.methods.addLog = async function(level, msg) {
  this.logs.push({ level, msg, ts: new Date() });
  this.updatedAt = new Date();
  await this.save();
};

module.exports = mongoose.model('BuildJob', BuildJobSchema);

