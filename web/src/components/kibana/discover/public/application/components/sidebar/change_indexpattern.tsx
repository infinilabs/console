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

import React, { useState } from "react";
import {
  EuiButtonEmpty,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelectable,
  EuiButtonEmptyProps,
  EuiTabs,
  EuiTabbedContent,
  EuiTab,
  EuiSwitch,
} from "@elastic/eui";
import { EuiSelectableProps } from "@elastic/eui/src/components/selectable/selectable";
import { IndexPatternRef } from "./types";

export type ChangeIndexPatternTriggerProps = EuiButtonEmptyProps & {
  label: string;
  title?: string;
};

export function ChangeIndexPattern({
  indexPatternRefs,
  indexPatternId,
  onChangeIndexPattern,
  trigger,
  selectableProps,
  indices,
}: {
  trigger: ChangeIndexPatternTriggerProps;
  indexPatternRefs: IndexPatternRef[];
  onChangeIndexPattern: (newId: string, typ: string) => void;
  indexPatternId?: string;
  selectableProps?: EuiSelectableProps;
  indices: string[];
}) {
  const [isPopoverOpen, setPopoverIsOpen] = useState(false);

  const createTrigger = function() {
    const { label, title, ...rest } = trigger;
    return (
      <EuiButtonEmpty
        className="eui-textTruncate"
        flush="left"
        color="text"
        iconSide="right"
        iconType="arrowDown"
        title={title}
        onClick={() => setPopoverIsOpen(!isPopoverOpen)}
        {...rest}
      >
        {label}
      </EuiButtonEmpty>
    );
  };
  const indexNames = (indexPatternId || "").split(",");
  const [selectedTabId, setSelectedTabId] = useState(
    indexNames.every((index) => indices.includes(index)) ? 1 : 0
  );
  const singleSelection = React.useMemo(() => {
    return indexNames.length > 1 ? true : "always";
  }, [indexNames]);
  const onSelectedTabChanged = (id: number) => {
    setSelectedTabId(id);
  };
  const [includeSystemIndex, setIncludeSystemIndex] = useState(false);

  const tabs = React.useMemo(() => {
    const showIndices = includeSystemIndex
      ? indices
      : indices.filter((key) => !key.startsWith("."));
    const tabs = [
      {
        id: "view",
        name: "View",
        disabled: false,
        content: (
          <EuiSelectable
            style={{ marginTop: 10 }}
            data-test-subj="indexPattern-switcher"
            {...selectableProps}
            searchable
            singleSelection="always"
            options={indexPatternRefs.map(({ title, id, viewName }) => ({
              label: viewName,
              key: id,
              value: id,
              checked: id === indexPatternId ? "on" : undefined,
            }))}
            onChange={(choices) => {
              const choice = (choices.find(
                ({ checked }) => checked
              ) as unknown) as {
                value: string;
              };
              onChangeIndexPattern(choice.value, "view");
              setPopoverIsOpen(false);
            }}
            searchProps={{
              compressed: true,
              ...(selectableProps ? selectableProps.searchProps : undefined),
            }}
          >
            {(list, search) => (
              <>
                {search}
                {list}
              </>
            )}
          </EuiSelectable>
        ),
      },
      {
        id: "index",
        name: "Index",
        disabled: false,
        content: (
          <div>
            <div
              style={{
                display: "flex",
                margin: "10px auto",
                flexDirection: "row-reverse",
              }}
            >
              <EuiSwitch
                label="Include system index"
                checked={includeSystemIndex}
                onChange={(e) => setIncludeSystemIndex(!includeSystemIndex)}
              />
            </div>

            <EuiSelectable
              style={{ marginTop: 5 }}
              {...selectableProps}
              searchable
              singleSelection={singleSelection}
              options={showIndices.map((indexName) => ({
                label: indexName,
                key: indexName,
                value: indexName,
                checked: indexNames.includes(indexName) ? "on" : undefined,
              }))}
              onChange={(choices) => {
                // const choice = (choices.find(
                //   ({ checked }) => checked
                // ) as unknown) as {
                //   value: string;
                // };
                const values = choices
                  .filter(({ checked }) => checked)
                  .map((choice) => {
                    return choice.value;
                  });
                onChangeIndexPattern(values.join(","), "index");
                setPopoverIsOpen(false);
              }}
              searchProps={{
                compressed: true,
                ...(selectableProps ? selectableProps.searchProps : undefined),
              }}
            >
              {(list, search) => (
                <>
                  {search}
                  {list}
                </>
              )}
            </EuiSelectable>
          </div>
        ),
      },
    ];
    return tabs;
  }, [
    selectableProps,
    indexPatternId,
    indexPatternRefs,
    indices,
    includeSystemIndex,
    singleSelection,
  ]);

  const selectedTabContent = React.useMemo(() => {
    return tabs.find((obj) => obj.id === selectedTabId)?.content;
  }, [selectedTabId, tabs]);

  const renderTabs = () => {
    return tabs.map((tab, index) => (
      <EuiTab
        key={index}
        onClick={() => onSelectedTabChanged(tab.id)}
        isSelected={tab.id === selectedTabId}
        disabled={tab.disabled}
      >
        {tab.name}
      </EuiTab>
    ));
  };

  return (
    <EuiPopover
      button={createTrigger()}
      isOpen={isPopoverOpen}
      closePopover={() => setPopoverIsOpen(false)}
      className="eui-textTruncate"
      anchorClassName="eui-textTruncate"
      display="block"
      panelPaddingSize="s"
      ownFocus
    >
      <div style={{ width: 320 }}>
        {/* <EuiPopoverTitle>
          选择视图
        </EuiPopoverTitle> */}
        {/* <EuiTabs size="s" expand>
          {renderTabs()}
        </EuiTabs> */}
        <EuiTabbedContent
          tabs={tabs}
          initialSelectedTab={tabs[selectedTabId]}
          autoFocus="selected"
          onTabClick={(tab) => {
            const idx = tabs.findIndex((item) => item.id == tab.id);
            setSelectedTabId(idx);
          }}
        />
        {/* <div style={{marginTop:5}}></div>
        {selectedTabContent} */}
      </div>
    </EuiPopover>
  );
}
