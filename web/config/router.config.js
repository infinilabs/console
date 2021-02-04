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
      // cluster
      { path: '/', redirect: '/cluster/overview' },
      {
        path: '/cluster',
        name: 'cluster',
        icon: 'cluster',
        routes: [
      //      { path: '/', redirect: '/platform/gateway' },
            {
              path: '/cluster/overview',
              name: 'overview',
              component: './Cluster/ClusterList',
            }, {
              path: '/cluster/monitoring/:name',
              name: 'cluster',
              component: './Cluster/ClusterMonitor',
              hideInMenu: true,
            }, {
              path: '/cluster/monitoring',
              name: 'monitoring',
              component: './Cluster/ClusterList',
            }, {
              path: '/cluster/settings',
              name: 'settings',
              component: './Cluster/Settings/Base',
              routes: [
                {
                  path: '/cluster/settings',
                  redirect: '/cluster/settings/repository',
                },
                {
                  path: '/cluster/settings/repository',
                  component: './Cluster/Settings/Repository',
                }
              ]
            }, {
              path: '/cluster/logging',
              name: 'logging',
              component: './Cluster/SearchMonitor',
            },

        ]
      },

      //data
      {
        path: '/data',
        name: 'data',
        icon: 'database',
        routes: [
          // {
          //   path: '/data/pipes',
          //   name: 'pipes',
          //   component: './DataManagement/Pipes',
          //   routes: [
          //     {
          //       path: '/data/pipes',
          //       redirect: '/data/pipes/logstash',
          //     },
          //     {
          //       path: '/data/pipes/logstash',
          //       component: './DataManagement/LogstashConfig',
          //     },
          //     {
          //       path: '/data/pipes/ingestpipeline',
          //       component: './DataManagement/IngestPipeline',
          //     },
          //   ]
          // },
          {
            path: '/data/overview',
            name: 'overview',
            component: './DataManagement/Indices',
          }, {
            path: '/data/index',
            name: 'index',
            component: './DataManagement/Indices',
          },{
            path: '/data/document',
            name: 'document',
            component: './DataManagement/Document',
          }, {
            path: '/data/template',
            name: 'template',
            component: './DataManagement/Indices',
          },
          // {
          //   path: '/data/rebuild/new',
          //   name: 'rebuild',
          //   component: './DataManagement/Rebuild',
          //   hideInMenu: true,
          // },
          {
            path: '/data/lifecycle',
            name: 'lifecycle',
            component: './DataManagement/Indices',
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
            path: '/search/overview',
            name: 'overview',
            component: './SearchManage/template/Template',
          },
          {
              path: '/search/template',
              name: 'template',
              component: './SearchManage/template/Template',
              routes: [
                  {
                      path: '/search/template',
                      redirect: '/search/template/template',
                  },
                  {
                      path: '/search/template/template',
                      component: './SearchManage/template/SearchTemplate',
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
                        component: './SearchManage/dict/Pro',
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
          }//, {
            //  path: '/search/nlp',
            // name: 'nlp',
            // component: './SearchManage/nlp/NLP',
            // routes: [
            //    {
            //        path: '/search/nlp',
            //        redirect: '/search/nlp/query',
            //    },
            //    {
            //       path: '/search/nlp/query',
            //        component: './SearchManage/nlp/Query',
            //  },
            //  {
            //      path: '/search/nlp/intention',
            //     component: './SearchManage/nlp/Intention',
            // },
            // {
            //     path: '/search/nlp/knowledge',
            //      component: './SearchManage/nlp/Knowledge',
            //  },
            // {
            //      path: '/search/nlp/text',
            //      component: './SearchManage/nlp/Text',
            //     }
            //]
            //},
        ]
      },

      //sync
      {
        path: '/sync',
        name: 'synchronize',
        icon: 'sync',
        routes: [
          {
            path: '/sync/overview',
            name: 'overview',
            component: './Synchronize/Pipes',
          },
          {
            path: '/sync/pipeline',
            name: 'pipeline',
            component: './Synchronize/Pipes',
            routes: [
              {
                path: '/sync/pipeline',
                redirect: '/sync/pipeline',
              },
              {
                path: '/sync/pipeline/ingestpipeline',
                component: './Synchronize/IngestPipeline',
              }, {
                path: '/sync/pipeline/logstash',
                component: './Synchronize/LogstashConfig',
              }]
          },{
            path: '/sync/rebuild',
            name: 'rebuild',
            component: './Synchronize/RebuildList',
          },{
            path: '/sync/inout',
            name: 'inout',
            component: './Synchronize/Import',
          }
        ]
      },

      //backup
      {
        path: '/backup',
        name: 'backup',
        icon: 'cloud',
        routes: [
          {
            path: '/backup/overview',
            name: 'overview',
            component: './SearchManage/template/Template',
          },
          {
            path: '/backup/index',
            name: 'index',
            component: './SearchManage/template/Template',
          },{
            path: '/backup/lifecycle',
            name: 'lifecycle',
            component: './SearchManage/template/Template',
          }
        ]
      },

      //settings
      {
        path: '/system',
        name: 'system',
        icon: 'setting',
        routes: [
          {
            path: '/system/cluster',
            name: 'cluster',
            component: './System/Settings/Base',
          },
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
                      component: './System/Settings/Global',
                  }, {
                      path: '/system/settings/gateway',
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
                    component: './System/Security/General',
                }, {
                    path: '/system/security/sso',
                    component: './System/Security/SSO',
                }, {
                    path: '/system/security/roles',
                    component: './System/Security/Roles',
                }, {
                    path: '/system/security/users',
                    component: './System/Security/Users',
                }, {
                    path: '/system/security/certs',
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
                component: './System/Logs/Overview',
            }, {
                path: '/system/logs/audit',
                component: './System/Logs/Audit',
            }, {
                path: '/system/logs/query',
                component: './System/Logs/Audit',
            }, {
                path: '/system/logs/slow',
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
