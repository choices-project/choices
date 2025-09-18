/**
 * JSCodeshift Transform: Replace Legacy Imports with Canonical Paths
 */

const MAP = [
  { from: /^@\/components\/polls\/(.*)$/, to: '@/features/polls/$1' },
  { from: /^@\/components\/voting\/(.*)$/, to: '@/features/voting/$1' },
  { from: /^@\/components\/CreatePoll(?:Form)?(?:\.tsx)?$/, to: '@/features/polls/components/CreatePollForm' },
  { from: /^@\/components\/admin\/layout\/(.*)$/, to: '@/app/(app)/admin/layout/$1' },
];

function rewrite(source) {
  for (const m of MAP) {
    const match = source.match(m.from);
    if (match) return source.replace(m.from, m.to);
  }
  return null;
}

export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  function fixImportLiteral(lit) {
    if (!lit || typeof lit.value !== 'string') return;
    const next = rewrite(lit.value);
    if (next) lit.value = next;
  }

  root.find(j.ImportDeclaration).forEach(path => fixImportLiteral(path.node.source));
  root.find(j.ExportAllDeclaration).forEach(path => fixImportLiteral(path.node.source));
  root.find(j.ExportNamedDeclaration, { source: { type: 'Literal' } })
      .forEach(path => fixImportLiteral(path.node.source));
  root.find(j.CallExpression, { callee: { name: 'require' } })
      .forEach(path => {
        const arg = path.node.arguments && path.node.arguments[0];
        if (arg && arg.type === 'Literal') fixImportLiteral(arg);
      });

  return root.toSource({ quote: 'single' });
}