/* jscodeshift codemod: replace legacy imports with canonical paths
 * Generated: 2025-09-18T12:14:43Z
 * Usage:
 *  npx jscodeshift -t codemods/replace-imports.js "web/**/*.ts*" --parser=ts --extensions=ts,tsx,js,jsx
 */
const mapping = {
  "@/components/polls/*": "@/features/polls/*",
  "@/components/CreatePoll": "@/features/polls/components/CreatePollForm",
  "@/features/polls/components/EnhancedVoteForm": "@/features/voting/components/VotingInterface",
  "@/components/voting/*": "@/features/voting/*",
  "@/lib/supabase/server": "@/utils/supabase/server",
  "@/shared/core/database/lib/server": "@/utils/supabase/server",
  "@/shared/lib/server": "@/utils/supabase/server",
  "@/shared/core/database/lib/supabase-server": "@/utils/supabase/server",
  "@/lib/supabase-ssr-safe": "@/utils/supabase/server",
  "@/utils/supabase/client-dynamic": "@/utils/supabase/client",
  "@/utils/supabase/client-minimal": "@/utils/supabase/client",
  "@/shared/core/database/lib/client": "@/utils/supabase/client",
  "@/components/auth/AuthProvider": "@/contexts/AuthContext",
  "@/hooks/AuthProvider": "@/contexts/AuthContext",
  "@/hooks/useSupabaseAuth": "@/contexts/AuthContext",
  "@/lib/core/auth/auth": "@/lib/core/auth/middleware",
  "@/components/Dashboard": "@/components/AnalyticsDashboard",
  "@/components/EnhancedDashboard": "@/components/AnalyticsDashboard",
  "@/features/webauthn/lib/webauthn": "@/lib/webauthn/client",
  "@/lib/shared/webauthn": "@/lib/webauthn/client",
  "@/src/components/WebAuthnAuth": "@/lib/webauthn/client",
  "@/features/civics/sources/propublica": "@/features/civics/ingest/connectors/propublica"
};

function resolveReplacement(source) {
  if (mapping[source]) return mapping[source];
  // try startsWith matching for wildcard rules ending with /*
  for (const [from, to] of Object.entries(mapping)) {
    if (from.endsWith('/*')) {
      const base = from.slice(0, -2);
      if (source.startsWith(base + '/')) {
        const rest = source.slice(base.length + 1);
        if (to.endsWith('/*')) return to.slice(0, -2) + '/' + rest;
        return to; // path-only redirect
      }
    }
  }
  return null;
}

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.ImportDeclaration).forEach(path => {
    const src = path.node.source.value;
    if (typeof src !== 'string') return;
    const rep = resolveReplacement(src);
    if (rep) path.node.source = j.literal(rep);
  });

  root.find(j.CallExpression, { callee: { name: 'require' } })
    .forEach(p => {
      const arg = p.node.arguments && p.node.arguments[0];
      if (!arg || arg.type !== 'Literal' || typeof arg.value !== 'string') return;
      const rep = resolveReplacement(arg.value);
      if (rep) arg.value = rep;
    });

  return root.toSource();
};
