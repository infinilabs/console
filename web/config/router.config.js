export default [
  // user
  {
    path: "/user",
    component: "../layouts/UserLayout",
    routes: [
      { path: "/user", redirect: "/user/login" },
      { path: "/user/login", component: "./User/Login" },
      { path: "/user/register", component: "./User/Register" },
      { path: "/user/register-result", component: "./User/RegisterResult" },
    ],
  },
  // app
  {
    path: "/",
    component: "../layouts/BasicLayout",
    Routes: ["src/pages/Authorized"],
    authority: ["admin", "user"],
    routes: [
      // cluster
      { path: "/", redirect: "/cluster/overview" },
      {
        path: "/cluster",
        name: "cluster",
        icon: "cluster",
        routes: [
          //      { path: '/', redirect: '/platform/gateway' },
          //       {
          //         path: '/cluster/overview/',
          //         name: 'overview',
          //         component: './Cluster/Overview',
          //         routes:[
          //           { path: '/', redirect: '/' },
          //         ],
          //       },
          {
            path: "/cluster/overview",
            name: "overview",
            component: "./Cluster/NewOverview",
            // hideInMenu: true,
            routes: [{ path: "/", redirect: "/" }],
          },
          {
            path: "/cluster/monitoring/:cluster_id",
            name: "cluster",
            component: "./Cluster/ClusterMonitor",
            hideInMenu: true,
            routes: [{ path: "/", redirect: "/" }],
          },
          {
            path: "/cluster/metrics/",
            name: "monitoring",
            component: "./Cluster/Metrics",
            routes: [{ path: "/", redirect: "/" }],
          },
          {
            path: "/cluster/metrics/:cluster_id",
            name: "monitoring",
            component: "./Cluster/Metrics",
            hideInMenu: true,
          },
          // {
          // path: '/cluster/logs/',
          // name: 'logging',
          // component: './Cluster/SearchMonitor',
          // routes:[
          //   { path: '/', redirect: '/' },
          // ],
          // },{
          //   path: '/cluster/settings/',
          //   name: 'settings',
          //   component: './Cluster/Settings/Base',
          //   routes: [
          //     {
          //       path: '/cluster/settings',
          //       redirect: '/cluster/settings/repository',
          //       routes:[
          //         { path: '/', redirect: '/' },
          //       ],
          //     },
          //     {
          //       path: '/cluster/settings/repository',
          //       component: './Cluster/Settings/Repository',
          //       routes:[
          //         { path: '/', redirect: '/' },
          //       ],
          //     }
          //   ]
          // },
        ],
      },
      //devtools
      // {
      //   routes:[
      //     { path: '/', redirect: '/' },
      //   ],
      //   path: '/dev_tool',
      //   name: 'devtool',
      //   icon: 'code',
      //   component: './DevTool/Console',
      // },

      //alerting
      {
        path: "/alerting",
        name: "alerting",
        icon: "alert",
        routes: [
          {
            routes: [{ path: "/", redirect: "/" }],
            path: "/alerting/overview",
            component: "./Alerting/pages/Overview/Overview",
            name: "overview",
          },
          {
            routes: [{ path: "/", redirect: "/" }],
            path: "/alerting/monitor",
            component: "./Alerting/index",
            name: "monitor",
          },
          {
            routes: [{ path: "/", redirect: "/" }],
            path: "/alerting/destination",
            component: "./Alerting/destination",
            name: "destination",
          },
        ],
      },

      //data
      {
        path: "/data",
        name: "data",
        icon: "database",
        routes: [
          // {
          //   path: '/data/overview',
          //   name: 'overview',
          //   component: './DataManagement/IndexSummary',
          //   routes:[
          //     { path: '/', redirect: '/' },
          //   ],
          // },
          {
            path: "/data/index",
            name: "index",
            component: "./DataManagement/Index",
            routes: [{ path: "/", redirect: "/" }],
          },
          // {
          //   path: '/data/document',
          //   name: 'document',
          //   component: './DataManagement/Document',
          //   routes:[
          //     { path: '/', redirect: '/' },
          //   ],
          // },
          // {
          //   path: '/data/template',
          //   name: 'template',
          //   component: './DataManagement/IndexTemplate',
          //   routes:[
          //     { path: '/', redirect: '/' },
          //   ],
          // },
          // {
          //   path: '/data/lifecycle',
          //   name: 'lifecycle',
          //   component: './DataManagement/IndexLifeCycle',
          //   routes:[
          //     { path: '/', redirect: '/' },
          //   ],
          // },
          {
            routes: [{ path: "/", redirect: "/" }],
            path: "/data/discover",
            name: "discover",
            component: "./DataManagement/Discover",
          },
          {
            routes: [{ path: "/", redirect: "/" }],
            path: "/data/views/",
            name: "indexPatterns",
            component: "./DataManagement/IndexPatterns",
          },
        ],
      },

      //search
      {
        path: "/search",
        name: "search",
        icon: "search",
        routes: [
          // {
          //   path: '/search/overview',
          //   name: 'overview',
          //   component: './SearchManage/template/Template',
          //   routes:[
          //     { path: '/', redirect: '/' },
          //   ],
          // },
          // {
          //     path: '/search/template',
          //     name: 'template',
          //     component: './SearchManage/template/Template',
          //     routes: [
          //         {
          //             path: '/search/template',
          //             redirect: '/search/template/template',
          //         },
          //         {
          //             path: '/search/template/template',
          //             component: './SearchManage/template/SearchTemplate',
          //             routes:[
          //               { path: '/', redirect: '/' },
          //             ],
          //         },
          //         {
          //             path: '/search/template/:cluster_id',
          //             component: './SearchManage/template/SearchTemplate',
          //             routes:[
          //               { path: '/', redirect: '/' },
          //             ],
          //         },
          //         {
          //             path: '/search/template/history',
          //             component: './SearchManage/template/History',
          //             routes:[
          //               { path: '/', redirect: '/' },
          //             ],
          //         },
          //     ]
          // },
          {
            path: "/search/alias",
            name: "alias",
            component: "./SearchManage/alias/Alias",
            routes: [
              {
                path: "/search/alias",
                redirect: "/search/alias/index",
                // routes:[
                //   { path: '/', redirect: '/' },
                // ],
              },
              {
                path: "/search/alias/index",
                component: "./SearchManage/alias/AliasManage",
                routes: [{ path: "/", redirect: "/" }],
              },
              {
                path: "/search/alias/rule",
                component: "./SearchManage/alias/Rule",
                routes: [{ path: "/", redirect: "/" }],
              },
            ],
          },
          //  {
          //   path: '/search/dict',
          //   name: 'dict',
          //   component: './SearchManage/dict/Dict',
          //       routes: [
          //           {
          //               path: '/search/dict',
          //               redirect: '/search/dict/professional',
          //               // routes:[
          //               //   { path: '/', redirect: '/' },
          //               // ],
          //           },
          //           {
          //               path: '/search/dict/professional',
          //               component: './SearchManage/dict/Pro',
          //               routes:[
          //                 { path: '/', redirect: '/' },
          //               ],
          //           },
          //           {
          //               path: '/search/dict/common',
          //               component: './SearchManage/dict/Common',
          //               routes:[
          //                 { path: '/', redirect: '/' },
          //               ],
          //           }
          //       ]
          // },
          //  {
          //   path: '/search/analyzer',
          //   name: 'analyzer',
          //   component: './SearchManage/analyzer/Analyzer',
          //       routes: [
          //           {
          //               path: '/search/analyzer',
          //               redirect: '/search/analyzer/manage',
          //           },
          //           {
          //               path: '/search/analyzer/manage',
          //               component: './SearchManage/analyzer/Manage',
          //               routes:[
          //                 { path: '/', redirect: '/' },
          //               ],
          //           },
          //           {
          //               path: '/search/analyzer/test',
          //               component: './SearchManage/analyzer/AnalyzerTest',
          //               routes:[
          //                 { path: '/', redirect: '/' },
          //               ],
          //           }
          //       ]
          // }
          //, {
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
        ],
      },
      //
      // //sync
      // {
      //   path: '/sync',
      //   name: 'synchronize',
      //   icon: 'sync',
      //   routes: [
      //     {
      //       path: '/sync/overview',
      //       name: 'overview',
      //       component: './Synchronize/Pipes',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     },
      //     {
      //       path: '/sync/pipeline',
      //       name: 'pipeline',
      //       component: './Synchronize/Pipes',
      //       routes: [
      //         {
      //           path: '/sync/pipeline',
      //           redirect: '/sync/pipeline/logstash',
      //         },
      //         {
      //           path: '/sync/pipeline/ingestpipeline',
      //           component: './Synchronize/IngestPipeline',
      //           routes:[
      //             { path: '/', redirect: '/' },
      //           ],
      //         }, {
      //           path: '/sync/pipeline/logstash',
      //           component: './Synchronize/LogstashConfig',
      //           routes:[
      //             { path: '/', redirect: '/' },
      //           ],
      //         }]
      //     },{
      //       path: '/sync/rebuild',
      //       name: 'rebuild',
      //       component: './Synchronize/RebuildList',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     },
      //     {
      //       path: '/sync/rebuild/new',
      //       component: './Synchronize/Rebuild',
      //       hideInMenu: true,
      //     },{
      //       path: '/sync/inout',
      //       name: 'inout',
      //       component: './Synchronize/Import',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     }
      //   ]
      // },
      //
      // //backup
      // {
      //   path: '/backup',
      //   name: 'backup',
      //   icon: 'cloud',
      //   routes: [
      //     {
      //       path: '/backup/overview',
      //       name: 'overview',
      //       component: './SearchManage/template/Template',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     },
      //     {
      //       path: '/backup/bakandrestore',
      //       name: 'index',
      //       component: './Backup/BakAndRestore',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     },{
      //       path: '/backup/lifecycle',
      //       name: 'lifecycle',
      //       component: './Backup/BakCycle',
      //       routes:[
      //         { path: '/', redirect: '/' },
      //       ],
      //     }
      //   ]
      // },

      //settings
      {
        path: "/system",
        name: "system",
        icon: "setting",
        routes: [
          {
            path: "/system/cluster",
            name: "cluster",
            component: "./System/Cluster/Index",
          },
          {
            path: "/system/cluster/regist",
            name: "registCluster",
            component: "./System/Cluster/Step",
            hideInMenu: true,
          },
          {
            path: "/system/cluster/edit",
            name: "editCluster",
            component: "./System/Cluster/Form",
            hideInMenu: true,
          },
          {
            path: "/system/command",
            name: "commonCommand",
            component: "./System/Command/Index",
            // hideInMenu: true
          },
          // {
          //   path: '/system/settings',
          //   name: 'settings',
          //   component: './System/Settings/Base',
          //     hideChildrenInMenu: true,
          //     routes: [
          //         {
          //             path: '/system/settings',
          //             redirect: '/system/settings/global',
          //         },
          //         {
          //             path: '/system/settings/global',
          //             component: './System/Settings/Global',
          //         }, {
          //             path: '/system/settings/gateway',
          //             component: './System/Settings/Gateway',
          //         },
          //     ]
          // },
          //   {
          //   path: '/system/security',
          //   name: 'security',
          //   component: './System/Security/Base',
          //   hideChildrenInMenu: true,
          //   routes: [
          //       {
          //           path: '/system/security',
          //           redirect: '/system/security/general',
          //       },
          //       {
          //           path: '/system/security/general',
          //           component: './System/Security/General',
          //       }, {
          //           path: '/system/security/sso',
          //           component: './System/Security/SSO',
          //       }, {
          //           path: '/system/security/roles',
          //           component: './System/Security/Roles',
          //       }, {
          //           path: '/system/security/users',
          //           component: './System/Security/Users',
          //       }, {
          //           path: '/system/security/certs',
          //           component: './System/Security/Certs',
          //       },
          //   ]
          // },
          //   {
          //   path: '/system/logs',
          //   name: 'logs',
          //   component: './System/Logs/Base',
          //   hideChildrenInMenu: true,
          //   routes: [
          //   {
          //       path: '/system/logs',
          //       redirect: '/system/logs/overview',
          //   },
          //   {
          //       path: '/system/logs/overview',
          //       component: './System/Logs/Overview',
          //   }, {
          //       path: '/system/logs/audit',
          //       component: './System/Logs/Audit',
          //   }, {
          //       path: '/system/logs/query',
          //       component: './System/Logs/Audit',
          //   }, {
          //       path: '/system/logs/slow',
          //       component: './System/Logs/Audit',
          //   },
          //   ]
          // },
        ],
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
        component: "404",
      },
    ],
  },
];
