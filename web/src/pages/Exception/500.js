import React from "react";
import { formatMessage } from "umi/locale";
import Link from "umi/link";
import Exception from "@/components/Exception";

const Exception500 = ({ location }) => {
  const { stack, error } = location.state || {};
  const desc = stack ? (
    <div
      style={{
        fontSize: 12,
        lineHeight: "1.6em",
        maxHeight: 300,
        overflow: "scroll",
        backgroundColor: "rgba(206, 17, 38, 0.05)",
        padding: 5,
      }}
    >
      <p style={{ color: "rgb(206, 17, 38)", fontSize: 16 }}>{error}</p>
      <p>{stack}</p>
    </div>
  ) : (
    formatMessage({ id: "app.exception.description.500" })
  );
  return (
    <Exception
      type="500"
      desc={desc}
      linkElement={Link}
      backText={formatMessage({ id: "app.exception.back" })}
    />
  );
};

export default Exception500;
