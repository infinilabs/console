const random_endpoints = [
    {
      os: 'Windows',
      name: "LENOVO",
      ip: '192.168.3.1',
      status: "active", //active/inactive/unmonitored
      last_active: "2020-03-21 11:12:33",
      tag: ["win10"]
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
  