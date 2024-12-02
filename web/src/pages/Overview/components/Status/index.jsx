import { Spin } from "antd";
import PieChart from "../PieChart";
import { Link } from "umi";

export default (props) => {
  const { title, icon, data = [], loading, linkTo } = props;

  return (
    <>
      {loading ? (
        <Spin spinning={true} />
      ) : (
        <Link
          to={linkTo}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
        >
          {/* <div style={{ width: "100%", height: "100%" }}> */}
          <PieChart data={data} />
          {/* </div> */}
        </Link>
      )}
    </>
  );
};
