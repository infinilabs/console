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

var Mock = require('mockjs')
var data = Mock.mock({
  // 属性 list 的值是一个数组，其中含有 1 到 10 个元素
  'list|1-10': [{
      // 属性 id 是一个自增数，起始值为 1，每次增 1
      'id|+1': 1
  }]
});


const random_endpoints = [
    {
      os: 'Windows',
      name: "LENOVO",
      ip: '192.168.3.1',
      status: "active", //active/inactive/unmonitored
      last_active: "2020-03-21 11:12:33",
      tag: ["win10"],
      test: data
    },
    {
      os: "Linux",
      name: 'RaspberryPi',
      ip: '192.168.3.81',
      last_active: "2020-03-21 11:12:33",
      tag: ["win10"],
      credentials:{
        user: "pi",
        password: "elastic"
      }
    },
  ];

  let random_endpoint_pick = 0;



  
  export default {
    'get /endpoints/get_endpoints': function (req, res) {
      
      setTimeout(() => {
        res.json(random_endpoints);
      }, 3000);
    },

    'get /endpoints/get_endpoint/1': function (req, res) {
      const responseObj = random_endpoints[random_endpoint_pick % random_endpoints.length];
      random_endpoint_pick += 1;
      setTimeout(() => {
        res.json(responseObj);
      }, 3000);
    },
  };
  