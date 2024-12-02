import React from "react";

export const GlobalContext = React.createContext();
export const useGlobal = () => {
  return React.useContext(GlobalContext);
};

export const useGlobalClusters = () => {
  const{clusterList=[]} = useGlobal()
  const clusterM = {}
  clusterList.forEach((item)=>{
    clusterM[item.id] = item
  })
  return clusterM
}