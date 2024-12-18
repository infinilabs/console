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

const getNotices = (req, res) =>
  res.json({
    took: 6,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    hits: {
      total: {
        value: 9,
        relation: "eq",
      },
      max_score: null,
      hits: [
        {
          _index: ".infini_notification",
          _id: "cgkgh295k34rl3al6he0",
          _score: null,
          _source: {
            id: "cgkgh295k34rl3al6he0",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "migration",
            status: "new",
            title: "Data Migration Started",
            body:
              "From Cluster: [infini_default_system_cluster (INFINI_SYSTEM (Morph))], To Cluster: [infini_default_system_cluster (INFINI_SYSTEM (Morph))]",
            link: "/#/migration/data/cgkggm95k34rl3al6fl0/detail",
          },
        },
        {
          _index: ".infini_notification",
          _type: "_doc",
          _id: "cgk20vl3q95q005nt2qg",
          _score: 1,
          _source: {
            id: "cgk20vl3q95q005nt2qg",
            created: "2023-04-01T12:15:58.945081036Z",
            updated: "2023-04-01T12:15:58.945093096Z",
            user_id: "medcl",
            type: "notification",
            message_type: "migration",
            status: "new",
            title:
              "Data Migration Completed,Data Migration Completed,Data Migration Completed,Data Migration Completed",
            body:
              "From Cluster: [cghtlst3q95ou2tpjvcg (es-v630)], To Cluster: [cghtmnd3q95ou2tpk0tg (es-v762)]",
            link: "/#/migration/data/cgk1pn53q95pjt0eah1g/detail",
          },
        },
        {
          _index: ".infini_notification",
          _type: "_doc",
          _id: "cgk20vl3q95q005nt2q1",
          _score: 1,
          _source: {
            id: "cgk20vl3q95q005nt2q1",
            created: "2023-04-01T12:15:58.945081036Z",
            updated: "2023-04-01T12:15:58.945093096Z",
            user_id: "medcl",
            type: "notification",
            message_type: "migration",
            status: "read",
            title: "read Data Migration Completed",
            body:
              "From Cluster: [cghtlst3q95ou2tpjvcg (es-v630)], To Cluster: [cghtmnd3q95ou2tpk0tg (es-v762)]",
            link: "/#/migration/data/cgk1pn53q95pjt0eah1g/detail",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k34",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k34",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k35",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k35",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High5",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k36",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k36",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High6",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k37",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k37",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High7",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k38",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k38",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "notification",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High8",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k39",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k39",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "todo",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High9",
            body: "",
            link: "",
          },
        },
        {
          _index: ".infini_notification",
          _id: "mkl4cll7gcgk0i095k40",
          _score: null,
          _source: {
            id: "mkl4cll7gcgk0i095k40",
            created: "2023-04-02T12:46:01.784794+08:00",
            updated: "2023-04-02T12:46:01.784801+08:00",
            user_id: "default_user_admin",
            type: "todo",
            message_type: "Alerting",
            status: "new",
            title: "CPU utilization is Too High10",
            body: "",
            link: "",
          },
        },
      ],
    },
  });

export default {
  "POST /notification/_search": getNotices,
  "POST /notification/read": (req, res) =>
    res.json({
      acknowledged: true,
    }),
};
