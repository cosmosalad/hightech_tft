module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Remove comments from all AST nodes
  root.find(j.Node).forEach(path => {
    if (path.value.comments) {
      delete path.value.comments;
    }
  });

  // Check top-level program node
  const program = root.get().node;
  if (program && program.comments) {
    delete program.comments;
  }

  return root.toSource();
};
