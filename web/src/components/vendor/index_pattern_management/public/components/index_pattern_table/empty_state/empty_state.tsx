/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Exception from "@/components/Exception";
import { Button } from "antd";
import Link from "umi/link";
import { router } from "umi";
import { formatMessage } from "umi/locale";

export const EmptyState = ({}: {}) => {
  const actions = (
    <div>
      <Button
        type="primary"
        onClick={() => {
          router.push("/data/index");
        }}
      >
        {formatMessage({ id: "explore.index.btn.create" })}
      </Button>
    </div>
  );

  return (
    <Exception
      type="404"
      title={formatMessage({ id: "explore.no_index.title" })}
      linkElement={Link}
      desc={formatMessage({ id: "explore.no_index.description" })}
      actions={actions}
    />
  );
};
