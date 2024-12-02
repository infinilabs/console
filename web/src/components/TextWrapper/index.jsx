import { Icon } from "antd";
import { useCallback, useState } from "react";
export default ({initialHeight = 40, maxHeight=500, children})=>{
  const [state, setState] = useState({
    hasMore: false,
    style: { height: initialHeight, overflowY: "hidden"},
  });
  const itemRef = useCallback((node) => {
    if (node && node.scrollHeight > node.offsetHeight) {
      setState((st) => {
        return {
          ...st,
          hasMore: true,
        };
      });
    }
  }, []);

  return (
    <div>
      <div ref={itemRef} style={state.style}>
        {children}
      </div>
      {state.hasMore ? (
        <div style={{textAlign:"center", marginTop:10}}>
          <a
            onClick={() => {
              setState({
                hasMore: false,
                style: {maxHeight, overflow:"scroll"},
              });
            }}
          >
            <Icon type="down"/>
          </a>
        </div>
      ) : null}
    </div>
  );
}