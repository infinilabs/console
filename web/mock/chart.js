// Copyright (C) INFINI Labs & INFINI LIMITED.
//
// The INFINI Console is offered under the GNU Affero General Public License v3.0
// and as commercial software.
//
// For commercial licensing, contact us at:
//   - Website: infinilabs.com
//   - Email: hello@infini.ltd
//
// Open Source licensed under AGPL V3:
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import moment from 'moment';

// mock data
const visitData = [];
const beginDay = new Date().getTime();

const fakeY = [7, 5, 4, 2, 4, 7, 5, 6, 5, 9, 6, 3, 1, 5, 3, 6, 5];
for (let i = 0; i < fakeY.length; i += 1) {
  visitData.push({
    x: moment(new Date(beginDay + 1000 * 60 * 60 * 24 * i)).format('YYYY-MM-DD'),
    y: fakeY[i],
  });
}

const visitData2 = [];
const fakeY2 = [1, 6, 4, 8, 3, 7, 2];
for (let i = 0; i < fakeY2.length; i += 1) {
  visitData2.push({
    x: moment(new Date(beginDay + 1000 * 60 * 60 * 24 * i)).format('YYYY-MM-DD'),
    y: fakeY2[i],
  });
}

const salesData = [];
for (let i = 0; i < 12; i += 1) {
  salesData.push({
    x: `${i + 1}月`,
    y: Math.floor(Math.random() * 1000) + 200,
  });
}
const searchData = [];
for (let i = 0; i < 50; i += 1) {
  searchData.push({
    index: i + 1,
    keyword: `搜索关键词-${i}`,
    count: Math.floor(Math.random() * 1000),
    range: Math.floor(Math.random() * 100),
    status: Math.floor((Math.random() * 10) % 2),
  });
}


const searchDataBaseTerms = [{
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

const searchDataInfini = [];
for (let i = 0; i < searchDataBaseTerms.length; i += 1) {
  searchDataInfini.push({
    index: i + 1,
    keyword: `${searchDataBaseTerms[i].name}`,
    count: Math.floor(Math.random() * 1000),
    range: Math.floor(Math.random() * 100),
    status: Math.floor((Math.random() * 10) % 2),
  });
}

const docTypeDataInfini = [
  {
    x: 'user',
    y: 39274,
  },
  {
    x: 'city',
    y: 31008,
  },
  {
    x: 'train',
    y: 27610,
  },
  {
    x: 'news',
    y: 19302,
  },
  {
    x: 'order',
    y: 17624,
  },
  {
    x: 'other',
    y: 12900,
  },
];

const salesTypeData = [
  {
    x: '家用电器',
    y: 4544,
  },
  {
    x: '食用酒水',
    y: 3321,
  },
  {
    x: '个护健康',
    y: 3113,
  },
  {
    x: '服饰箱包',
    y: 2341,
  },
  {
    x: '母婴产品',
    y: 1231,
  },
  {
    x: '其他',
    y: 1231,
  },
];

const salesTypeDataOnline = [
  {
    x: '家用电器',
    y: 244,
  },
  {
    x: '食用酒水',
    y: 321,
  },
  {
    x: '个护健康',
    y: 311,
  },
  {
    x: '服饰箱包',
    y: 41,
  },
  {
    x: '母婴产品',
    y: 121,
  },
  {
    x: '其他',
    y: 111,
  },
];

const salesTypeDataOffline = [
  {
    x: '家用电器',
    y: 99,
  },
  {
    x: '食用酒水',
    y: 188,
  },
  {
    x: '个护健康',
    y: 344,
  },
  {
    x: '服饰箱包',
    y: 255,
  },
  {
    x: '其他',
    y: 65,
  },
];

const offlineData = [];
for (let i = 0; i < 10; i += 1) {
  offlineData.push({
    name: `Stores ${i}`,
    cvr: Math.ceil(Math.random() * 9) / 10,
  });
}
const offlineChartData = [];
for (let i = 0; i < 20; i += 1) {
  offlineChartData.push({
    x: new Date().getTime() + 1000 * 60 * 30 * i,
    y1: Math.floor(Math.random() * 100) + 10,
    y2: Math.floor(Math.random() * 100) + 10,
  });
}

const radarOriginData = [
  {
    name: '个人',
    ref: 10,
    koubei: 8,
    output: 4,
    contribute: 5,
    hot: 7,
  },
  {
    name: '团队',
    ref: 3,
    koubei: 9,
    output: 6,
    contribute: 3,
    hot: 1,
  },
  {
    name: '部门',
    ref: 4,
    koubei: 1,
    output: 6,
    contribute: 5,
    hot: 7,
  },
];

const radarData = [];
const radarTitleMap = {
  ref: '引用',
  koubei: '口碑',
  output: '产量',
  contribute: '贡献',
  hot: '热度',
};
radarOriginData.forEach(item => {
  Object.keys(item).forEach(key => {
    if (key !== 'name') {
      radarData.push({
        name: item.name,
        label: radarTitleMap[key],
        value: item[key],
      });
    }
  });
});

const getFakeChartData = {
  visitData,
  visitData2,
  salesData,
  searchData,
  offlineData,
  offlineChartData,
  salesTypeData,
  salesTypeDataOnline,
  salesTypeDataOffline,
  radarData,
  searchDataInfini,
  docTypeDataInfini,
};

export default {
  'GET /api/fake_chart_data': getFakeChartData,
};
