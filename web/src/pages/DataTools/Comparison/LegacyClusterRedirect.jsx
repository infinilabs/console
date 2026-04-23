import { useEffect } from "react";

export default (props) => {
  useEffect(() => {
    props.history.replace("/data_tools/comparison");
  }, [props.history]);

  return null;
};
