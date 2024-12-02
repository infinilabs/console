import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default ({ source, ref }) => {
  return (
    <div ref={ref}>
      <link
        data-frame
        type="text/css"
        rel="stylesheet"
        href="/static/markdown/css/index.css"
      />
      <IFrame styleSelector="link[data-frame]">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className="markdown-body"
          components={{ a: LinkRenderer }}
        >
          {source}
        </ReactMarkdown>
      </IFrame>
    </div>
  );
};

export const IFrame = ({ children, styleSelector, ...props }) => {
  const [contentRef, setContentRef] = useState(null);
  const mountNode = contentRef?.contentWindow?.document.body;

  useEffect(() => {
    if (!contentRef) {
      return;
    }
    const win = contentRef?.contentWindow;
    const linkEls = win.parent.document.querySelectorAll(styleSelector);
    if (linkEls.length) {
      linkEls.forEach((el) => {
        win.document.head.appendChild(el);
      });
    }
  }, [contentRef, styleSelector]);
  let docHeight = "auto";
  if (contentRef) {
    const win = contentRef?.contentWindow;
    if (win.document.body.children.length > 0) {
      const rootNode = win.document.body.children[0];
      docHeight = Math.max(rootNode.offsetHeight, rootNode.scrollHeight);
    }
    // docHeight = Math.max(
    //   win.document.body.scrollHeight,
    //   win.document.documentElement.scrollHeight,
    //   win.document.body.offsetHeight,
    //   win.document.documentElement.offsetHeight,
    //   win.document.body.clientHeight,
    //   win.document.documentElement.clientHeight
    // );
  }
  useEffect(() => {
    if (contentRef) {
      contentRef.style.height = docHeight + "px";
      contentRef.style.minHeight = "30px";
    }
  }, [docHeight]);

  return (
    <iframe {...props} ref={setContentRef} width="100%">
      {mountNode && createPortal(children, mountNode)}
    </iframe>
  );
};

function LinkRenderer(props = {}) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer">
      {props.children}
    </a>
  );
}
