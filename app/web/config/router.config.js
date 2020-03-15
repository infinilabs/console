export default [
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      /*{ path: '/user/login', component: '' },
      { path: '/user/register', component: './User/Register' },
      { path: '/user/register-result', component: './User/RegisterResult' },
      */
    ],
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    //Routes: ['src/pages/Authorized'],
    authority: ['admin', 'user'],
    routes: [
      // dashboard
      { path: '/', redirect: '/dashboard/analysis' },
      {
        path: '/dashboard',
        name: 'dashboard',
        icon: 'dashboard',
        routes: [
          {
            path: '/dashboard/analysis',
            name: 'collect',
            component: './helloworld',
          },
          {
            path: '/dashboard/monitor',
            name: 'notification',
            //component: './Dashboard/Monitor',
          },
          {
            path: '/dashboard/workplace',
            name: 'logging',
            //component: './Dashboard/Workplace',
          },
          {
              path:'/dashboard/',
              name:'gateway',
          },
        ],
      },
      {
        path: '/agents',
        name: 'agents',
        icon: 'dashboard',
        routes: [
          {
            path: '/agents/overview',
            name: 'overview',
            component: './helloworld',
          }
        ],
      }
    ],
  }
];
