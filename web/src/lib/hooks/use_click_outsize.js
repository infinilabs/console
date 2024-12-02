import { useEffect, useRef } from "react";

export function useOnClickOutside(handler) {
  const ref = useRef();
  useEffect(
    () => {
      const listener = (event) => {
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }
        handler(event);
      };

      if (window.PointerEvent) {
        document.addEventListener("pointerdown", listener);
      } else {
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
      }

      return () => {
        if (window.PointerEvent) {
          document.removeEventListener("pointerdown", listener);
        } else {
          document.removeEventListener("mousedown", listener);
          document.removeEventListener("touchstart", listener);
        }
      };
    },
    // Add ref and handler to effect dependencies
    // It's worth noting that because passed in handler is a new ...
    // ... function on every render that will cause this effect ...
    // ... callback/cleanup to run every render. It's not a big deal ...
    // ... but to optimize you can wrap handler in useCallback before ...
    // ... passing it into this hook.
    [handler]
  );
  return [ref];
}
