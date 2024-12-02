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

export default {
  "POST /_license/request_trial": function(req, res) {
    // res.status(500).json();
    //timeout request
    // setTimeout(() => {
    //   res.send({
    //     acknowledged: true,
    //   });
    // }, 8 * 1000);

    res.send({
      acknowledged: true,
      license: "xxx-string",
    });
    // error response
    // res.send({
    //   acknowledged: false,
    //   error: {
    //     reason:
    //       "failed to parse field [name] of type [long] in document with id '1'. Preview of field's value: '1d'",
    //   },
    //   status: 400,
    // });
  },

  "POST /_license/apply": function(req, res) {
    // res.status(500).json();
    res.send({
      acknowledged: true,
    });
  },

  "GET /_license/info": function(req, res) {
    //licensed
    res.send({
      expire_at: "2025-10-28T13:16:21",
      issue_at: "2021-01-08T20:29:21",
      issue_to: "hello@infini.ltd",
      license_id: "cdd7r1bq50k2jhnakef0",
      license_type: "Evaluation",
      max_nodes: 99,
      valid_from: "2020-09-04T13:16:21",
    });
    //license expired
    // res.send({
    //   expire_at: "2022-10-28T13:16:21",
    //   issue_at: "2021-01-08T20:29:21",
    //   issue_to: "hello@infini.ltd",
    //   license_id: "cdd7r1bq50k2jhnakef0",
    //   license_type: "Evaluation",
    //   max_nodes: 99,
    //   valid_from: "2020-09-04T13:16:21",
    // });
    //unlicensed
    // res.send({});
  },
};
