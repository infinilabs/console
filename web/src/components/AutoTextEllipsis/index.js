import { Tooltip } from "antd";
import { useEffect, useRef, useState } from "react";

export default (props) => {
    const { height = 21, width = '100%', children, showTooltip = true } = props;
    const [textHeight, setTextHeight] = useState(height);
    const textRef = useRef(null);

    const handleResize = () => {
        if (textRef.current) {
            setTextHeight(textRef.current.offsetHeight);
        }
    };
    
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
              const { width, height } = entry.contentRect;
              setTextHeight(height);
            });
        });
    
        if (textRef.current && showTooltip) {
            resizeObserver.observe(textRef.current);
        }
    
        return () => {
            if (textRef.current && showTooltip) {
                resizeObserver.unobserve(textRef.current);
            }
        };
    }, [showTooltip]);

    return (
        <div style={{ position: 'relative', width, height }} onClick={(e) => e.stopPropagation()}>
            <div ref={textRef} style={{ visibility: 'hidden'}}>
                {children}
            </div>
            {
                showTooltip && textHeight > height ? (
                    <Tooltip title={children} overlayStyle={{ maxWidth: 'unset !important'}}>
                        <div style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', height, width: '100%', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {children}
                        </div>
                    </Tooltip>
                ) : (
                    <div style={{ position: 'absolute', left: 0, top: 0 }}>
                        {children}
                    </div>
                )
            }
        </div>
    )
}