const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/project.controller');

// All routes require auth
router.use(protect);

// Projects
router.post('/projects', ctrl.createProject);
router.get('/projects', ctrl.listProjects);
router.get('/projects/:id', ctrl.getProject);

// Knowledge ingestion (register simple items -> Contexts)
router.post('/projects/:id/knowledge', ctrl.addKnowledgeItems);

// Builds
router.post('/projects/:id/builds', ctrl.startBuild);
router.get('/builds/:buildId', ctrl.getBuild);

// Member management (owner-only mutations)
router.get('/projects/:id/members', ctrl.listMembers);
router.post('/projects/:id/members', ctrl.addMember);
router.patch('/projects/:id/members/:memberId', ctrl.updateMemberRole);
router.delete('/projects/:id/members/:memberId', ctrl.removeMember);

// Owner transfer and audit logs
router.post('/projects/:id/owner-transfer', ctrl.transferOwnership);
router.get('/projects/:id/audit-logs', ctrl.listAuditLogs);

module.exports = router;
