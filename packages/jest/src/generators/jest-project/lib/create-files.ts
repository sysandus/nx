import { JestProjectSchema } from '../schema';
import {
  Tree,
  offsetFromRoot,
  generateFiles,
  readProjectConfiguration,
  stripIndents,
} from '@nrwl/devkit';
import { join } from 'path';

export function createFiles(tree: Tree, options: JestProjectSchema) {
  const projectConfig = readProjectConfiguration(tree, options.project);

  const filesFolder =
    options.setupFile === 'angular' ? '../files-angular' : '../files';

  generateFiles(tree, join(__dirname, filesFolder), projectConfig.root, {
    tmpl: '',
    ...options,
    transformer: options.babelJest ? 'babel-jest' : 'ts-jest',
    projectRoot: projectConfig.root,
    offsetFromRoot: offsetFromRoot(projectConfig.root),
  });

  if (options.setupFile === 'none') {
    tree.delete(join(projectConfig.root, './src/test-setup.ts'));
  }

  if (options.babelJest && !tree.exists('babel.config.json')) {
    tree.write(
      'babel.config.json',
      JSON.stringify({
        babelrcRoots: ['*'],
      })
    );
  }
}
