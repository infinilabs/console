import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, Timeline } from "antd";
import { formatMessage } from "umi/locale";
import { throttle } from 'lodash';
import "./index.scss";

function Anchor({ links }) {
  const [activeID, setActiveID] = useState(links[0]);
  const [isFixed, setIsFixed] = useState(false);
  const anchorRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {

      setTimeout(() => {
        const anchorElements = links.map(link => document.getElementById(link));
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;

        for (let i = anchorElements.length - 1; i >= 0; i--) {
          const anchorElement = anchorElements[i];
          if (!anchorElement) {
            continue
          }

          const offsetTop = anchorElement.offsetTop
          if (offsetTop <= scrollPosition - 200) {
            setActiveID(anchorElement.id);
            break;
          }
        }
      }, 1000)

      const offsetLeft = anchorRef.current.getBoundingClientRect().left;
      const offsetTop = anchorRef.current.getBoundingClientRect().top;
      const children = anchorRef.current.children[0];

      if (offsetTop <= 0) {
        setIsFixed(true);
        children.style.top = 0;
        children.style.left = offsetLeft + 'px';
      } else {
        setIsFixed(false);
      }
    };

    const throttledScroll = throttle(handleScroll, 1000);

    window.addEventListener('scroll', throttledScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []);

  const handleClick = (targetId) => {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      setActiveID(targetId)
      window.scrollTo({
        behavior: 'smooth',
        top: targetElement.offsetTop + 300,
      });
    }
  };

  return (
    <div ref={anchorRef} className='p-anchor'>
      <div className={`c-anchor ${isFixed ? 'fixed-top' : ''}`}>
        <Timeline >
          {links.map((link, index) => {
            const linkElement = document.getElementById(link)
            return linkElement ? (
              <Tooltip
                placement="leftTop"
                title={formatMessage({ id: `cluster.metrics.group.${link}` })}
                key={link}>
                <Timeline.Item
                  color={activeID === link ? undefined : 'gray'}
                  onClick={() => handleClick(link)}
                >
                  <span style={{ opacity: 0 }}>1</span>
                </Timeline.Item>
              </Tooltip>
            ) : null
          })}
        </Timeline>
      </div>
    </div>
  );
}

export default Anchor;
