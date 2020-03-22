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
  