import React, { PureComponent } from 'react';

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

class UserStat extends PureComponent {

  render() {
    const data = [
      {
        name: "王飞",
        count: 2000
      },
      {
        name: "张晓萌",
        count: 1870
      },
      {
        name: "李静",
        count: 1468
      },
      {
        name: "黄靖宇",
        count: 1236
      },
      {
        name: "扬一鸣",
        count: 1098
      }
      ,
      {
        name: "管涛",
        count: 901
      }
      ,
      {
        name: "匡伯欣",
        count: 810
      }
      ,
      {
        name: "阳坚文",
        count: 780
      }
      ,
      {
        name: "覃文唯",
        count: 502
      }
      ,
      {
        name: "吕贤",
        count: 306
      }
    ];
    const ds = new DataSet();
    const dv = ds.createView().source(data);
    dv.source(data).transform({
      type: "sort",

      callback(a, b) {
        // 排序依据，和原生js的排序callback一致
        return a.count - b.count > 0;
      }
    });
    return (
        <div>
          <Chart height={400} data={dv} forceFit>
            <Coord transpose />
            <Axis
                name="name"
                label={{
                  offset: 12
                }}
            />
            <Axis name="count" />
            <Tooltip />
            <Geom type="interval" position="name*count" />
          </Chart>
        </div>
    );
  }
}

export default UserStat;
