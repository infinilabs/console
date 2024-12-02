// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

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