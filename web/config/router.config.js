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
      { path: '/', redirect: '/platform/gateway' },
      {
        path: '/platform',
        name: 'platform',
        icon: 'dashboard',
        routes: [
      //      { path: '/', redirect: '/platform/gateway' },
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
            component: './DataManagement/Indices',
            routes: [
              {
                path: '/data/indices',
                redirect: '/data/indices/summary',
              },
              {
                path: '/data/indices/summary',
                component: './DataManagement/IndexSummary',
              },
              {
                path: '/data/indices/doc',
                component: './DataManagement/Document',
              },
              {
                path: '/data/indices/template',
                component: './DataManagement/IndexTemplate',
              },
              {
                path: '/data/indices/ilm',
                component: './DataManagement/IndexLifeCycle',
              },
            ]
          }, {
            path: '/data/backup',
            name: 'snapshot',
            component: './DataManagement/Backup',
            routes: [
              {
                path: '/data/backup',
                redirect: '/data/backup/bakandrestore',
              },
              {
                path: '/data/backup/bakandrestore',
                component: './DataManagement/backup/BakAndRestore',
              },{
                path: '/data/backup/bakcycle',
                component: './DataManagement/backup/BakCycle',
              }
            ]
          }, {
            path: '/data/rebuild',
            name: 'rebuild',
            component: './DataManagement/Rebuild',
          }, {
            path: '/data/import',
            name: 'export',
            component: './DataManagement/Import',
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
              component: './SearchManage/template/Template',
              routes: [
                  {
                      path: '/search/template',
                      redirect: '/search/template/summary',
                  },
                  {
                      path: '/search/template/summary',
                      component: './SearchManage/template/Summary',
                  },
                  {
                      path: '/search/template/template',
                      component: './SearchManage/template/SearchTemplate',
                  },
                  {
                      path: '/search/template/param',
                      component: './SearchManage/template/Param',
                  },
                  {
                      path: '/search/template/history',
                      component: './SearchManage/template/History',
                  },
              ]
          }, {
            path: '/search/alias',
            name: 'alias',
            component: './SearchManage/alias/Alias',
                routes: [
                    {
                        path: '/search/alias',
                        redirect: '/search/alias/index',
                    },
                    {
                        path: '/search/alias/index',
                        component: './SearchManage/alias/AliasManage',
                    },
                    {
                        path: '/search/alias/param',
                        component: './SearchManage/alias/Param',
                    },
                    {
                        path: '/search/alias/rule',
                        component: './SearchManage/alias/Rule',
                    }
                ]
          }, {
            path: '/search/dict',
            name: 'dict',
            component: './SearchManage/dict/Dict',
                routes: [
                    {
                        path: '/search/dict',
                        redirect: '/search/dict/professional',
                    },
                    {
                        path: '/search/dict/professional',
                        component: './SearchManage/dict/Professional',
                    },
                    {
                        path: '/search/dict/common',
                        component: './SearchManage/dict/Common',
                    }
                ]
          }, {
            path: '/search/analyzer',
            name: 'analyzer',
            component: './SearchManage/analyzer/Analyzer',
                routes: [
                    {
                        path: '/search/analyzer',
                        redirect: '/search/analyzer/manage',
                    },
                    {
                        path: '/search/analyzer/manage',
                        component: './SearchManage/analyzer/Manage',
                    },
                    {
                        path: '/search/analyzer/test',
                        component: './SearchManage/analyzer/AnalyzerTest',
                    }
                ]
          }, {
            path: '/search/nlp',
            name: 'nlp',
            component: './SearchManage/nlp/NLP',
            routes: [
                {
                    path: '/search/nlp',
                    redirect: '/search/nlp/query',
                },
                {
                    path: '/search/nlp/query',
                    component: './SearchManage/nlp/Query',
                },
                {
                    path: '/search/nlp/intention',
                    component: './SearchManage/nlp/Intention',
                },
                {
                    path: '/search/nlp/knowledge',
                    component: './SearchManage/nlp/Knowledge',
                },
                {
                    path: '/search/nlp/text',
                    component: './SearchManage/nlp/Text',
                }
            ]
          },
        ]
      },

      //settings
      {
        path: '/system',
        name: 'system',
        icon: 'setting',
        routes: [
          {
            path: '/system/settings',
            name: 'settings',
            component: './System/Settings/Base',
              hideChildrenInMenu: true,
              routes: [
                  {
                      path: '/system/settings',
                      redirect: '/system/settings/global',
                  },
                  {
                      path: '/system/settings/global',
                      name: 'global',
                      component: './System/Settings/Global',
                  }, {
                      path: '/system/settings/gateway',
                      name: 'gateway',
                      component: './System/Settings/Gateway',
                  },
              ]
          },
            {
            path: '/system/security',
            name: 'security',
            component: './System/Security/Base',
            hideChildrenInMenu: true,
            routes: [
                {
                    path: '/system/security',
                    redirect: '/system/security/general',
                },
                {
                    path: '/system/security/general',
                    name: 'general',
                    component: './System/Security/General',
                }, {
                    path: '/system/security/sso',
                    name: 'sso',
                    component: './System/Security/SSO',
                }, {
                    path: '/system/security/roles',
                    name: 'roles',
                    component: './System/Security/Roles',
                }, {
                    path: '/system/security/users',
                    name: 'users',
                    component: './System/Security/Users',
                }, {
                    path: '/system/security/certs',
                    name: 'certs',
                    component: './System/Security/Certs',
                },
            ]
          }, {
            path: '/system/logs',
            name: 'logs',
            component: './System/Logs/Base',
            hideChildrenInMenu: true,
            routes: [
            {
                path: '/system/logs',
                redirect: '/system/logs/overview',
            },
            {
                path: '/system/logs/overview',
                name: 'overview',
                component: './System/Logs/Overview',
            }, {
                path: '/system/logs/audit',
                name: 'audit',
                component: './System/Logs/Audit',
            }, {
                path: '/system/logs/query',
                name: 'query',
                component: './System/Logs/Audit',
            }, {
                path: '/system/logs/slow',
                name: 'slow',
                component: './System/Logs/Audit',
            },
            ]
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
