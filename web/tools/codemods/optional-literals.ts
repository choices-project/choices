import { Project, SyntaxKind, type SourceFile, type Node, type PropertyAssignment } from 'ts-morph';

import { logger } from '@/lib/logger';

const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

function fixFile(sf: SourceFile): void {
  sf.forEachDescendant((node: Node) => {
    if (node.getKind() === SyntaxKind.ObjectLiteralExpression) {
      node.getChildrenOfKind(SyntaxKind.PropertyAssignment).forEach((prop: PropertyAssignment) => {
        const init = prop.getInitializer();
        if (init && init.getText() === 'undefined') prop.remove();
      });
    }
  });
}

project.getSourceFiles(['lib/**/*.ts', 'app/**/*.ts', 'features/**/*.ts']).forEach(fixFile);
project.save().then(() => logger.info('codemod done'));