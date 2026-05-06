// https://umijs.org/config/
import os from "os";
import pageRoutes from "./router.config";
import webpackPlugin from "./plugin.config";
import defaultSettings from "../src/defaultSettings";
import packageJson from "../package.json";

const ProxyTarget = "https://localhost:9000";

// 统一代理路径列表
const proxyPaths = [
  "/elasticsearch/",
  "/_search-center/",
  "/gateway/",
  "/_info",
  "/config/",
  "/environments/",
  "/pipeline/",
  "/queue/",
  "/task/",
  "/tasks/",
  "/debug/",
  "/alerting/",
  "/health",
  "/stats",
  "/keystore",
  "/user",
  "/role/",
  "/permission/",
  "/account/",
  "/notification/",
  "/agent/",
  "/insight/",
  "/host/",
  "/_platform/",
  "/migration/",
  "/comparison/",
  "/_license/",
  "/setup/",
  "/layout",
  "/credential",
  "/setting/",
  "/email/",
  "/data/",
  "/instance",
  "/collection/",
];

// 生成代理配置，统一加上 secure: false
const proxy = proxyPaths.reduce(function(acc, path) {
  acc[path] = {
    target: ProxyTarget,
    changeOrigin: true,
    secure: false, // 忽略自签名证书
  };
  return acc;
}, {});

export default {
  plugins: [
    [
      "umi-plugin-react",
      {
        antd: true,
        dva: { hmr: true },
        targets: { ie: 11 },
        locale: {
          enable: true,
          default: "en-US",
          baseNavigator: true,
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
  ],
  targets: { ie: 11 },
  define: {
    APP_TYPE: process.env.APP_TYPE || "",
    ENV: process.env.NODE_ENV,
    API_ENDPOINT: process.env.API_ENDPOINT || "",
    APP_DOMAIN: packageJson.domain,
    APP_TITLE: packageJson.title,
    APP_AUTHOR: packageJson.author,
    APP_OFFICIAL_WEBSITE: packageJson.official_website || "",
  },
  routes: pageRoutes,
  theme: { "primary-color": defaultSettings.primaryColor },
  proxy: proxy,
  ignoreMomentLocale: true,
  ...(process.env.NODE_ENV === "production" ? { devtool: false } : {}),
  lessLoaderOptions: { javascriptEnabled: true },
  disableRedirectHoist: true,
  cssLoaderOptions: {
    modules: true,
    getLocalIdent: function(context, localIdentName, localName) {
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
          .map(function(a) { return a.replace(/([A-Z])/g, "-$1"); })
          .map(function(a) { return a.toLowerCase(); });
        return `antd-pro${arr.join("-")}-${localName}`.replace(/--/g, "-");
      }
      return localName;
    },
  },
  cssnano: { mergeRules: false },
  runtimePublicPath: true,
  hash: true,
  outputPath: "../.public",
  manifest: { fileName: "../.public/manifest.json", publicPath: "" },
  copy: ["./src/assets/favicon.ico"],
  history: "hash",
  sass: {},
};
