const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const projectNodeModules = path.resolve(__dirname, 'node_modules');

config.resolver.extraNodeModules = {
	expo: path.resolve(projectNodeModules, 'expo'),
	'@expo/vector-icons': path.resolve(projectNodeModules, '@expo/vector-icons'),
	react: path.resolve(projectNodeModules, 'react'),
	'react-native': path.resolve(projectNodeModules, 'react-native'),
	'react-native-gesture-handler': path.resolve(projectNodeModules, 'react-native-gesture-handler'),
	'react-native-svg': path.resolve(projectNodeModules, 'react-native-svg'),
};

module.exports = config;
