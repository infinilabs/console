import React, { useEffect, useCallback, useState, createContext } from "react";
import {
  useZoomPanHelper,
  OnLoadParams,
  Elements,
  FlowExportObject,
  useStoreState,
} from "react-flow-renderer";
import { Button, Dropdown, Menu, Icon, Card } from "antd";
import { useEditFlow, useEditProperties } from "./EditSearchFlowContext";
import ConditionEditor from "./nodes/components/ConditionEditor";

export default ({ Component, visible = false, onVisibleChange }) => {
  const onCloseClick = () => {
    if (typeof onVisibleChange == "function") {
      onVisibleChange(false);
    }
  };
  // useEffect(() => {
  //   console.log(value);
  // }, [value]);
  const { setEditState, editState, flushYamlValue } = useEditProperties();
  const onSaveClick = () => {
    editState.setElements((els) => {
      els = els.map((el) => {
        if (editState.nodeID == el.id) {
          el.data.properties = {
            ...editState.properties,
          };
        }
        return el;
      });
      flushYamlValue(els);
      return els;
    });
    onVisibleChange(false);
  };
  const onChange = useCallback(
    (value) => {
      setEditState((state) => {
        state.properties = {
          ...value,
        };
        return {
          ...state,
        };
      });
    },
    [setEditState]
  );
  const onWhenChange = useCallback(
    (value) => {
      setEditState((state) => {
        if (value == null) {
          delete state.properties.when;
        } else {
          state.properties = {
            ...state.properties,
            when: value,
          };
        }

        return {
          ...state,
        };
      });
    },
    [setEditState]
  );
  return visible ? (
    <div className="editor-wrapper">
      <Card
        title="Eidt Properties"
        size="small"
        style={{ height: "100%" }}
        extra={<Icon type="close" onClick={onCloseClick} />}
        actions={[
          <Button icon="save" type="primary" onClick={onSaveClick}>
            Save
          </Button>,
        ]}
      >
        <Component value={editState.properties} onChange={onChange} />
        <div className="when-cnt">
          <ConditionEditor
            label="When"
            onChange={onWhenChange}
            value={editState.properties?.when}
          />
        </div>
      </Card>
    </div>
  ) : null;
};
