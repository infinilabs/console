//import webpackPlugin from './plugin.config';
import pageRoutes from './router.config';
import defaultSettings from '../src/defaultSettings';

export default {
    //singular: true,
    routes: [{
        path: '/',
        component: 'helloworld',
    }],
    antd: {
    },
    locale: {
        default: 'zh-CN',
        baseNavigator: true,
    },
    routes: pageRoutes,
    define:{
        APP_TYPE: process.env.APP_TYPE || '',
    },
    theme: {
        'primary-color': defaultSettings.primaryColor,
    },
    runtimePublicPath: true,
    hash: true,
    outputPath: '../public',
    manifest: {
        fileName: '../../config/manifest.json',
        publicPath: '/public/',
    }
};
