import { Link } from "react-router-dom";
import { encodeRFC3986URIComponent } from "@/utils/encode_uri";

export default ({ text, params }) => {

  const { clusterID, index, query, columns } = params;

  if (!clusterID || !index || !query) {
    return null
  }


  let query_string = `index=${encodeRFC3986URIComponent(index)}&query=${encodeRFC3986URIComponent(query)}`;
  if (columns) {
    query_string = columns.map((column) => `columns=${encodeRFC3986URIComponent(column)}`).join('&') + '&' + query_string;
  }
  let link = `/insight/discover/elasticsearch/${clusterID}/?${query_string}`;

  return (
    <Link to={link}>
        {text}
    </Link>
  )
}
