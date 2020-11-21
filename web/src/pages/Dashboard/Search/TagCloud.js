import React, { PureComponent } from 'react';

import _ from 'lodash';
import {
  G2,
  Chart,
  Geom,
  Axis,
  Tooltip,
  Coord,
  Label,
  Legend,
  View,
  Guide,
  Shape,
  Facet,
  Util
} from 'bizcharts';
import DataSet from '@antv/data-set';

const data = [{
  "name": "北京",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "广州",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "深圳",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "长沙",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "上海",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "成都",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "哈尔滨",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "海口",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "青岛",
  "value": Math.floor((Math.random() * 1000)),
  "category": "城市"
}, {
  "name": "G71",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "G121",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "T109",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "K81",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "Z13",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "Z121",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "G431",
  "value": Math.floor((Math.random() * 1000)),
  "category": "车次"
}, {
  "name": "退票",
  "value": Math.floor((Math.random() * 1000)),
  "category": "票务"
}, {
  "name": "春运",
  "value": Math.floor((Math.random() * 1000)),
  "category": "票务"
}, {
  "name": "学生票",
  "value": Math.floor((Math.random() * 1000)),
  "category": "票务"
}, {
  "name": "二等座",
  "value": Math.floor((Math.random() * 1000)),
  "category": "其他"
}, {
  "name": "订餐",
  "value": Math.floor((Math.random() * 1000)),
  "category": "其他"
}];

class TagCloud extends PureComponent {

  render() {

    function getTextAttrs(cfg) {
      return _.assign(
          {},
          cfg.style,
          {
            fillOpacity: cfg.opacity,
            fontSize: cfg.origin._origin.size,
            rotate: cfg.origin._origin.rotate,
            text: cfg.origin._origin.text,
            textAlign: "center",
            fontFamily: cfg.origin._origin.font,
            fill: cfg.color,
            textBaseline: "Alphabetic"
          }
      );
    } // 给point注册一个词云的shape

    Shape.registerShape("point", "cloud", {
      drawShape(cfg, container) {
        const attrs = getTextAttrs(cfg);
        return container.addShape("text", {
          attrs: _.assign(attrs, {
            x: cfg.x,
            y: cfg.y
          })
        });
      }
    });
    const dv = new DataSet.View().source(data);
    const range = dv.range("value");
    const min = range[0];
    const max = range[1];
    dv.transform({
      type: "tag-cloud",
      fields: ["name", "value"],
      size: [300, 200],
      font: "Verdana",
      padding: 0,
      timeInterval: 5000,// max execute time
      rotate() {
        let random = ~~(Math.random() * 4) % 4;
        if (random == 2) {
          random = 0;
        }
        return random * 90; // 0, 90, 270
      },
      fontSize(d) {
        if (d.value) {
          const divisor = (max - min) !== 0 ? (max - min) : 1;
          return ((d.value - min) / divisor) * (40 - 12) + 12;
        }
        return 0;
      }
    });
    const scale = {
      x: {
        nice: false
      },
      y: {
        nice: false
      }
    };

    return (
        <div>
          <Chart
              // height={window.innerHeight}
              width={window.innerWidth}
              height={200}
              data={dv}
              scale={scale}
              padding={0}
              forceFit
          >
            <Tooltip showTitle={false} />
            <Coord reflect="y" />
            <Geom
                type="point"
                position="x*y"
                color="category"
                shape="cloud"
                tooltip="value*category"
            />
          </Chart>
        </div>
    );
  }
}

export default TagCloud;
