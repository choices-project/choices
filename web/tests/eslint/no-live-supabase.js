module.exports = {
  create(context) {
    return {
      ImportDeclaration(node) {
        if (/^@?supabase\//.test(node.source.value)) {
          context.report({
            node,
            message: 'Use mock factory in tests - import from @/tests/helpers/supabase-mock instead'
          });
        }
      }
    };
  }
};


















