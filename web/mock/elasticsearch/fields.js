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
  "GET /elasticsearch/:id/view/_fields_for_wildcard": function(req, res) {
    //pattern=gateway*
    //e.g:http://localhost:8000/elasticsearch/c9aikmhpdamkiurn1vq0/view/_fields_for_wildcard?pattern=feed*&meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index
    //queryParams:{pattern:"gateway*",keyword:"xxx",size:10}
    res.send({
      fields: [
        {
          aggregatable: true,
          esTypes: ["date"],
          name: "@timestamp",
          readFromDocValues: true,
          searchable: true,
          type: "date",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "elastic.cluster_name",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "elastic.cluster_name.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "flow.from",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "flow.from.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "flow.process",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "flow.process.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "flow.relay",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "flow.relay.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "flow.to",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "flow.to.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "local_ip",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "local_ip.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "remote_ip",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "remote_ip.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.body",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.body.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["long"],
          name: "request.body_length",
          readFromDocValues: true,
          searchable: true,
          type: "number",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Accept",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Accept-Encoding",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Accept-Encoding.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Accept-Language",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Accept-Language.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Accept.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Cache-Control",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Cache-Control.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Connection",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Connection.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Content-Length",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Content-Length.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.DNT",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.DNT.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Host",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Host.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Origin",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Origin.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Purpose",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Purpose.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Sec-Fetch-Dest",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Sec-Fetch-Dest.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Sec-Fetch-Mode",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Sec-Fetch-Mode.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Sec-Fetch-Site",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Sec-Fetch-Site.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Sec-Fetch-User",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Sec-Fetch-User.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.Upgrade-Insecure-Requests",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.Upgrade-Insecure-Requests.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.User-Agent",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.User-Agent.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.X-Forwarded-For",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.X-Forwarded-For.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.X-Forwarded-Host",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.X-Forwarded-Host.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.X-Forwarded-Proto",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.X-Forwarded-Proto.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.X-Payload-Size",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.X-Payload-Size.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.X-Real-IP",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.X-Real-IP.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.content-type",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.content-type.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.sec-ch-ua",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.header.sec-ch-ua-mobile",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.sec-ch-ua-mobile.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.header.sec-ch-ua.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.host",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.host.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.local_addr",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.local_addr.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.method",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.method.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.path",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.path.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.query_args.pretty",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.query_args.pretty.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.remote_addr",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.remote_addr.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["date"],
          name: "request.started",
          readFromDocValues: true,
          searchable: true,
          type: "date",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.uri",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.uri.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "request.user",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "request.user.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.body",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.body.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["long"],
          name: "response.body_length",
          readFromDocValues: true,
          searchable: true,
          type: "number",
        },
        {
          aggregatable: true,
          esTypes: ["boolean"],
          name: "response.cached",
          readFromDocValues: true,
          searchable: true,
          type: "boolean",
        },
        {
          aggregatable: true,
          esTypes: ["float"],
          name: "response.elapsed",
          readFromDocValues: true,
          searchable: true,
          type: "number",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.Allow",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.Allow.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.Content-Length",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.Content-Length.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.Location",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.Location.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.Server",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.Server.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.WWW-Authenticate",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.WWW-Authenticate.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-Backend-Cluster",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-Backend-Cluster.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-Backend-Server",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-Backend-Server.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-Cache-Hash",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-Cache-Hash.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-Cache-Hit",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-Cache-Hit.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-Filters",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-Filters.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.X-elastic-product",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.X-elastic-product.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.content-encoding",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.content-encoding.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.header.content-type",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.header.content-type.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: false,
          esTypes: ["text"],
          name: "response.local_addr",
          readFromDocValues: false,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["keyword"],
          name: "response.local_addr.keyword",
          readFromDocValues: true,
          searchable: true,
          type: "string",
        },
        {
          aggregatable: true,
          esTypes: ["long"],
          name: "response.status_code",
          readFromDocValues: true,
          searchable: true,
          type: "number",
        },
        {
          aggregatable: true,
          esTypes: ["boolean"],
          name: "tls",
          readFromDocValues: true,
          searchable: true,
          type: "boolean",
        },
        {
          aggregatable: true,
          esTypes: ["boolean"],
          name: "tls_reuse",
          readFromDocValues: true,
          searchable: true,
          type: "boolean",
        },
      ],
    });
  },
};
