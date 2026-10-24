import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync('base44/functions/generateCaseStudyVideo/entry.ts', 'utf8');
const ui = fs.readFileSync('src/pages/CaseStudy.jsx', 'utf8');
const helper = fs.readFileSync('base44/shared/heygen.ts', 'utf8');
const transpiled = ts.transpile(source.replace(/^import .*;\s*$/gm, '').replace('export default async function', 'return async function'), { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None });
const request = (body) => new Request('https://example.test', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
let passed = 0;
async function check(label, role, body, expectedStatus, expectedCalls) {
  let calls = 0;
  const base44 = { auth: { me: async () => role ? { role } : null }, asServiceRole: { entities: { PortfolioItem: { get: async () => ({ title: 'Demo' }), update: async () => {} } } } };
  const requireAdmin = async (client) => {
    const user = await client.auth.me();
    if (!user) return { ok: false, response: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
    if (user.role !== 'admin') return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
    return { ok: true, user };
  };
  const fn = new Function('createClientFromRequest', 'requireAdmin', 'loadPortfolioItem', 'getHeyGenApiKey', 'createHeyGenSession', 'pollHeyGenVideo', 'guardHeyGenCall', transpiled)(
    () => base44, requireAdmin, async (client, id) => client.asServiceRole.entities.PortfolioItem.get(id),
    () => 'mock-key', async () => { calls++; return { sessionId: 'mock-session', watchUrl: 'https://example.test/mock' }; },
    () => {}, opts => { if (opts?.allow_heygen !== true) throw new Error('Consent required'); }
  );
  const response = await fn(request(body));
  assert.equal(response.status, expectedStatus, label);
  assert.equal(calls, expectedCalls, label + ' mock generation calls');
  passed++;
  console.log('PASS ' + label);
}
await check('anonymous denied', null, { portfolio_item_id: 'p', allow_heygen: true }, 401, 0);
await check('non-admin denied', 'user', { portfolio_item_id: 'p', allow_heygen: true }, 403, 0);
await check('admin without consent denied', 'admin', { portfolio_item_id: 'p' }, 400, 0);
await check('admin with false consent denied', 'admin', { portfolio_item_id: 'p', allow_heygen: false }, 400, 0);
await check('admin missing portfolio id denied', 'admin', { allow_heygen: true }, 400, 0);
await check('confirmed admin uses mocked generation', 'admin', { portfolio_item_id: 'p', allow_heygen: true }, 200, 1);
assert.match(ui, /isAdmin && <button/);
assert.match(ui, /window\.confirm\(/);
assert.match(ui, /allow_heygen: true/);
assert.match(helper, /\/v3\/video-agents/);
console.log((passed + 4) + ' checks passed. No paid HeyGen requests.');
