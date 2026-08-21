import { Link } from "umi";
import { SearchEngineIcon } from "@/lib/search_engines";
import "./index.scss";

export default ({ name, distribution = "", linkTo = "", id = "" }) => {
  if (linkTo === "") {
    linkTo = `/cluster/monitor/elasticsearch/${id}`;
  }
  return (
    <Link to={linkTo} className="cluster-name-link">
      <span className="cluster-name-link__icon">
        <SearchEngineIcon
          distribution={distribution}
          width="18px"
          height="18px"
        />
      </span>
      <span className="cluster-name-link__text">{name}</span>
    </Link>
  );
};
