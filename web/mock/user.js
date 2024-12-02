// 代码中会兼容本地 service mock 以及部署站点的静态数据
export default {
  // 支持值为 Object 和 Array
  "GET /account/current_user": function(req, res) {
    res.send({
      name: "INFINI Labs",
      avatar: "",
      userid: "10001",
      email: "hello@infini.ltd",
      signature: "极限科技 - 专业的开源搜索与实时数据分析整体解决方案提供商。",
      title: "首席设计师",
      group: "INFINI Labs － UED",
      tags: [
        {
          key: "0",
          label: "很有想法的",
        },
        {
          key: "1",
          label: "专注设计",
        },
      ],
      notifyCount: 12,
      country: "China",
      geographic: {
        province: {
          label: "湖南省",
          key: "330000",
        },
        city: {
          label: "长沙市",
          key: "330100",
        },
      },
      address: "岳麓区湘江金融中心",
      phone: "4001399200",
    });
  },
  // GET POST 可省略
  // 'GET /api/users': [
  //   {
  //     key: '1',
  //     name: 'John Brown',
  //     age: 32,
  //     address: 'New York No. 1 Lake Park',
  //   },
  //   {
  //     key: '2',
  //     name: 'Jim Green',
  //     age: 42,
  //     address: 'London No. 1 Lake Park',
  //   },
  //   {
  //     key: '3',
  //     name: 'Joe Black',
  //     age: 32,
  //     address: 'Sidney No. 1 Lake Park',
  //   },
  // ],
  // 'POST /account/login': (req, res) => {
  //   const { password, userName, type } = req.body;
  //   if (password === '888888' && userName === 'admin') {
  //     res.send({
  //       status: 'ok',
  //       type,
  //       currentAuthority: 'admin',
  //       userid: '10001',
  //     });
  //     return;
  //   }
  //   if (password === '123456' && userName === 'user') {
  //     res.send({
  //       status: 'ok',
  //       type,
  //       currentAuthority: 'user',
  //       userid: '10002',
  //     });
  //     return;
  //   }
  //   res.send({
  //     status: 'error',
  //     type,
  //     currentAuthority: 'guest',
  //   });
  // },
  // 'POST /api/register': (req, res) => {
  //   res.send({ status: 'ok', currentAuthority: 'user' });
  // },
  // 'GET /api/500': (req, res) => {
  //   res.status(500).send({
  //     timestamp: 1513932555104,
  //     status: 500,
  //     error: 'error',
  //     message: 'error',
  //     path: '/base/category/list',
  //   });
  // },
  // 'GET /api/404': (req, res) => {
  //   res.status(404).send({
  //     timestamp: 1513932643431,
  //     status: 404,
  //     error: 'Not Found',
  //     message: 'No message available',
  //     path: '/base/category/list/2121212',
  //   });
  // },
  // 'GET /api/403': (req, res) => {
  //   res.status(403).send({
  //     timestamp: 1513932555104,
  //     status: 403,
  //     error: 'Unauthorized',
  //     message: 'Unauthorized',
  //     path: '/base/category/list',
  //   });
  // },
  // 'GET /api/401': (req, res) => {
  //   res.status(401).send({
  //     timestamp: 1513932555104,
  //     status: 401,
  //     error: 'Unauthorized',
  //     message: 'Unauthorized',
  //     path: '/base/category/list',
  //   });
  // },
};
