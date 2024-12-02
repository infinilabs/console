import React from "react";

const RouterContext = React.createContext({});
export const useGatewayRouter = () => {
  return React.useContext(RouterContext);
};

export const GatewayRouterProvider = ({ children, value }) => {
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};
