import React, { useEffect, useRef, useState } from 'react';

const TOLERANCE = 0.05;
const CHILD_SIZE_RATIO = 0.8; 

type ElementWithDimensions = {
  offsetHeight: number;
  offsetWidth: number;
};

type Props = {
  children: React.ReactElement,
  target?: React.Ref<any> | ElementWithDimensions,
  height: number,
  width: number,
};

const _multiplierForElement = (element, targetWidth, targetHeight, ratio) => {
  const contentWidth = element.offsetWidth;
  const contentHeight = element.offsetHeight;

  const widthMultiplier = (targetWidth * ratio) / contentWidth;
  const heightMultiplier = (targetHeight * ratio) / contentHeight;

  return Math.min(widthMultiplier, heightMultiplier);
};

const isValidFontSize = (fontSize) => fontSize !== 0 && Number.isFinite(fontSize);

const useAutoFontSize = (target, _container, height, width, ratio, onFontSizeChange) => {
  const [fontSize, setFontSize] = useState(20);

  useEffect(() => {
    const container = target ? { current: { children: [target] } } : _container;
    const containerChildren = container?.current?.children;

    if (!containerChildren || containerChildren.length <= 0) {
      return;
    }

    const contentElement = containerChildren[0];
    const multiplier = _multiplierForElement(contentElement, width, height, ratio);

    if (Math.abs(1 - multiplier) <= TOLERANCE) {
      return;
    }

    const newFontSize = Math.floor(fontSize * multiplier);

    if (newFontSize !== fontSize && isValidFontSize(newFontSize)) {
      setFontSize(newFontSize);
      onFontSizeChange && onFontSizeChange(newFontSize)
    }
  }, [target, _container, fontSize, height, width]);

  return fontSize;
};

const AutoFontSizer = ({ children, target, height, width, ratio = CHILD_SIZE_RATIO, onFontSizeChange }: Props) => {
  const _container = useRef<HTMLElement | undefined>();
  const fontSize = useAutoFontSize(target, _container, height, width, ratio, onFontSizeChange);
  const _mixedContainer: { current } = _container;

  return (
    <div style={{ width: '100%', height: '100%', fontSize }} ref={_mixedContainer}>
      {children}
    </div>
  );
};

AutoFontSizer.defaultProps = {
  target: null,
};

export default AutoFontSizer;
