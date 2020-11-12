export default [
  // user
  {
    path: '/user',
    component: '../layouts/UserLayout',
    routes: [
      { path: '/user', redirect: '/user/login' },
      { path: '/user/login', component: './User/Login' },
      { path: '/user/register', component: './User/Register' },
      { path: '/user/register-result', component: './User/RegisterResult' },
    ],
  },
  // app
  {
    path: '/',
    component: '../layouts/BasicLayout',
    Routes: ['src/pages/Authorized'],
    authority: ['admin', 'user'],
    routes: [
      // dashboard
      { path: '/', redirect: '/platform' },
      {
        path: '/platform',
        name: 'platform',
        icon: 'dashboard',
        component: './Dashboard/Analysis',
        routes: [
            {
              path: '/platform/gateway',
              name: 'gateway',
              component: './Dashboard/Analysis',
            }, {
              path: '/platform/cluster',
              name: 'cluster',
              component: './Dashboard/Monitor',
            }, {
              path: '/platform/tasks',
              name: 'tasks',
              component: './Dashboard/Workplace',
            }, {
              path: '/platform/search',
              name: 'search',
              component: './Dashboard/Search',
            },
        ]
      },

      //data
      {
        path: '/data',
        name: 'data',
        icon: 'database',
        routes: [
          {
            path: '/data/pipes',
            name: 'pipes',
            component: './DataManagement/Pipes',
            routes: [
              {
                path: '/data/pipes',
                redirect: '/data/pipes/logstash',
              },
              {
                path: '/data/pipes/logstash',
                component: './DataManagement/LogstashConfig',
              },
              {
                path: '/data/pipes/ingestpipeline',
                component: './DataManagement/IngestPipeline',
              },
            ]
          },{
            path: '/data/indices',
            name: 'index',
            // component: './DataManagement/Indices',
            // routes: [
            //   {
            //     path: '/data/indices',
            //     redirect: '/data/indices/summary',
            //   },
            //   {
            //     path: '/data/indices/summary',
            //     component: './DataManagement/IndexSummary',
            //   },
            //   {
            //     path: '/data/indices/doc',
            //     component: './DataManagement/Document',
            //   },
            //   {
            //     path: '/data/indices/template',
            //     component: './DataManagement/IndexTemplate',
            //   },
            //   {
            //     path: '/data/indices/ilm',
            //     component: './DataManagement/IndexLifeCycle',
            //   },
            // ]
          }, {
            path: '/list/table-list',
            name: 'snapshot',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'rebuild',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'export',
            component: './List/TableList',
          },
        ]
      },


      //search
      {
        path: '/search',
        name: 'search',
        icon: 'search',
        routes: [
          {
            path: '/search/template',
            name: 'template',
            component: './SearchManage/SearchTemplate',
          }, {
            path: '/search/alias',
            name: 'alias',
            component: './SearchManage/AliasManage',
          }, {
            path: '/search/dict',
            name: 'dict',
            component: './SearchManage/DictManage',
          }, {
            path: '/search/analyzer',
            name: 'analyzer',
            component: './SearchManage/AnalyzerManage',
          }, {
            path: '/search/nlp',
            name: 'nlp',
            component: './SearchManage/NLPManage',
          },
        ]
      },

      //settings
      {
        path: '/settings',
        name: 'settings',
        icon: 'setting',
        component: './List/TableList',
        routes: [
          {
            path: '/list/table-list',
            name: 'authentication',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'authorization',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'audit',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'certs',
            component: './List/TableList',
          }, {
            path: '/list/table-list',
            name: 'others',
            component: './List/TableList',
          },
        ]
      },

      // // forms
      // {
      //   path: '/form',
      //   icon: 'form',
      //   name: 'form',
      //   routes: [
      //     {
      //       path: '/form/basic-form',
      //       name: 'basicform',
      //       component: './Forms/BasicForm',
      //     },
      //     {
      //       path: '/form/step-form',
      //       name: 'stepform',
      //       component: './Forms/StepForm',
      //       hideChildrenInMenu: true,
      //       routes: [
      //         {
      //           path: '/form/step-form',
      //           name: 'stepform',
      //           redirect: '/form/step-form/info',
      //         },
      //         {
      //           path: '/form/step-form/info',
      //           name: 'info',
      //           component: './Forms/StepForm/Step1',
      //         },
      //         {
      //           path: '/form/step-form/confirm',
      //           name: 'confirm',
      //           component: './Forms/StepForm/Step2',
      //         },
      //         {
      //           path: '/form/step-form/result',
      //           name: 'result',
      //           component: './Forms/StepForm/Step3',
      //         },
      //       ],
      //     },
      //     {
      //       path: '/form/advanced-form',
      //       name: 'advancedform',
      //       authority: ['admin'],
      //       component: './Forms/AdvancedForm',
      //     },
      //   ],
      // },
      // // list
      // {
      //   path: '/list',
      //   icon: 'table',
      //   name: 'list',
      //   routes: [
      //     {
      //       path: '/list/table-list',
      //       name: 'searchtable',
      //       component: './List/TableList',
      //     },
      //     {
      //       path: '/list/basic-list',
      //       name: 'basiclist',
      //       component: './List/BasicList',
      //     },
      //     {
      //       path: '/list/card-list',
      //       name: 'cardlist',
      //       component: './List/CardList',
      //     },
      //     {
      //       path: '/list/search',
      //       name: 'searchlist',
      //       component: './List/List',
      //       routes: [
      //         {
      //           path: '/list/search',
      //           redirect: '/list/search/articles',
      //         },
      //         {
      //           path: '/list/search/articles',
      //           name: 'articles',
      //           component: './List/Articles',
      //         },
      //         {
      //           path: '/list/search/projects',
      //           name: 'projects',
      //           component: './List/Projects',
      //         },
      //         {
      //           path: '/list/search/applications',
      //           name: 'applications',
      //           component: './List/Applications',
      //         },
      //       ],
      //     },
      //   ],
      // },
      // {
      //   path: '/profile',
      //   name: 'profile',
      //   icon: 'profile',
      //   routes: [
      //     // profile
      //     {
      //       path: '/profile/basic',
      //       name: 'basic',
      //       component: './Profile/BasicProfile',
      //     },
      //     {
      //       path: '/profile/advanced',
      //       name: 'advanced',
      //       authority: ['admin'],
      //       component: './Profile/AdvancedProfile',
      //     },
      //   ],
      // },
      // {
      //   name: 'result',
      //   icon: 'check-circle-o',
      //   path: '/result',
      //   routes: [
      //     // result
      //     {
      //       path: '/result/success',
      //       name: 'success',
      //       component: './Result/Success',
      //     },
      //     { path: '/result/fail', name: 'fail', component: './Result/Error' },
      //   ],
      // },
      // {
      //   name: 'exception',
      //   icon: 'warning',
      //   path: '/exception',
      //   routes: [
      //     // exception
      //     {
      //       path: '/exception/403',
      //       name: 'not-permission',
      //       component: './Exception/403',
      //     },
      //     {
      //       path: '/exception/404',
      //       name: 'not-find',
      //       component: './Exception/404',
      //     },
      //     {
      //       path: '/exception/500',
      //       name: 'server-error',
      //       component: './Exception/500',
      //     },
      //     {
      //       path: '/exception/trigger',
      //       name: 'trigger',
      //       hideInMenu: true,
      //       component: './Exception/TriggerException',
      //     },
      //   ],
      // },
      // {
      //   name: 'account',
      //   icon: 'user',
      //   path: '/account',
      //   routes: [
      //     {
      //       path: '/account/center',
      //       name: 'center',
      //       component: './Account/Center/Center',
      //       routes: [
      //         {
      //           path: '/account/center',
      //           redirect: '/account/center/articles',
      //         },
      //         {
      //           path: '/account/center/articles',
      //           component: './Account/Center/Articles',
      //         },
      //         {
      //           path: '/account/center/applications',
      //           component: './Account/Center/Applications',
      //         },
      //         {
      //           path: '/account/center/projects',
      //           component: './Account/Center/Projects',
      //         },
      //       ],
      //     },
      //     {
      //       path: '/account/settings',
      //       name: 'settings',
      //       component: './Account/Settings/Info',
      //       routes: [
      //         {
      //           path: '/account/settings',
      //           redirect: '/account/settings/base',
      //         },
      //         {
      //           path: '/account/settings/base',
      //           component: './Account/Settings/BaseView',
      //         },
      //         {
      //           path: '/account/settings/security',
      //           component: './Account/Settings/SecurityView',
      //         },
      //         {
      //           path: '/account/settings/binding',
      //           component: './Account/Settings/BindingView',
      //         },
      //         {
      //           path: '/account/settings/notification',
      //           component: './Account/Settings/NotificationView',
      //         },
      //       ],
      //     },
      //   ],
      // },
      {
        component: '404',
      },
    ],
  },
];
