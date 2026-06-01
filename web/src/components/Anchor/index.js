import React, { useEffect, useRef, useState } from "react";
import { Tooltip, Timeline } from "antd";
import { formatMessage } from "umi/locale";
import { throttle } from "lodash";
import "./index.scss";

function Anchor({ links = [] }) {
  const [activeID, setActiveID] = useState(links[0]);
  const [anchorOffset, setAnchorOffset] = useState(0);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setActiveID(links[0]);
    setAnchorOffset(0);
  }, [links]);

  useEffect(() => {
    if (!links.length) {
      return undefined;
    }

    const handleScroll = () => {
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

      if (!wrapperRef.current) {
        return;
      }

      const activeElement = document.getElementById(nextActiveID);
      const timelineElement = wrapperRef.current.querySelector(".c-anchor");

      if (!activeElement || !timelineElement) {
        setAnchorOffset(0);
        return;
      }

      const containerTop =
        wrapperRef.current.getBoundingClientRect().top + window.pageYOffset;
      const targetOffset =
        activeElement.getBoundingClientRect().top +
        window.pageYOffset -
        containerTop;
      const maxOffset = Math.max(
        wrapperRef.current.offsetHeight - timelineElement.offsetHeight,
        0
      );

      setAnchorOffset(Math.min(Math.max(targetOffset, 0), maxOffset));
    };

    const throttledScroll = throttle(handleScroll, 100, {
      leading: true,
      trailing: true,
    });

    handleScroll();
    window.addEventListener("scroll", throttledScroll, { passive: true });
    window.addEventListener("resize", throttledScroll);

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("resize", throttledScroll);
      throttledScroll.cancel();
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
      <div
        className="c-anchor"
        style={{ transform: `translateY(${anchorOffset}px)` }}
      >
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
