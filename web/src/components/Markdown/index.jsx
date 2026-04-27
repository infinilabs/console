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
        win.document.head.appendChild(el.cloneNode(true));
      });
    }

    const parentWin = win.parent;
    const parentDoc = parentWin.document;
    const parentEl = contentRef.parentElement || parentDoc.body;
    const parentStyles = parentWin.getComputedStyle(parentEl);
    const linkProbe = parentDoc.createElement("a");
    linkProbe.href = "#";
    linkProbe.style.position = "absolute";
    linkProbe.style.visibility = "hidden";
    linkProbe.style.pointerEvents = "none";
    parentDoc.body.appendChild(linkProbe);
    const linkColor = parentWin.getComputedStyle(linkProbe).color;
    linkProbe.remove();

    const themeStyleId = "markdown-frame-theme";
    const existingThemeStyle = win.document.getElementById(themeStyleId);
    if (existingThemeStyle) {
      existingThemeStyle.remove();
    }

    const themeStyle = win.document.createElement("style");
    themeStyle.id = themeStyleId;
    themeStyle.textContent = `
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        color: ${parentStyles.color};
        font-size: ${parentStyles.fontSize};
        line-height: ${parentStyles.lineHeight};
        font-family: ${parentStyles.fontFamily};
      }

      .markdown-body {
        color: ${parentStyles.color};
        background: transparent;
        font-size: ${parentStyles.fontSize};
        line-height: ${parentStyles.lineHeight};
        font-family: ${parentStyles.fontFamily};
      }

      .markdown-body p,
      .markdown-body li,
      .markdown-body blockquote,
      .markdown-body table,
      .markdown-body td,
      .markdown-body th,
      .markdown-body span,
      .markdown-body strong,
      .markdown-body em {
        color: inherit;
      }

      .markdown-body a,
      .markdown-body a:hover,
      .markdown-body a:focus,
      .markdown-body a:active,
      .markdown-body a:visited {
        color: ${linkColor};
      }
    `;
    win.document.head.appendChild(themeStyle);
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
