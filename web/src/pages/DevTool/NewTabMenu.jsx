import * as React from "react";
import _ from "lodash";
import ClusterSelect from "@/components/ClusterSelect";

class NewTabMenu extends React.Component {
  handleItemClick = (item) => {
    const onItemClick = this.props.onItemClick;
    if (onItemClick && typeof onItemClick == "function") {
      onItemClick(item);
    }
  };
  constructor(props) {
    super(props);
  }

  componentDidMount() {}


  render() {
    const { clusterList, clusterStatus, clusterLoading, dispatch } = this.props;
    return (
      <div>
        <ClusterSelect 
          width={34}
          dropdownWidth={400}
          clusterList={clusterList}
          clusterStatus={clusterStatus}
          onChange={(item) => this.handleItemClick(item)}
          loading={clusterLoading}
          onRefresh={() => {
            dispatch({
              type: "global/fetchClusterList",
              payload: {
                size: 200,
                name: "",
              },
            });
          }}
        >
          {this.props.children}
        </ClusterSelect>  
      </div>
    );
  }
}

export default NewTabMenu;
