import React, { memo, useCallback, useState } from "react";
import {
  useZoomPanHelper,
  OnLoadParams,
  Elements,
  FlowExportObject,
  useStoreState,
  getOutgoers,
} from "react-flow-renderer";
import { Button, Dropdown, Menu, Icon } from "antd";
import { getFiltersMap } from "./nodes/filters";
import { useEditFlow } from "./EditSearchFlowContext";
import { collectNodeValue } from "./nodes/filters";

const Controls = ({ rfInstance, setElements, onSaveClick }) => {
  const state = useStoreState((state) => state);

  return (
    <div className="save__controls">
      <Button onClick={onSaveClick} type="primary">
        Save
      </Button>
    </div>
  );
};

export default memo(Controls);
