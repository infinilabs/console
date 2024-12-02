import { useGlobal } from "@/layouts/GlobalContext";
import { getAuthority, getAuthEnabled } from "@/utils/authority";
import { useEffect } from "react";
import { router } from "umi";
import { getSetupRequired } from "@/utils/setup";

export default (props) => {
  const userAuthority = getAuthority();
  const { menuData } = useGlobal();
  useEffect(() => {
    if (getSetupRequired() === 'true') {
      router.push("/guide/initialization");
    }
    if (getAuthEnabled() === "true") {
      //find authoriy page
      const tpath = findFirstAuthorityPath(menuData, userAuthority);
      if (tpath) {
        router.push(tpath);
      } else {
        router.push("/user/login");
      }
    } else {
      router.push("/cluster/overview");
    }
  }, []);
  return null;
};

const findFirstAuthorityPath = (menuData = [], userAuthority = []) => {
  if (!menuData || !menuData.length) {
    menuData = [];
  }
  if (!userAuthority || !userAuthority.length) {
    userAuthority = [];
  }
  for (let i = 0; i < menuData.length; i++) {
    const md = menuData[i];
    if (md.path == "/" && md.redirect != "/") {
      continue;
    }
    if (md.hideInMenu) {
      continue;
    }
    if (md.children) {
      if (md.authority && md.authority[0]) {
        if (!userAuthority.some((ua) => ua.startsWith(`${md.authority[0]}.`))) {
          continue;
        }
      }
      const tpath = findFirstAuthorityPath(md.children, userAuthority);

      if (tpath) {
        return tpath == "/" ? md.path : tpath;
      }
    } else {
      if (!md.authority) {
        return md.path;
      }
      if (userAuthority.some((ua) => md.authority.includes(ua))) {
        return md.path;
      }
    }
  }
};
