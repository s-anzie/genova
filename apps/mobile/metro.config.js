const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..', '..');

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so Metro picks up packages from the monorepo
config.watchFolders = config.watchFolders || [];
config.watchFolders.push(workspaceRoot);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
  react: path.resolve(workspaceRoot, 'node_modules', 'react'),
  'react-dom': path.resolve(workspaceRoot, 'node_modules', 'react-dom'),
  'react-native': path.resolve(workspaceRoot, 'node_modules', 'react-native'),
});

module.exports = withNativeWind(config, { input: './global.css' });
