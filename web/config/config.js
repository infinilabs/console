// https://umijs.org/config/
import os from "os";
import pageRoutes from "./router.config";
import webpackPlugin from "./plugin.config";
import defaultSettings from "../src/defaultSettings";
import packageJson from "../package.json";

const ProxyTarget = "http://localhost:9000"

export default {
  // add for transfer to umi
  plugins: [
    [
      "umi-plugin-react",
      {
        antd: true,
        dva: {
          hmr: true,
        },
        targets: {
          ie: 11,
        },
        locale: {
          enable: true, // default false
          default: "en-US", // default zh-CN
          baseNavigator: true, // default true, when it is true, will use `navigator.language` overwrite default
        },
        dynamicImport: {
          loadingComponent: "./components/PageLoading/index",
        },
        ...(!process.env.TEST && os.platform() === "darwin"
          ? {
              dll: {
                include: ["dva", "dva/router", "dva/saga", "dva/fetch"],
                exclude: ["@babel/runtime"],
              },
              hardSource: false,
            }
          : {}),
      },
    ],
    // [
    //   'umi-plugin-ga',
    //   {
    //     code: 'UA-12123-6',
    //     judge: () => process.env.APP_TYPE === 'site',
    //   },
    // ],
  ],
  targets: {
    ie: 11,
  },
  define: {
    APP_TYPE: process.env.APP_TYPE || "",
    ENV: process.env.NODE_ENV,
    API_ENDPOINT: process.env.API_ENDPOINT || "",
    APP_DOMAIN: packageJson.domain,
    APP_TITLE: packageJson.title,
    APP_AUTHOR: packageJson.author,
    APP_OFFICIAL_WEBSITE: packageJson.official_website || "",
    APP_DOCS_WEBSITE: packageJson.docs_website || "",
  },
  // 路由配置
  routes: pageRoutes,
  // Theme for antd
  // https://ant.design/docs/react/customize-theme-cn
  theme: {
    "primary-color": defaultSettings.primaryColor,
  },
  externals: {
    // '@antv/data-set': 'DataSet',
  },
  proxy: {
    "/elasticsearch/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/_search-center/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/static/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/gateway/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/_info": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/config/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/environments/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/pipeline/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/queue/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/task/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/tasks/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/debug/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/alerting/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/health": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/stats": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/keystore": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/user": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/role/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/permission/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/account/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/notification/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/agent/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/insight/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/host/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/_platform/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/migration/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/comparison/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/_license/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/setup/": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/layout": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/credential": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/setting": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/email": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/data": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/instance": {
      target: ProxyTarget,
      changeOrigin: true,
    },
    "/collection": {
      target: ProxyTarget,
      changeOrigin: true,
    },
  },
  ignoreMomentLocale: true,
  lessLoaderOptions: {
    javascriptEnabled: true,
  },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: (context, localIdentName, localName) => {
      if (
        context.resourcePath.includes("node_modules") ||
        context.resourcePath.includes("ant.design.pro.less") ||
        context.resourcePath.includes("global.less") ||
        context.resourcePath.includes(".scss")
      ) {
        return localName;
      }
      const match = context.resourcePath.match(/src(.*)/);
      if (match && match[1]) {
        const antdProPath = match[1].replace(".less", "");
        const arr = antdProPath
          .split("/")
          .map((a) => a.replace(/([A-Z])/g, "-$1"))
          .map((a) => a.toLowerCase());
        return `antd-pro${arr.join("-")}-${localName}`.replace(/--/g, "-");
      }
      return localName;
    },
  },

  // chainWebpack: webpackPlugin,
  cssnano: {
    mergeRules: false,
  },

  // extra configuration for egg
  runtimePublicPath: true,
  hash: true,
  outputPath: "../.public",
  manifest: {
    fileName: "../.public/manifest.json",
    publicPath: "",
  },

  copy: ["./src/assets/favicon.ico"],
  history: "hash",
  // exportStatic: {
  //   // htmlSuffix: true,
  //   dynamicRoot: true,
  // },
  sass: {},
};
