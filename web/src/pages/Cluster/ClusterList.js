import React, { Component } from 'react';
import {List,Card,Tag} from 'antd';
import {Link} from 'umi';
import {extendHex, defineGrid} from 'honeycomb-grid';
import { SVG } from '@svgdotjs/svg.js'
import { connect } from 'dva';
import styles from './ClusterItem.less';

@connect(({ clusterMonitor }) => ({
  clusterMonitor
}))
class ClusterList extends React.Component{
  componentDidMount(){
    let {dispatch} = this.props;
    dispatch({
      type: 'clusterMonitor/fetchClusterList',   
    });
  }
  render(){
    let data = this.props.clusterMonitor.clusterList || [];
    return (
      <div>
        <List
          grid={{
            gutter: 8,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
          dataSource={data}
          renderItem={item => (
            <List.Item key={item.name}>
              <Card title={item.name + ": "+ item.nodes.length}
               extra={<Link to={"/cluster/monitoring/" + item.name}>查看更多</Link>}
              >
                <div>
                  {/* {item.nodes.map(node => {
                    return (<a><Tag style={{marginBottom:5}} color={node.status}>{node.name}</Tag></a>);
                  })} */}
                  <ClusterItem data={item} />
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    );
  }
}

class ClusterItem extends Component {
  componentDidMount(){
    
    this.root.addEventListener("click", function({offsetX, offsetY}){
      const hexCoordinates = Grid.pointToHex(offsetX, offsetY)
      let hex = grid.get(hexCoordinates);
      if(!hex || !hex.polygon){
        return
      }
      //console.log(hex.cartesian());
    })
    const draw = SVG().addTo(this.root).size('100%', '100%')

    let data = this.props.data;
    const rect = { width: 4, height: 20 };
    
    const Hex = extendHex({
      size: 30,
      render(draw, idx) {
        const position = this.toPoint()
        const centerPosition = this.center().add(position)
        this.draw = draw
        this.group = this.draw.group()
        this.group.mouseenter(() => {
          //this.lastStroke = this.polygon.attr('stroke');
          this.polygon.attr({stroke: '#fff'});
          // this.lastFill = this.polygon.attr('fill');
          // this.polygon.attr({fill: '#1890FF'})
        }).mouseleave(()=>{
          //this.polygon.attr({fill: this.lastFill})
          this.polygon.attr('stroke', '#999')
        }) //.css('cursor', 'pointer')
        this.polygon = this.group
          .polygon(this.corners().map(({ x, y }) => `${x},${y}`))
          .fill(data.nodes[idx-1].status)
          .stroke({ width: 1, color: '#999' })
          .translate(position.x, position.y)
    
        const fontSize = 12
        this.group
          .text(data.nodes[idx-1].name)
          .font({
            size: fontSize,
            anchor: 'middle',
            leading: 1.4,
            fill: '#ccc'
          })
          .translate(centerPosition.x, centerPosition.y - fontSize)
      }
    })
    const Grid = defineGrid(Hex)
   
    let grid = Grid.rectangle({
      ...rect,
      onCreate: (hex) => {
        const { x, y } = hex.toPoint()
        let idx = (hex.y * rect.width + hex.x + 1);
        if( idx > data.nodes.length){
          return
        }
        hex.render(draw, idx)
      }
    })
  }
  render(){
    return (
      <div className={styles.clusterItem} ref={ref=>this.root=ref}></div>
    )
  }
}

export {ClusterItem};
export default ClusterList;