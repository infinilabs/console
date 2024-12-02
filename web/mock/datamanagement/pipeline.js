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

var pipelineList =  [{
    name:"fix_locales",
    desc: "test fix_locales",
    processors: ` [
      {
        "set": {
          "if": "ctx['locales'].empty",
          "field": "locales",
          "value": "en-en"
        }
      },
      {
        "set": {
          "field": "reindexBatch",
          "value": 3
        }
      },
      {
        "split": {
          "field": "locales",
          "separator": ","
        }
      }
    ]`
  },{
    name:"fix_locales",
    desc: "test fix_locales",
    processors: ` [
      {
        "set": {
          "if": "ctx['locales'].empty",
          "field": "locales",
          "value": "en-en"
        }
      },
      {
        "set": {
          "field": "reindexBatch",
          "value": 3
        }
      },
      {
        "split": {
          "field": "locales",
          "separator": ","
        }
      }
    ]`
  }];
export default {
    'get /data/pipeline': function (req, res) {
        res.json(pipelineList);
    },
    'POST /data/pipeline/add': (req, res) => {
        pipelineList.push(req.body);
        setTimeout(() => {
            res.send({ message: 'Ok' });
        },2000);
    },
    'PUT /data/pipeline/update': (req, res) => {
        var targetIdx = -1;
        pipelineList.forEach(function(p, i){
            if(p.name == req.body.name){
                targetIdx = i;
            }
        });
        console.log(req.body);
        if(targetIdx > -1) {
            pipelineList[targetIdx] = req.body
            setTimeout(() => {
                res.send({ message: 'Ok' });
            },2000);
            return;
        }
        res.send({ message: 'Fail' });
    },
    //delete /data/pipeline/:name
    'POST /data/pipeline': (req, res) => {
      var keys = req.body.key || [];
      var hasDeleted = false;
      for(let i=0; i< keys.length; i++){
        var targetIdx = -1;
        pipelineList.forEach(function(p, j){
            if(keys[i] == p.name){
                targetIdx = j;
            }
        });
        if(targetIdx > -1) {
            pipelineList.splice(targetIdx, 1);
            hasDeleted = true;
        }
      }
      if(hasDeleted) {
          setTimeout(() => {
              res.send({ message: 'Ok' });
          },2000);
          return;
      }
      res.send({ message: 'Fail' });
  },
  };