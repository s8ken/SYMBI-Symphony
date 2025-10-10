const asyncHandler = require('express-async-handler');
const Project = require('../models/project.model');
const BuildJob = require('../models/buildJob.model');
const Context = require('../models/context.model');
const ProjectAudit = require('../models/projectAudit.model');
const { appendEvent } = require('../services/ledger.service');
const { getSocketIO } = require('../utils/socket');
const { enqueueBuild } = require('../services/queue.service');
const metrics = require('../metrics/projects.metrics');

async function logProjectEvent(req, projectId, action, details, outcome = 'success') {
  try {
    const session_id = `project:${projectId}`;
    const actorId = (req.user?._id || req.user?.id || '').toString();
    const roles = req.user?.roles || (req.user?.role ? [req.user.role] : []);
    const prompt = `[projects] ${action}`;
    const response = `Outcome: ${outcome}`;
    const metadata = {
      action,
      details: details || {},
      actor: { id: actorId, roles },
      request: { id: req.requestId, ip: req.ip, ua: req.get?.('User-Agent') },
      route: req.originalUrl,
      method: req.method,
      projectId: projectId?.toString?.() || projectId
    };
    await appendEvent({ session_id, userId: actorId, prompt, response, metadata });
  } catch (_) { /* ignore ledger failures */ }
}

// Create a new project
exports.createProject = asyncHandler(async (req, res) => {
  const { name, description, departments = [], members = [] } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  const ownerId = req.user._id || req.user.id; // tests may mock id only
  const project = await Project.create({
    name,
    description: description || '',
    owner: ownerId,
    members: [
      { user: ownerId, role: 'owner' },
      ...((members || []).map(u => ({ user: u.user || u, role: u.role || 'viewer' })))
    ],
    departments
  });
  try { metrics.projectCreated.inc(); } catch {}
  try { await ProjectAudit.create({ project: project._id, actor: ownerId, action: 'member_add', details: { user: ownerId, role: 'owner', reason: 'project_created' } }); } catch {}
  await logProjectEvent(req, project._id, 'project_created', { name });
  res.status(201).json({ success: true, project });
});

// List projects for current user
exports.listProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const projects = await Project.find({ $or: [ { owner: userId }, { 'members.user': userId } ] })
    .sort({ updatedAt: -1 })
    .exec();
  res.json({ success: true, projects });
});

// Get project by id (authorized)
exports.getProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const userId = (req.user._id || req.user.id).toString();
  const allowed = project.owner.toString() === userId || project.members.some(m => (m.user?.toString?.() || m.toString()) === userId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized for this project' });
  res.json({ success: true, project });
});

// Add knowledge items -> stored as Contexts and optionally vectorized
exports.addKnowledgeItems = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'items[] required' });
  }

  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  const userId = (req.user._id || req.user.id).toString();
  const member = project.members.find(m => (m.user?.toString?.() || m.toString()) === userId);
  const role = member?.role || (project.owner.toString() === userId ? 'owner' : null);
  const canEdit = role === 'owner' || role === 'editor';
  if (!canEdit) return res.status(403).json({ success: false, message: 'Editor or owner role required' });

  const saved = [];
  for (const it of items) {
    const tag = it.tag || `project:${project._id}`;
    const doc = await Context.create({
      tag,
      source: (it.source || 'symbi'),
      data: it.data,
      relatedTo: {},
      metadata: { projectId: project._id.toString() },
      trustScore: 5
    });
    saved.push(doc);
  }

  try {
    const io = getSocketIO();
    io.to(`project:${project._id}`).emit('bolt:knowledge:added', { projectId: project._id.toString(), count: saved.length });
  } catch (e) {}
  try { metrics.knowledgeItemsIngested.inc(saved.length); } catch {}
  try { await ProjectAudit.create({ project: project._id, actor: req.user._id || req.user.id, action: 'knowledge_ingest', details: { count: saved.length } }); } catch {}
  await logProjectEvent(req, project._id, 'knowledge_ingest', { count: saved.length });

  res.status(201).json({ success: true, count: saved.length });
});

// Start a build job
exports.startBuild = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const project = await Project.findById(id);
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  const member = project.members.find(m => (m.user?.toString?.() || m.toString()) === userId);
  const role = member?.role || (project.owner.toString() === userId ? 'owner' : null);
  const canEdit = role === 'owner' || role === 'editor';
  if (!canEdit) return res.status(403).json({ success: false, message: 'Editor or owner role required' });

  const { spec = {} } = req.body || {};
  const creatorId = req.user._id || req.user.id;
  const job = await BuildJob.create({ project: project._id, createdBy: creatorId, spec, status: 'queued', logs: [] });
  try { metrics.buildJobsStarted.inc(); } catch {}
  await enqueueBuild({ buildId: job._id.toString() });
  try { await ProjectAudit.create({ project: project._id, actor: creatorId, action: 'build_start', details: { buildId: job._id.toString(), spec } }); } catch {}
  await logProjectEvent(req, project._id, 'build_start', { buildId: job._id.toString(), spec });

  res.status(202).json({ success: true, buildId: job._id.toString() });
});

// Get build status
exports.getBuild = asyncHandler(async (req, res) => {
  const job = await BuildJob.findById(req.params.buildId);
  if (!job) return res.status(404).json({ success: false, message: 'Build not found' });

  const project = await Project.findById(job.project);
  const userId = (req.user._id || req.user.id).toString();
  const allowed = project && (project.owner.toString() === userId || project.members.some(m => (m.user?.toString?.() || m.toString()) === userId));
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized for this build' });

  res.json({ success: true, build: job });
});

// --- Member Management ---
function ensureOwner(project, userId) {
  const isOwner = project.owner.toString() === userId;
  if (!isOwner) {
    const err = new Error('Owner role required');
    err.status = 403;
    throw err;
  }
}

exports.listMembers = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  const allowed = project.owner.toString() === userId || project.members.some(m => (m.user?.toString?.() || m.toString()) === userId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized' });
  res.json({ success: true, owner: project.owner, members: project.members });
});

exports.addMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  ensureOwner(project, userId);

  const { userId: newUserId, role = 'viewer' } = req.body || {};
  if (!newUserId) return res.status(400).json({ success: false, message: 'userId is required' });
  if (!['owner', 'editor', 'viewer'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
  if (project.members.some(m => (m.user?.toString?.() || m.toString()) === newUserId)) {
    return res.status(409).json({ success: false, message: 'Member already exists' });
  }
  const finalRole = role === 'owner' ? 'editor' : role;
  project.members.push({ user: newUserId, role: finalRole });
  await project.save();
  try { metrics.projectMemberAdded.inc(); } catch {}
  await logProjectEvent(req, project._id, 'member_add', { userId: newUserId, role: finalRole });
  res.status(201).json({ success: true, members: project.members });
});

exports.updateMemberRole = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  ensureOwner(project, userId);

  const { role } = req.body || {};
  if (!['editor', 'viewer'].includes(role)) return res.status(400).json({ success: false, message: 'Role must be editor or viewer' });

  const member = project.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  if ((member.user?.toString?.() || '') === project.owner.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot modify owner via this endpoint' });
  }
  member.role = role;
  await project.save();
  try { metrics.projectMemberRoleChanged.inc(); } catch {}
  await logProjectEvent(req, project._id, 'member_role_change', { memberId: member._id.toString(), role });
  res.json({ success: true, members: project.members });
});

exports.removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  ensureOwner(project, userId);

  const member = project.members.id(req.params.memberId);
  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  if ((member.user?.toString?.() || '') === project.owner.toString()) {
    return res.status(400).json({ success: false, message: 'Cannot remove owner' });
  }
  member.deleteOne();
  await project.save();
  try { metrics.projectMemberRemoved.inc(); } catch {}
  try { await ProjectAudit.create({ project: project._id, actor: userId, action: 'member_remove', details: { memberId: req.params.memberId } }); } catch {}
  await logProjectEvent(req, project._id, 'member_remove', { memberId: req.params.memberId });
  res.json({ success: true, members: project.members });
});

// Transfer ownership (owner-only)
exports.transferOwnership = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const requesterId = (req.user._id || req.user.id).toString();
  if (project.owner.toString() !== requesterId) return res.status(403).json({ success: false, message: 'Owner role required' });

  const { newOwnerUserId } = req.body || {};
  if (!newOwnerUserId) return res.status(400).json({ success: false, message: 'newOwnerUserId is required' });
  if (newOwnerUserId === requesterId) return res.status(400).json({ success: false, message: 'New owner must be different' });

  // Ensure new owner exists in members list
  let member = project.members.find(m => (m.user?.toString?.() || m.toString()) === newOwnerUserId);
  if (!member) {
    project.members.push({ user: newOwnerUserId, role: 'owner' });
  } else {
    member.role = 'owner';
  }
  // Downgrade previous owner member entry to editor if present or add as editor
  const prevOwnerId = project.owner.toString();
  const prevMember = project.members.find(m => (m.user?.toString?.() || m.toString()) === prevOwnerId);
  if (prevMember) prevMember.role = 'editor';
  else project.members.push({ user: prevOwnerId, role: 'editor' });

  project.owner = newOwnerUserId;
  await project.save();
  try { metrics.projectOwnerTransfers.inc(); } catch {}
  try { await ProjectAudit.create({ project: project._id, actor: requesterId, action: 'owner_transfer', details: { from: prevOwnerId, to: newOwnerUserId } }); } catch {}
  await logProjectEvent(req, project._id, 'owner_transfer', { from: prevOwnerId, to: newOwnerUserId });

  res.json({ success: true, owner: project.owner, members: project.members });
});

// List project audit logs (member-visible)
exports.listAuditLogs = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).select('owner members');
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
  const userId = (req.user._id || req.user.id).toString();
  const allowed = project.owner.toString() === userId || project.members.some(m => (m.user?.toString?.() || m.toString()) === userId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized' });

  const logs = await ProjectAudit.find({ project: project._id }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, logs });
});
