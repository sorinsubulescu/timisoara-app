const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');

function resolvePackageDir(packageName) {
  const candidates = [
    path.resolve(projectNodeModules, packageName),
    path.resolve(workspaceNodeModules, packageName),
  ];

  const packageDir = candidates.find((candidate) => fs.existsSync(candidate));

  if (!packageDir) {
    throw new Error(`Unable to resolve Metro package: ${packageName}`);
  }

  return packageDir;
}

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [projectNodeModules, workspaceNodeModules];
config.resolver.extraNodeModules = {
  expo: resolvePackageDir('expo'),
  react: resolvePackageDir('react'),
  'react-native': resolvePackageDir('react-native'),
  '@expo/metro-runtime': resolvePackageDir('@expo/metro-runtime'),
  '@expo/vector-icons': resolvePackageDir('@expo/vector-icons'),
  '@react-native-async-storage/async-storage': resolvePackageDir('@react-native-async-storage/async-storage'),
  'expo-constants': resolvePackageDir('expo-constants'),
  'expo-font': resolvePackageDir('expo-font'),
  'expo-linking': resolvePackageDir('expo-linking'),
  'expo-router': resolvePackageDir('expo-router'),
  'expo-status-bar': resolvePackageDir('expo-status-bar'),
  'react-native-gesture-handler': resolvePackageDir('react-native-gesture-handler'),
  'react-native-maps': resolvePackageDir('react-native-maps'),
  'react-native-safe-area-context': resolvePackageDir('react-native-safe-area-context'),
  'react-native-screens': resolvePackageDir('react-native-screens'),
  'react-native-svg': resolvePackageDir('react-native-svg'),
};

module.exports = config;
