import img403Svg from "@/assets/exception/403.svg";
import img404Svg from "@/assets/exception/404.svg";
import img500Svg from "@/assets/exception/500.svg";

const config = {
  403: {
    img: img403Svg,
    title: "403",
    desc: "抱歉，你无权访问该页面",
  },
  404: {
    img: img404Svg,
    title: "404",
    desc: "抱歉，你访问的页面不存在",
  },
  500: {
    img: img500Svg,
    title: "500",
    desc: "抱歉，服务器出错了",
  },
  empty: {
    img: img404Svg,
    title: "找不到数据",
    desc: "当前集群找到相关数据",
  },
  app: {
    img: img500Svg,
    title: "Applcation error",
    desc: "抱歉，应用程序出错了",
  },
};

export default config;
