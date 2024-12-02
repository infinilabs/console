import { getAuthEnabled } from "./utils/authority";
import request from "./utils/request";
import { setSetupRequired } from "@/utils/setup";
import { getHealth } from "@/services/system"
import PlatformContainer from "./components/PlatformContainer";
import React from "react";

if (!String.prototype.replaceAll) {
  String.prototype.replaceAll = function(search, replacement) {
    const pattern = typeof search === 'string' ? RegExp(search, 'g') : search;
    return this.replace(pattern, replacement);
  };
}

export async function patchRoutes(routes) {
  const healthRes = await getHealth();
  setSetupRequired(`${healthRes?.setup_required}`);
  if (getAuthEnabled() === "false") {
    routes = filterRoutes(routes, ["system.security"], "");
    // routes = disableAuth(routes);
  }
}


export function render(oldRoutes) {
  oldRoutes();
}

// function disableAuth(routes) {
//   return (routes || []).map((route) => {
//     if (route.name && route.authority) {
//       delete route.authority;
//     }
//     if (route.routes) {
//       route.routes = disableAuth(route.routes);
//     }
//     return route;
//   });
// }

function filterRoutes(routes, names, prefix) {
  return routes.filter((route) => {
    if (route.name) {
      const pn = `${prefix}.${route.name}`;
      if (names.includes(pn)) {
        return false;
      }
    }
    if (route.routes) {
      let pn = "";
      if (route.name) {
        pn = prefix ? `${prefix}.${route.name}` : route.name;
      }
      route.routes = filterRoutes(route.routes, names, pn);
    }
    return true;
  });
}


export function rootContainer(container) {
  return React.createElement(PlatformContainer, null, container);
}