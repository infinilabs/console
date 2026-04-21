import { SearchEngineIcon } from "@/lib/search_engines";
import { Tag } from "antd";
import "./ClusterItem.scss";
import { Link } from "umi";
import { formatMessage } from "umi/locale";


const ClusterItem = ({name, distribution, id, isSource=true, linkTo=""})=>{
  if (linkTo === "") {
    linkTo = `/cluster/monitor/elasticsearch/${id}`;
  }
  return (
    <div className="cluster-item">
      <dl>
        <dt>
          <SearchEngineIcon
            distribution={distribution}
            width="40px"
            height="40px"
          />
        </dt>
        <dd>
          <Tag className="tag">
            {isSource? formatMessage({id:"migration.table.field.source"}): formatMessage({id:"migration.table.field.target"})}
          </Tag>
          <Link to={linkTo}><span className="name">{name}</span></Link>
        </dd>
      </dl>
       
    </div>
  )
}

export default ClusterItem;