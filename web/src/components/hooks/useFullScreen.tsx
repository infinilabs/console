import React, {
    useCallback,
    useState,
    useRef,
    useEffect,
    useMemo,
  } from 'react';
  import fscreen from 'fscreen';
  
  export interface FullScreenHandle {
    active: boolean;
    enter: () => Promise<void>;
    exit: () => Promise<void>;
    node: React.MutableRefObject<HTMLDivElement | null>;
  }
  
  export interface FullScreenProps {
    handle: FullScreenHandle;
    children: any;
    onChange?: (state: boolean, handle: FullScreenHandle) => void;
    className?: string;
  }
  
  export function useFullScreenHandle(): FullScreenHandle {
    const [active, setActive] = useState<boolean>(false);
    const node = useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      const handleChange = () => {
        setActive(fscreen.fullscreenElement === node.current);
      };
      fscreen.addEventListener('fullscreenchange', handleChange);
      return () => fscreen.removeEventListener('fullscreenchange', handleChange);
    }, []);
  
    const enter = useCallback(() => {
      if (fscreen.fullscreenElement) {
        return fscreen.exitFullscreen().then(() => {
          return fscreen.requestFullscreen(node.current);
        });
      } else if (node.current) {
        return fscreen.requestFullscreen(node.current);
      }
    }, []);
  
    const exit = useCallback(() => {
      if (fscreen.fullscreenElement === node.current) {
        return fscreen.exitFullscreen();
      }
      return Promise.resolve();
    }, []);
  
    return useMemo(
      () => ({
        active,
        enter,
        exit,
        node,
      }),
      [active, enter, exit],
    );
  }
  
  export const FullScreen: React.FC<FullScreenProps> = ({
    handle,
    onChange,
    children,
    className,
  }) => {
    const classNames = [];
    if (className) {
      classNames.push(className);
    }
  
    classNames.push('infini-fullscreen');
  
    if (handle.active) {
      classNames.push('infini-fullscreen-enabled');
    }
  
    useEffect(() => {
      if (onChange) {
        onChange(handle.active, handle);
      }
    }, [handle.active]);
  
    return (
      <div
        className={classNames.join(' ')}
        ref={handle.node}
        style={handle.active ? { height: '100%', width: '100%' } : { width: '100%' }}
      >
        {children}
      </div>
    );
  };
  