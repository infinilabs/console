import React from "react";
import { getBezierPath, getMarkerEnd } from "react-flow-renderer";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data = {},
  arrowHeadType,
  markerEndId,
}) {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const markerEnd = getMarkerEnd(arrowHeadType, markerEndId);

  return (
    <>
      {/* <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      /> */}
      <path
        style={style}
        className="react-flow__edge-path-selector"
        d={edgePath}
        markerEnd={markerEnd}
        fillRule="evenodd"
      />
      <path
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        fillRule="evenodd"
      />
      <text>
        <textPath
          href={`#${id}`}
          style={{ fontSize: "12px" }}
          startOffset="50%"
          textAnchor="middle"
        >
          {data.text || "test label"}
        </textPath>
      </text>
    </>
  );
}
