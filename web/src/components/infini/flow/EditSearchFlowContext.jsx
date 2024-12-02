import React, { createContext } from "react";

const EditFlowContext = createContext({});
export const useEditFlow = () => {
  return React.useContext(EditFlowContext);
};
export const EditSearchFlowProvider = ({ children, value }) => {
  return (
    <EditFlowContext.Provider value={value}>
      {children}
    </EditFlowContext.Provider>
  );
};

const EditPropertiesContext = createContext({});

export const useEditProperties = () => {
  return React.useContext(EditPropertiesContext);
};
export const EditPropertiesProvider = ({ children, value }) => {
  return (
    <EditPropertiesContext.Provider value={value}>
      {children}
    </EditPropertiesContext.Provider>
  );
};
