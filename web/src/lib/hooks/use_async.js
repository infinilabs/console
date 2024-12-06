import * as React from "react";

export default function useAsync(callback, dependencies = [], runInInit = true) {
  const loadingRef = React.useRef(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [value, setValue] = React.useState();

  const callbackMemoized = React.useCallback(() => {
    if (loadingRef.current) {
      return { loading: true, error, value };
    }
    loadingRef.current = true;
    setLoading(true);
    setError(undefined);
    // setValue(undefined);
    callback()
      .then(setValue)
      .catch(setError)
      .finally(() => {
        loadingRef.current = false;
        setLoading(false);
      });
  }, dependencies);

  React.useEffect(() => {
    if (runInInit) {
      callbackMemoized();
    }
  }, [callbackMemoized, runInInit]);

  return { run: callbackMemoized, loading, error, value };
}