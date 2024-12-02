import { Button, Popover } from "antd";
import { useRef, useState, useEffect } from "react";
import { formatMessage } from "umi/locale";
import RefreshEvery from "./RefreshEvery";

const ButtonGroup = Button.Group;

export default ({ onRefresh, setRefreshIntervalFlag }) => {
  const [refreshStart, setRefreshStart] = useState(false);

  const onRefreshClick = () => {
    onRefresh();
    setRefreshIntervalFlag(new Date().getTime());
  };

  return (
    <ButtonGroup>
      <Button
        type="primary"
        ghost
        icon="redo"
        onClick={() => {
          onRefreshClick();
        }}
      >
        {formatMessage({ id: "form.button.refresh" })}
      </Button>
      <Popover
        placement="topRight"
        content={
          <RefreshEvery
            start={refreshStart}
            onRefreshIntervalStart={() => {
              if (!refreshStart) {
                setRefreshStart(true);
              }
              onRefreshClick();
            }}
            onRefreshIntervalStop={() => {
              if (refreshStart) {
                setRefreshStart(false);
              }
              setRefreshIntervalFlag();
            }}
          />
        }
        title={formatMessage({ id: "component.refreshGroup.label.title" })}
      >
        <Button
          type="primary"
          ghost
          icon={refreshStart ? "pause" : "caret-right"}
          onClick={() => {
            setRefreshStart(!refreshStart);
          }}
        />
      </Popover>
    </ButtonGroup>
  );
};
