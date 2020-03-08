//import webpackPlugin from './plugin.config';
import pageRoutes from './router.config';

export default {
    singular: true,
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
    runtimePublicPath: true,
    hash: true,
    outputPath: '../public',
    manifest: {
        fileName: '../../config/manifest.json',
        publicPath: '/public/',
    }
};
