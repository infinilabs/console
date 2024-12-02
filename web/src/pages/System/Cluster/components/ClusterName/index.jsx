import { Link } from "umi";
import { SearchEngineIcon } from "@/lib/search_engines";
import "./index.scss";

export default ({ name, distribution = "", linkTo = "", id = "" }) => {
  if (linkTo === "") {
    linkTo = `/cluster/monitor/elasticsearch/${id}`;
  }
  return (
    <Link to={linkTo} className="cluster-name-link">
      <SearchEngineIcon
        distribution={distribution}
        width="18px"
        height="18px"
      />
      <span>{name}</span>
    </Link>
  );
};
