import React, { useEffect, useRef, useState } from "react";
import { Tooltip, Timeline } from "antd";
import { formatMessage } from "umi/locale";
import "./index.scss";

const TOP_UPDATE_THRESHOLD = 6;

function Anchor({ links = [] }) {
  const [activeID, setActiveID] = useState(links[0]);
  const [anchorStyle, setAnchorStyle] = useState({ top: 0 });
  const wrapperRef = useRef(null);
  const anchorRef = useRef(null);
  const frameRef = useRef(null);
  const lastTopRef = useRef(0);

  useEffect(() => {
    setActiveID(links[0]);
    setAnchorStyle({ top: 0 });
    lastTopRef.current = 0;
  }, [links]);

  useEffect(() => {
    if (!links.length) {
      return undefined;
    }

    const updateAnchorPosition = () => {
      frameRef.current = null;
      const scrollPosition = window.scrollY || document.documentElement.scrollTop;
      let nextActiveID = links[0];

      for (let i = links.length - 1; i >= 0; i--) {
        const anchorElement = document.getElementById(links[i]);
        if (!anchorElement) {
          continue;
        }

        const offsetTop =
          anchorElement.getBoundingClientRect().top + window.pageYOffset;
        if (offsetTop <= scrollPosition + 120) {
          nextActiveID = anchorElement.id;
          break;
        }
      }

      setActiveID((prevActiveID) =>
        prevActiveID === nextActiveID ? prevActiveID : nextActiveID
      );

      if (!wrapperRef.current || !anchorRef.current) {
        return;
      }

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const activeElement = document.getElementById(nextActiveID);
      const activeRect = activeElement?.getBoundingClientRect();
      const anchorHeight = anchorRef.current.offsetHeight || 0;
      const wrapperHeight = wrapperRef.current.offsetHeight || 0;
      const viewportPadding = 16;
      const maxTopInWrapper = Math.max(wrapperHeight - anchorHeight, 0);
      const minVisibleTop = Math.max(0, viewportPadding - wrapperRect.top);
      const maxVisibleTop = Math.min(
        maxTopInWrapper,
        window.innerHeight - viewportPadding - wrapperRect.top - anchorHeight
      );

      let nextTop = activeRect ? activeRect.top - wrapperRect.top : 0;
      if (maxVisibleTop >= minVisibleTop) {
        nextTop = Math.max(nextTop, minVisibleTop);
        nextTop = Math.min(nextTop, maxVisibleTop);
      } else {
        nextTop = Math.max(nextTop, 0);
        nextTop = Math.min(nextTop, maxTopInWrapper);
      }

      if (Math.abs(lastTopRef.current - nextTop) >= TOP_UPDATE_THRESHOLD) {
        lastTopRef.current = nextTop;
        setAnchorStyle({
          top: nextTop,
        });
      }
    };

    const handleScroll = () => {
      if (frameRef.current !== null) {
        return;
      }
      frameRef.current = window.requestAnimationFrame(updateAnchorPosition);
    };

    updateAnchorPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [links]);

  const handleClick = (targetId) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const targetTop =
        targetElement.getBoundingClientRect().top + window.pageYOffset - 120;
      setActiveID(targetId);
      window.scrollTo({
        behavior: "smooth",
        top: Math.max(targetTop, 0),
      });
    }
  };

  if (!links.length) {
    return null;
  }

  return (
    <div className="p-anchor" ref={wrapperRef}>
      <div className="c-anchor" ref={anchorRef} style={anchorStyle}>
        <Timeline>
          {links.map((link) => (
            <Tooltip
              placement="leftTop"
              title={formatMessage({ id: `cluster.metrics.group.${link}` })}
              key={link}
            >
              <Timeline.Item
                color={activeID === link ? undefined : "gray"}
                onClick={() => handleClick(link)}
              >
                <span style={{ opacity: 0 }}>1</span>
              </Timeline.Item>
            </Tooltip>
          ))}
        </Timeline>
      </div>
    </div>
  );
}

export default Anchor;
