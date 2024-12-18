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
import React, { useState, useEffect } from "react";
import { SavedObject } from "kibana/public";
import { IIndexPattern, IndexPatternAttributes } from "src/plugins/data/public";

import { IndexPatternRef } from "./types";
import { ChangeIndexPattern } from "./change_indexpattern";
export interface DiscoverIndexPatternProps {
  /**
   * list of available index patterns, if length > 1, component offers a "change" link
   */
  indexPatternList: Array<SavedObject<IndexPatternAttributes>>;
  /**
   * currently selected index pattern, due to angular issues it's undefined at first rendering
   */
  selectedIndexPattern: IIndexPattern;
  /**
   * triggered when user selects a new index pattern
   */
  setIndexPattern: (id: string, typ: string) => void;
  indices: string[];
}

/**
 * Component allows you to select an index pattern in discovers side bar
 */
export function DiscoverIndexPattern({
  indexPatternList,
  selectedIndexPattern,
  setIndexPattern,
  indices,
}: DiscoverIndexPatternProps) {
  const options: IndexPatternRef[] = (indexPatternList || []).map((entity) => ({
    id: entity.id,
    title: entity.attributes!.title,
    viewName: entity.attributes!.viewName,
  }));
  const { id: selectedId, title: selectedTitle } = selectedIndexPattern || {};

  const [selected, setSelected] = useState({
    id: selectedId,
    title: selectedTitle || "",
  });
  useEffect(() => {
    const { id, title, viewName } = selectedIndexPattern;
    setSelected({ id, title, viewName });
  }, [selectedIndexPattern]);
  if (!selectedId) {
    return null;
  }

  return (
    <div className="dscIndexPattern__container">
      <ChangeIndexPattern
        trigger={{
          label: selected.viewName,
          title: selected.title,
          "data-test-subj": "indexPattern-switch-link",
          className: "dscIndexPattern__triggerButton",
        }}
        indexPatternId={selected.id}
        indexPatternRefs={options}
        onChangeIndexPattern={(id, typ) => {
          let indexPattern = null;
          if (typ == "index") {
            // indices.forEach((indexName)=>{
            //   if(indexName == id){
            indexPattern = {
              id: id,
              title: id,
              viewName: id,
            };
            //   }
            // })
          } else {
            indexPattern = options.find((pattern) => pattern.id === id);
          }
          if (indexPattern) {
            setIndexPattern(id, typ);
            setSelected(indexPattern);
          }
        }}
        indices={indices}
      />
    </div>
  );
}
