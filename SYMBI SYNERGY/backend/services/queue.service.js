const { Queue, Worker, QueueEvents, QueueScheduler } = (() => {
  try { return require('bullmq'); } catch { return {}; }
})();
const IORedis = (() => { try { return require('ioredis'); } catch { return null; } })();
const BuildJob = require('../models/buildJob.model');
const { getSocketIO } = require('../utils/socket');
const metrics = require('../metrics/projects.metrics');
const { appendEvent } = require('../services/ledger.service');

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_CONNECTION || 'redis://localhost:6379';
const IS_TEST = process.env.NODE_ENV === 'test';

let buildQueue = null;

function ioEmit(projectId, payload) {
  try { getSocketIO().to(`project:${projectId}`).emit('bolt:build:update', payload); } catch {}
}

async function processBuild(jobDoc) {
  // Minimal simulated build pipeline
  await jobDoc.addLog('info', 'Build started');
  ioEmit(jobDoc.project.toString(), { buildId: jobDoc._id.toString(), level: 'info', msg: 'Build started', ts: new Date().toISOString() });
  await jobDoc.addLog('info', 'Running checks');
  ioEmit(jobDoc.project.toString(), { buildId: jobDoc._id.toString(), level: 'info', msg: 'Running checks', ts: new Date().toISOString() });
  jobDoc.status = 'success';
  await jobDoc.save();
  ioEmit(jobDoc.project.toString(), { buildId: jobDoc._id.toString(), level: 'info', msg: 'Build finished successfully', ts: new Date().toISOString() });
  // Metrics (duration from createdAt)
  try {
    const seconds = (Date.now() - new Date(jobDoc.createdAt).getTime()) / 1000;
    metrics.buildJobsCompleted.inc();
    metrics.buildJobDuration.observe(seconds);
  } catch {}
  // Ledger event (trust-aligned)
  try {
    await appendEvent({
      session_id: `project:${jobDoc.project.toString()}`,
      userId: jobDoc.createdBy?.toString?.() || jobDoc.createdBy,
      prompt: '[projects] build_complete',
      response: 'Outcome: success',
      metadata: { action: 'build_complete', buildId: jobDoc._id.toString(), duration_seconds: (Date.now() - new Date(jobDoc.createdAt).getTime()) / 1000 }
    });
  } catch {}
}

async function enqueueBuild({ buildId }) {
  const jobDoc = await BuildJob.findById(buildId);
  if (!jobDoc) throw new Error('BuildJob not found');

  if (IS_TEST || !Queue || !IORedis) {
    // Fallback inline processing for tests or missing deps
    await processBuild(jobDoc);
    return { inline: true };
  }

  if (!buildQueue) {
    const connection = new IORedis(REDIS_URL);
    buildQueue = new Queue('builds', { connection });
    // Ensure a scheduler exists for delayed/retries
    new QueueScheduler('builds', { connection });
    new Worker('builds', async (job) => {
      const doc = await BuildJob.findById(job.data.buildId);
      if (!doc) return;
      doc.status = 'running';
      await doc.save();
      await processBuild(doc);
    }, { connection });
    new QueueEvents('builds', { connection });
  }
  await buildQueue.add('build', { buildId });
  return { enqueued: true };
}

module.exports = { enqueueBuild };
