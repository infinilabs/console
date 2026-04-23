import { useEffect } from "react";

export default (props) => {
  useEffect(() => {
    props.history.replace("/data_tools/migration");
  }, [props.history]);

  return null;
};
