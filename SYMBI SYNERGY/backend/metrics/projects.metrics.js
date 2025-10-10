const client = require('prom-client');
const { register } = require('../middleware/metrics.middleware');

// Project lifecycle
const projectCreated = new client.Counter({
  name: 'projects_created_total',
  help: 'Total projects created'
});

// Knowledge ingestion
const knowledgeItemsIngested = new client.Counter({
  name: 'projects_knowledge_items_ingested_total',
  help: 'Total knowledge items ingested'
});

// Member management
const projectMemberAdded = new client.Counter({
  name: 'projects_member_added_total',
  help: 'Total project members added'
});
const projectMemberRemoved = new client.Counter({
  name: 'projects_member_removed_total',
  help: 'Total project members removed'
});
const projectMemberRoleChanged = new client.Counter({
  name: 'projects_member_role_changed_total',
  help: 'Total project member role changes'
});

// Build jobs
const buildJobsStarted = new client.Counter({
  name: 'projects_build_jobs_started_total',
  help: 'Total build jobs started'
});
const buildJobsCompleted = new client.Counter({
  name: 'projects_build_jobs_completed_total',
  help: 'Total build jobs completed'
});
const buildJobDuration = new client.Histogram({
  name: 'projects_build_job_duration_seconds',
  help: 'Duration of build jobs in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]
});

register.registerMetric(projectCreated);
register.registerMetric(knowledgeItemsIngested);
register.registerMetric(projectMemberAdded);
register.registerMetric(projectMemberRemoved);
register.registerMetric(projectMemberRoleChanged);
register.registerMetric(buildJobsStarted);
register.registerMetric(buildJobsCompleted);
register.registerMetric(buildJobDuration);
const projectOwnerTransfers = new client.Counter({ name: 'projects_owner_transfers_total', help: 'Total project owner transfers' });
register.registerMetric(projectOwnerTransfers);

module.exports = {
  projectCreated,
  projectOwnerTransfers,
  knowledgeItemsIngested,
  projectMemberAdded,
  projectMemberRemoved,
  projectMemberRoleChanged,
  buildJobsStarted,
  buildJobsCompleted,
  buildJobDuration,
};
