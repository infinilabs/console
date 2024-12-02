import React, { useReducer } from "react";

const SearchFlowFormContext = React.createContext();
export const useSearchFlowForm = () => {
  return React.useContext(SearchFlowFormContext);
};

export const SearchFlowFormProvider = ({ children, reducer }) => {
  const [state, dispatch] = useReducer(reducer, { current: 0 });

  return (
    <SearchFlowFormContext.Provider value={{ state, dispatch }}>
      {children}
    </SearchFlowFormContext.Provider>
  );
};
