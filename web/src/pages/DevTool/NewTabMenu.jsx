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
    this.state = {
      data: this.props.data || [],
    };
  }

  componentDidMount() {}


  render() {
    const { clusterStatus } = this.props;
    return (
      <div>
        <ClusterSelect 
          width={34}
          dropdownWidth={400}
          clusterList={this.state.data}
          clusterStatus={clusterStatus}
          onChange={(item) => this.handleItemClick(item)}
        >
          {this.props.children}
        </ClusterSelect>  
      </div>
    );
  }
}

export default NewTabMenu;
