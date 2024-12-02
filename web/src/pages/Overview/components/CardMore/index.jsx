import { Icon } from "antd";
import { Link } from "umi";
import "./index.scss";

export default ({ linkTo, external = false }) => {
  return (
    <div className="card-more">
      <div className="right">
        {external === true ? (
          <a href={linkTo} target="_blank">
            <Icon type="ellipsis" />
          </a>
        ) : (
          <Link to={linkTo}>
            <Icon type="ellipsis" />
          </Link>
        )}
      </div>
    </div>
  );
};
