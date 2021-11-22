import * as React from "react";

export default function useAsync(callback, dependencies = []) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState();
  const [value, setValue] = React.useState();

  const callbackMemoized = React.useCallback(() => {
    setLoading(true);
    setError(undefined);
    // setValue(undefined);
    callback()
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false));
  }, dependencies);

  React.useEffect(() => {
    callbackMemoized();
  }, [callbackMemoized]);

  return { loading, error, value };
}
