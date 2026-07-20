import { parse } from 'yaml';

const STATUSES = ['proposed', 'approved', 'rejected', 'in_progress', 'preview', 'live', 'blocked'];
const EFFORTS = ['S', 'M', 'L'];
const MAX_ACTIVE = 3;

export function validateGoals(yamlText) {
  const errors = [];
  let doc;
  try {
    doc = parse(yamlText);
  } catch (e) {
    return { ok: false, errors: [`YAML parse error: ${e.message}`] };
  }
  if (!doc || doc.version !== 1) errors.push('version must be 1');
  if (!Array.isArray(doc?.goals)) {
    errors.push('goals must be an array');
    return { ok: false, errors };
  }
  const ids = new Set();
  let active = 0;
  for (const g of doc.goals) {
    const label = g?.id ?? '<missing id>';
    if (!/^qa-\d{3,}$/.test(g?.id ?? '')) errors.push(`${label}: id must match qa-NNN`);
    if (ids.has(g?.id)) errors.push(`${label}: duplicate id`);
    ids.add(g?.id);
    if (!g?.title) errors.push(`${label}: title required`);
    if (!g?.rationale) errors.push(`${label}: rationale required`);
    if (!EFFORTS.includes(g?.effort)) errors.push(`${label}: effort must be one of ${EFFORTS.join('/')}`);
    if (!STATUSES.includes(g?.status)) errors.push(`${label}: invalid status "${g?.status}"`);
    if (typeof g?.migration !== 'boolean') errors.push(`${label}: migration must be boolean`);
    if (g?.status === 'approved' || g?.status === 'in_progress') active++;
  }
  if (active > MAX_ACTIVE) errors.push(`too many active goals: ${active} (max ${MAX_ACTIVE})`);
  return { ok: errors.length === 0, errors };
}

const invokedAsCli = process.argv[1] &&
  import.meta.url.replace(/\\/g, '/').endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (invokedAsCli) {
  const { readFileSync } = await import('node:fs');
  const text = readFileSync(new URL('../docs/agent/goals.yaml', import.meta.url), 'utf8');
  const res = validateGoals(text);
  if (!res.ok) {
    console.error('goals.yaml INVALID:\n- ' + res.errors.join('\n- '));
    process.exit(1);
  }
  console.log('goals.yaml valid');
}
