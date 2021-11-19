import {
  babelJestVersion,
  jestTypesVersion,
  jestVersion,
  nxVersion,
  tsJestVersion,
  tslibVersion,
} from '../../utils/versions';
import { JestInitSchema } from './schema';
import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  stripIndents,
  Tree,
  updateJson,
} from '@nrwl/devkit';

interface NormalizedSchema extends ReturnType<typeof normalizeOptions> {}

const schemaDefaults = {
  babelJest: false,
} as const;

function removeNrwlJestFromDeps(host: Tree) {
  updateJson(host, 'package.json', (json) => {
    // check whether updating the package.json is necessary
    if (json.dependencies && json.dependencies['@nrwl/jest']) {
      delete json.dependencies['@nrwl/jest'];
    }
    return json;
  });
}

function createJestConfig(host: Tree) {
  if (!host.exists('jest.config.js')) {
    host.write(
      'jest.config.js',
      stripIndents`
  const { getJestProjects } = require('@nrwl/jest');

  module.exports = {
    projects: getJestProjects()
  };`
    );
  }

  if (!host.exists('jest.preset.js')) {
    host.write(
      'jest.preset.js',
      `
      const nxPreset = require('@nrwl/jest/preset');
     
      module.exports = { ...nxPreset }`
    );
  }
}

function updateDependencies(tree: Tree, options: NormalizedSchema) {
  const dependencies = {
    tslib: tslibVersion,
  };
  const devDeps = {
    '@nrwl/jest': nxVersion,
    jest: jestVersion,
    '@types/jest': jestTypesVersion,
    'ts-jest': tsJestVersion,
  };

  if (options.babelJest) {
    devDeps['babel-jest'] = babelJestVersion;
    devDeps['@nrwl/js'] = nxVersion; // TODO(caleb): switch to nrwl/js
    // TODO(caleb): is there where I need to set up babel? feels like this should be generic somewhere
    devDeps['@babel/core'] = '^7.15.0';
    devDeps['@babel/preset-env'] = '^7.15.0';
    devDeps['@babel/plugin-proposal-class-properties'] = '^7.14.5';
    devDeps['@babel/plugin-proposal-decorators'] = '^7.14.5';
    devDeps['@babel/plugin-transform-regenerator'] = '^7.14.5';
    devDeps['@babel/plugin-transform-runtime'] = '^7.15.0';
    devDeps['@babel/runtime'] = '^7.14.8';
    devDeps['@babel/preset-typescript'] = '^7.15.0';
    devDeps['babel-loader'] = '^8.2.2';
    devDeps['babel-plugin-const-enum'] = '^1.0.1';
    devDeps['babel-plugin-macros'] = '^2.8.0';
    devDeps['babel-plugin-transform-async-to-promises'] = '^0.8.15';
    devDeps['babel-plugin-transform-typescript-metadata'] = '^0.3.1';
  }

  return addDependenciesToPackageJson(tree, dependencies, devDeps);
}

function updateExtensions(host: Tree) {
  if (!host.exists('.vscode/extensions.json')) {
    return;
  }

  updateJson(host, '.vscode/extensions.json', (json) => {
    json.recommendations = json.recommendations || [];
    const extension = 'firsttris.vscode-jest-runner';
    if (!json.recommendations.includes(extension)) {
      json.recommendations.push(extension);
    }
    return json;
  });
}

export function jestInitGenerator(tree: Tree, schema: JestInitSchema) {
  const options = normalizeOptions(schema);
  createJestConfig(tree);
  const installTask = updateDependencies(tree, options);
  removeNrwlJestFromDeps(tree);
  updateExtensions(tree);
  return installTask;
}

function normalizeOptions(options: JestInitSchema) {
  return {
    ...schemaDefaults,
    ...options,
  };
}

export default jestInitGenerator;

export const jestInitSchematic = convertNxGenerator(jestInitGenerator);
