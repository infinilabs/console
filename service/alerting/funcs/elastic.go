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

/* Copyright © INFINI Ltd. All rights reserved.
 * Web: https://infinilabs.com
 * Email: hello#infini.ltd */

package funcs

import (
	log "github.com/cihub/seelog"
	"infini.sh/framework/core/elastic"
	"infini.sh/framework/core/orm"
	"infini.sh/framework/core/util"
	"strings"
)

func lookup(directory string, id string) interface{} {
	directory = strings.TrimSpace(directory)
	if directory == "" {
		return "empty_directory"
	}
	parts := strings.Split(directory, ",")
	kvs := map[string]string{}
	for _, part := range parts {
		kv := strings.Split(part, "=")
		if len(kv) == 2 {
			k := strings.TrimSpace(kv[0])
			kvs[k] = strings.TrimSpace(kv[1])
		} else {
			log.Debugf("got unexpected directory part: %s", part)
		}
	}

	switch kvs["category"] {
	case "metadata":
		return lookupMetadata(kvs["object"], kvs["property"], kvs["default"], id)
	}
	return kvs["default"]
}

func lookupMetadata(object string, property string, defaultValue string, id string) interface{} {
	var (
		cfgM = util.MapStr{}
		buf  []byte
	)
	switch object {
	case "cluster":
		meta := elastic.GetMetadata(id)
		if meta == nil {
			return defaultValue
		}
		cfg := elastic.GetConfig(id)
		buf = util.MustToJSONBytes(cfg)
		err := util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		delete(cfgM, "basic_auth")
	case "node":
		cfg := elastic.NodeConfig{}
		cfg.ID = id
		err, result := orm.GetBy("metadata.node_id", id, &cfg)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		if len(result.Result) == 0 {
			return defaultValue
		}
		buf = util.MustToJSONBytes(result.Result[0])
		err = util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
	case "index":
		cfg := elastic.IndexConfig{}
		q := &orm.Query{
			Size: 1,
		}
		q.Conds = orm.And(orm.Eq("metadata.index_id", id))
		err, result := orm.Search(cfg, q)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
		if len(result.Result) == 0 {
			return defaultValue
		}
		buf = util.MustToJSONBytes(result.Result[0])
		err = util.FromJSONBytes(buf, &cfgM)
		if err != nil {
			log.Error(err)
			return defaultValue
		}
	}
	if buf == nil {
		return defaultValue
	}
	if property == "*" || property == "" {
		return cfgM
	}
	v, _ := cfgM.GetValue(property)
	if v != nil {
		return v
	}
	return defaultValue
}
