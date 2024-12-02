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

import {queryData} from './data/doc';

function getUUID(len){
  len = len || 20;
  let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var maxPos = chars.length;
　var uuid = '';
　for (let i = 0; i < len; i++) {
    uuid += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return uuid;
}

export default {
  // 'post /_search-center/doc/:index/_search': function(req, res){
  //   res.send(queryData)
  // },
  // 'post /_search-center/doc/:index/_create': function(req, res){
  //   res.send({
  //     status: true,
  //     payload: {
  //       ...req.body.payload,
  //       id: getUUID(),
  //     }
  //   });
  // },
  // 'put /_search-center/doc/:index/:id': function(req, res){
  //   res.send({
  //     status: true,
  //     payload: req.body
  //   });
  // },
  //
  // 'delete /_search-center/doc/:index/:id': function(req, res){
  //   res.send({
  //     status: true,
  //     payload: null,
  //   });
  // }
}