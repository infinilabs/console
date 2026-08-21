import Markdown from "@/components/Markdown";
import { Card } from "antd";
import { useState, useCallback, useRef, useEffect } from "react";
import { formatMessage } from "umi/locale";
import { stripDuplicatedAlertTitle } from "../../utils/message";

export default ({ message, title }) => {
  const [state, setState] = useState({
    hasMore: false,
    style: { maxHeight: 110, overflowY: "hidden" },
  });
  const content = stripDuplicatedAlertTitle(message, title);
  const itemRef = useCallback((node) => {
    setTimeout(() => {
      if (node && node.scrollHeight > node.offsetHeight) {
        setState((st) => {
          return {
            ...st,
            hasMore: true,
          };
        });
      }
    }, 1000);
  }, []);
  return (
    <Card
      size={"small"}
      title={formatMessage({ id: "alert.rule.form.label.event_message" })}
    >
      <div ref={itemRef} style={state.style}>
        <Markdown source={content} />
      </div>
      {state.hasMore ? (
        <div style={{ marginTop: 5 }}>
          <a
            onClick={() => {
              setState({
                hasMore: false,
                style: {},
              });
            }}
          >
            {formatMessage({ id: "alert.message.detail.label.view_more" })}
          </a>
        </div>
      ) : null}
    </Card>
  );
};
