import { useState, useCallback } from "react";
import { Icon } from "antd";
import { formatMessage } from "umi/locale";

export const ExpressionView = ({ items }) => {
  if (!items) {
    return null;
  }
  const [expressionVisible, setExpressionVisible] = useState(false);
  const toggleExpressionVisible = useCallback(() => {
    setExpressionVisible((v) => !v);
  }, [setExpressionVisible]);
  const expIdx = expressionVisible ? items.length - 1 : 0;
  return items.map((item, i) => {
    return (
      <div
        key={i}
        style={{ display: i > 0 && !expressionVisible ? "none" : "block" }}
      >
        {item.expression}({item.priority})
        {items.length > 1 && i === expIdx ? (
          <a onClick={toggleExpressionVisible} style={{ marginLeft: 5 }}>
            <Icon type={expressionVisible ? "up" : "down"} />{" "}
            {formatMessage({
              id: `form.button.${expressionVisible ? "collapse" : "expand"}`,
            })}
          </a>
        ) : null}
      </div>
    );
  });
};
