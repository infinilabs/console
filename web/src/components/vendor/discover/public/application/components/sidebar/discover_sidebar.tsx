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
import "./discover_sidebar.scss";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  EuiButtonIcon,
  EuiTitle,
  EuiSpacer,
  EuiHideFor,
  EuiSwitch,
  EuiFieldText,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import { sortBy } from "lodash";
import { DiscoverField } from "./discover_field";
import { DiscoverIndexPattern } from "./discover_index_pattern";
import { DiscoverFieldSearch } from "./discover_field_search";
import { IndexPatternAttributes } from "../../../../../data/common";
import { SavedObject } from "../../../../../../core/types";
// import { FIELDS_LIMIT_SETTING } from '../../../../common';
import { groupFields } from "./lib/group_fields";
import {
  IndexPatternField,
  IndexPattern,
  UI_SETTINGS,
} from "../../../../../data/public";
import { getDetails } from "./lib/get_details";
import { getDefaultFieldFilter, setFieldFilterProp } from "./lib/field_filter";
import { getIndexPatternFieldList } from "./lib/get_index_pattern_field_list";
// import { getServices } from '../../../kibana_services';
import { Tree, Icon } from "antd";

export interface DiscoverSidebarProps {
  /**
   * the selected columns displayed in the doc table in discover
   */
  columns: string[];
  /**
   * a statistics of the distribution of fields in the given hits
   */
  fieldCounts: Record<string, number>;
  /**
   * hits fetched from ES, displayed in the doc table
   */
  hits: Array<Record<string, unknown>>;
  /**
   * List of available index patterns
   */
  indexPatternList: Array<SavedObject<IndexPatternAttributes>>;
  /**
   * Callback function when selecting a field
   */
  onAddField: (fieldName: string) => void;
  /**
   * Callback function when adding a filter from sidebar
   */
  onAddFilter: (
    field: IndexPatternField | string,
    value: string,
    type: "+" | "-"
  ) => void;
  /**
   * Callback function when removing a field
   * @param fieldName
   */
  onRemoveField: (fieldName: string) => void;
  /**
   * Currently selected index pattern
   */
  selectedIndexPattern?: IndexPattern;
  /**
   * Callback function to select another index pattern
   */
  setIndexPattern: (id: string) => void;
  isClosed: boolean;
  indices: string[];
  distinctParams: any;
  onDistinctParamsChange: any;
  whetherToSample?: boolean;
  sampleSize?: number;
  topNumber?: number;
}

export function DiscoverSidebar({
  columns,
  fieldCounts,
  hits,
  indexPatternList,
  onAddField,
  onAddFilter,
  onRemoveField,
  selectedIndexPattern,
  setIndexPattern,
  isClosed,
  indices,
  distinctParams,
  onDistinctParamsChange,
  onFieldAgg,
  whetherToSample,
  sampleSize,
  topNumber,
}: DiscoverSidebarProps) {
  const [showFields, setShowFields] = useState(false);
  const [fields, setFields] = useState<IndexPatternField[] | null>(null);
  const [fieldFilterState, setFieldFilterState] = useState(
    getDefaultFieldFilter()
  );
  // const services = useMemo(() => getServices(), []);

  useEffect(() => {
    let newFields = getIndexPatternFieldList(
      selectedIndexPattern,
      fieldCounts
    );
    const fieldM = {};
    newFields.forEach((field: IndexPatternField)=>{
        fieldM[field.displayName] = field;
    });
    newFields = newFields.map((field: IndexPatternField)=>{
      if(!field.displayName.endsWith(".keyword") && fieldM[`${field.displayName}.keyword`]){
        field.isMulti = true;
      }
      return field;
    })
    setFields(newFields);
  }, [selectedIndexPattern, fieldCounts, hits]); //services

  const onChangeFieldSearch = useCallback(
    (field: string, value: string | boolean | undefined) => {
      const newState = setFieldFilterProp(fieldFilterState, field, value);
      setFieldFilterState(newState);
    },
    [fieldFilterState]
  );

  const getDetailsByField = useCallback(
    (ipField: IndexPatternField) =>
      getDetails(ipField, hits, columns, selectedIndexPattern),
    [hits, columns, selectedIndexPattern]
  );

  const popularLimit = 5; //services.uiSettings.get(FIELDS_LIMIT_SETTING);
  const useShortDots = false; //services.uiSettings.get(UI_SETTINGS.SHORT_DOTS_ENABLE);

  const {
    selected: selectedFields,
    popular: popularFields,
    unpopular: unpopularFields,
    fieldsTree,
  } = useMemo(() => {
    const groupedFields = groupFields(
      fields,
      columns,
      popularLimit,
      fieldCounts,
      fieldFilterState
    );
    const fieldsTree = {};
    groupedFields.unpopular.forEach((field) => {
      const keys = field.displayName.split(".");
      let currentObj = fieldsTree;
      keys.forEach((key: string, i: number) => {
        if (!currentObj[key]) {
          currentObj[key] = {};
        }
        if (keys.length == i + 1) {
          field.isLeaf = true;
          currentObj[key] = field;
          return;
        }
        currentObj = currentObj[key];
      });
    });
    return {
      ...groupedFields,
      fieldsTree,
    };
  }, [fields, columns, popularLimit, fieldCounts, fieldFilterState]);

  const fieldTypes = useMemo(() => {
    const result = ["any"];
    if (Array.isArray(fields)) {
      for (const field of fields) {
        if (result.indexOf(field.type) === -1) {
          result.push(field.type);
        }
      }
    }
    return result;
  }, [fields]);
  const [lastPopoverField, setLastPopoverField] = useState("");

  if (!selectedIndexPattern || !fields || isClosed) {
    return null;
  }

  const buildTree = (treeObj: any) => {
    return Object.keys(treeObj).map((key) => {
      if (treeObj[key].isLeaf) {
        return (
          <Tree.TreeNode
            icon={<Icon type="carry-out" />}
            selectable={false}
            title={
              <DiscoverField
                field={treeObj[key]}
                indexPattern={selectedIndexPattern}
                onAddField={onAddField}
                onRemoveField={onRemoveField}
                onAddFilter={onAddFilter}
                getDetails={getDetailsByField}
                useShortDots={true}
                setLastPopoverField={setLastPopoverField}
                lastPopoverField={lastPopoverField}
                onFieldAgg={onFieldAgg}
                columns={columns}
                whetherToSample={whetherToSample}
                sampleSize={sampleSize}
                topNumber={topNumber}
              />
            }
            key={key}
          />
        );
      }
      return (
        <Tree.TreeNode
          icon={<Icon type="carry-out" />}
          selectable={false}
          title={key}
          key={key}
        >
          {buildTree(treeObj[key])}
        </Tree.TreeNode>
      );
    });
  };

  return (
    <EuiHideFor sizes={["xs", "s"]}>
      <section className="sidebar-list" aria-label={"Index and fields"}>
        {/* <DiscoverIndexPattern
          selectedIndexPattern={selectedIndexPattern}
          setIndexPattern={setIndexPattern}
          indexPatternList={sortBy(
            indexPatternList,
            (o) => o.attributes.viewName
          )}
          indices={indices}
        /> */}
        <div className="dscSidebar__item">
          <form>
            <DiscoverFieldSearch
              onChange={onChangeFieldSearch}
              value={fieldFilterState.name}
              types={fieldTypes}
            />
          </form>
        </div>
        <div className="sidebar-list">
          <EuiTitle size="xxxs" id="distinct_by_field">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                marginBottom: 5,
              }}
            >
              <span>Distinct by field</span>
              <EuiSwitch
                label=""
                compressed={true}
                checked={distinctParams.enabled}
                onChange={(e) => {
                  onDistinctParamsChange({
                    ...distinctParams,
                    enabled: e.target.checked,
                  });
                }}
              />
            </div>
          </EuiTitle>
          <div style={{ display: distinctParams.enabled ? "block" : "none" }}>
            <EuiFlexGroup gutterSize="s" responsive={false} wrap>
              <EuiFlexItem>
                <EuiSelect
                  placeholder={"Field type"}
                  value={distinctParams?.type}
                  options={[
                    { value: "string", text: "String" },
                    { value: "long", text: "Long" },
                  ]}
                  onChange={(e) => {
                    onDistinctParamsChange({
                      ...distinctParams,
                      type: e.target.value,
                    });
                  }}
                  compressed={true}
                  prepend="Type"
                />
                <EuiFieldText
                  placeholder={"Field name"}
                  value={distinctParams?.field}
                  onChange={(e) => {
                    onDistinctParamsChange({
                      ...distinctParams,
                      field: e.target.value,
                    });
                  }}
                  compressed={true}
                  prepend="Field"
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </div>
        <div className="sidebar-list">
          {fields.length > 0 && (
            <>
              <EuiTitle size="xxxs" id="selected_fields">
                <h3>Selected fields</h3>
              </EuiTitle>
              <EuiSpacer size="xs" />
              <ul
                className="dscSidebarList dscFieldList--selected"
                aria-labelledby="selected_fields"
                data-test-subj={`fieldList-selected`}
              >
                {selectedFields.map((field: IndexPatternField) => {
                  return (
                    <li
                      key={`field${field.name}`}
                      data-attr-field={field.name}
                      className="dscSidebar__item"
                    >
                      <DiscoverField
                        field={field}
                        indexPattern={selectedIndexPattern}
                        onAddField={onAddField}
                        onRemoveField={onRemoveField}
                        onAddFilter={onAddFilter}
                        getDetails={getDetailsByField}
                        selected={true}
                        useShortDots={useShortDots}
                        setLastPopoverField={setLastPopoverField}
                        lastPopoverField={lastPopoverField}
                        onFieldAgg={onFieldAgg}
                        columns={columns}
                        whetherToSample={whetherToSample}
                        sampleSize={sampleSize}
                        topNumber={topNumber}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="euiFlexGroup euiFlexGroup--gutterMedium">
                <EuiTitle
                  size="xxxs"
                  id="available_fields"
                  className="euiFlexItem"
                >
                  <h3>Available fields</h3>
                </EuiTitle>
                {/* <div className="euiFlexItem euiFlexItem--flexGrowZero">
                  <EuiButtonIcon
                    className={'visible-xs visible-sm dscFieldChooser__toggle'}
                    iconType={showFields ? 'arrowDown' : 'arrowRight'}
                    onClick={() => setShowFields(!showFields)}
                    aria-label={
                      showFields
                        ? 'Hide fields'
                        : 'Show fields'
                    }
                  />
                </div> */}
              </div>
            </>
          )}
          {popularFields.length > 0 && (
            <div>
              <EuiTitle
                size="xxxs"
                className={`dscFieldListHeader ${
                  !showFields ? "hidden-sm hidden-xs" : ""
                }`}
              >
                <h4
                  style={{ fontWeight: "normal" }}
                  id="available_fields_popular"
                >
                  Popular
                </h4>
              </EuiTitle>
              <ul
                className={`dscFieldList dscFieldList--popular ${
                  !showFields ? "hidden-sm hidden-xs" : ""
                }`}
                aria-labelledby="available_fields available_fields_popular"
                data-test-subj={`fieldList-popular`}
              >
                {popularFields.map((field: IndexPatternField) => {
                  return (
                    <li
                      key={`field${field.name}`}
                      data-attr-field={field.name}
                      className="dscSidebar__item"
                    >
                      <DiscoverField
                        field={field}
                        indexPattern={selectedIndexPattern}
                        onAddField={onAddField}
                        onRemoveField={onRemoveField}
                        onAddFilter={onAddFilter}
                        getDetails={getDetailsByField}
                        useShortDots={useShortDots}
                        setLastPopoverField={setLastPopoverField}
                        lastPopoverField={lastPopoverField}
                        onFieldAgg={onFieldAgg}
                        columns={columns}
                        whetherToSample={whetherToSample}
                        sampleSize={sampleSize}
                        topNumber={topNumber}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* <ul
            className={`dscFieldList dscFieldList--unpopular ${
              !showFields ? "hidden-sm hidden-xs" : ""
            }`}
            aria-labelledby="available_fields"
            data-test-subj={`fieldList-unpopular`}
          >
            {unpopularFields.map((field: IndexPatternField) => {
              return (
                <li
                  key={`field${field.name}`}
                  data-attr-field={field.name}
                  className="dscSidebar__item"
                >
                  <DiscoverField
                    field={field}
                    indexPattern={selectedIndexPattern}
                    onAddField={onAddField}
                    onRemoveField={onRemoveField}
                    onAddFilter={onAddFilter}
                    getDetails={getDetailsByField}
                    useShortDots={useShortDots}
                    whetherToSample={whetherToSample}
                    sampleSize={sampleSize}
                    topNumber={topNumber}
                  />
                </li>
              );
            })}
          </ul> */}
          <div id="fields-tree-wrapper">
            <Tree
              showLine={false}
              showIcon={false}
              defaultExpandedKeys={["0-0-0", "0-0-1", "0-0-2"]}
            >
              {buildTree(fieldsTree)}
            </Tree>
          </div>
        </div>
      </section>
    </EuiHideFor>
  );
}
