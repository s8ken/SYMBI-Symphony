const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');
const Project = require('../../models/project.model');
const BuildJob = require('../../models/buildJob.model');
const Context = require('../../models/context.model');

// Mock auth: attach a static user id; provide optionalAuth/admin no-ops
jest.mock('../../middleware/auth.middleware', () => ({
  protect: jest.fn((req, res, next) => {
    req.user = { _id: '000000000000000000000001', id: '000000000000000000000001' };
    next();
  }),
  optionalAuth: jest.fn((req, res, next) => next()),
  admin: jest.fn((req, res, next) => next()),
}));

describe('Bolt API Integration', () => {
  beforeAll(async () => {
    // Optionally create a user document (not strictly required for IDs used)
    await User.create({ name: 'Tester', email: 'tester@example.com', password: 'password123' });
  });

  beforeEach(async () => {
    await Project.deleteMany({});
    await BuildJob.deleteMany({});
    await Context.deleteMany({});
  });

  it('creates project, ingests knowledge, and starts build', async () => {
    // Create project
    const createRes = await request(app)
      .post('/api/projects/projects')
      .send({ name: 'Dept Collab', description: 'Accounts + CS' })
      .expect(201);
    expect(createRes.body.success).toBe(true);
    const projectId = createRes.body.project._id;
    expect(projectId).toBeDefined();

    // List projects should include it
    const listRes = await request(app).get('/api/projects/projects').expect(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.projects)).toBe(true);
    expect(listRes.body.projects.length).toBe(1);

    // Add knowledge items
    await request(app)
      .post(`/api/projects/projects/${projectId}/knowledge`)
      .send({ items: [ { tag: `project:${projectId}:accounts`, data: { a: 1 }, source: 'symbi' } ] })
      .expect(201);

    // Start build
    const buildRes = await request(app)
      .post(`/api/projects/projects/${projectId}/builds`)
      .send({ spec: { steps: ['lint'] } })
      .expect(202);
    expect(buildRes.body.success).toBe(true);
    const buildId = buildRes.body.buildId;

    // Since in test env, queue processes inline to success
    const statusRes = await request(app)
      .get(`/api/projects/builds/${buildId}`)
      .expect(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.build.status).toBe('success');
  });

  it('manages members with owner-only privileges', async () => {
    // Create project
    const createRes = await request(app)
      .post('/api/projects/projects')
      .send({ name: 'RBAC Project' })
      .expect(201);
    const projectId = createRes.body.project._id;

    // List members
    const listRes = await request(app).get(`/api/projects/projects/${projectId}/members`).expect(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.members)).toBe(true);

    // Add member (viewer by default)
    const anotherUser = await User.create({ name: 'Alice', email: 'alice@example.com', password: 'passw0rd!' });
    const addRes = await request(app)
      .post(`/api/projects/projects/${projectId}/members`)
      .send({ userId: anotherUser._id.toString(), role: 'viewer' })
      .expect(201);
    const newMember = addRes.body.members.find(m => m.user === anotherUser._id.toString() || m.user?._id === anotherUser._id.toString());
    expect(newMember).toBeTruthy();

    // Promote to editor
    const memberId = addRes.body.members.find(m => (m.user === anotherUser._id.toString()) || (m.user?._id === anotherUser._id.toString()))?._id;
    const updRes = await request(app)
      .patch(`/api/projects/projects/${projectId}/members/${memberId}`)
      .send({ role: 'editor' })
      .expect(200);
    const updated = updRes.body.members.find(m => m._id === memberId);
    expect(updated.role).toBe('editor');

    // Remove member
    const delRes = await request(app)
      .delete(`/api/projects/projects/${projectId}/members/${memberId}`)
      .expect(200);
    const stillThere = delRes.body.members.find(m => m._id === memberId);
    expect(stillThere).toBeFalsy();
  });

  it('transfers ownership and writes audit logs', async () => {
    // Create a project with default owner (mocked user id)
    const createRes = await request(app)
      .post('/api/projects/projects')
      .send({ name: 'Transferable Project' })
      .expect(201);
    const projectId = createRes.body.project._id;

    // Add a new member to transfer to
    const newOwner = await User.create({ name: 'New Owner', email: 'newowner@example.com', password: 'passw0rd!' });
    await request(app)
      .post(`/api/projects/projects/${projectId}/members`)
      .send({ userId: newOwner._id.toString(), role: 'viewer' })
      .expect(201);

    // Transfer ownership
    const transferRes = await request(app)
      .post(`/api/projects/projects/${projectId}/owner-transfer`)
      .send({ newOwnerUserId: newOwner._id.toString() })
      .expect(200);
    expect(transferRes.body.success).toBe(true);
    expect(transferRes.body.owner).toBe(newOwner._id.toString());

    // Audit logs should include owner_transfer
    const logsRes = await request(app).get(`/api/projects/projects/${projectId}/audit-logs`).expect(200);
    const hasTransfer = (logsRes.body.logs || []).some(l => l.action === 'owner_transfer');
    expect(hasTransfer).toBe(true);
  });
});
