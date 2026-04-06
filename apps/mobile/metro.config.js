const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
	react: path.resolve(__dirname, 'node_modules/react'),
	'react-native': path.resolve(__dirname, 'node_modules/react-native'),
	'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
};

module.exports = config;
