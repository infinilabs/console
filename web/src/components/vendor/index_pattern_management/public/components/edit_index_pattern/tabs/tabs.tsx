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

import React, {
  useState,
  useCallback,
  useEffect,
  Fragment,
  useMemo,
} from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTabbedContent,
  EuiTabbedContentTab,
  EuiSpacer,
  EuiFieldSearch,
  EuiSelect,
  EuiSelectOption,
  EuiButton,
} from "@elastic/eui";
// import { fieldWildcardMatcher } from '../../../../../utils/public';
import {
  // IndexPattern,
  // IndexPatternField,
  UI_SETTINGS,
  DataPublicPluginStart,
} from "../../../../../data/public";
// import { useKibana } from '../../../../../../plugins/kibana_react/public';
// import { IndexPatternManagmentContext } from '../../../types';
import { createEditIndexPatternPageStateContainer } from "../edit_index_pattern_state_container";
import {
  TAB_COMPLEX_FIELDS,
  TAB_INDEXED_FIELDS,
  TAB_SCRIPTED_FIELDS,
  TAB_SOURCE_FILTERS,
} from "../constants";
import { SourceFiltersTable } from "../source_filters_table";
import { IndexedFieldsTable } from "../indexed_fields_table";
import { ScriptedFieldsTable } from "../scripted_fields_table";
import { getTabs, getPath, convertToEuiSelectOption } from "./utils";

import {
  IndexPattern,
  IndexPatternField,
  fieldWildcardMatcher,
} from "../../../import";

import { useGlobalContext } from "../../../context";

import LayoutList from "@/pages/DataManagement/View/LayoutList"
import { ComplexFieldsTable } from "../indexed_fields_table/complex_fields_table";

interface TabsProps extends Pick<RouteComponentProps, "history" | "location"> {
  indexPattern: IndexPattern;
  fields: IndexPatternField[];
  saveIndexPattern; //: DataPublicPluginStart['indexPatterns']['updateSavedObject'];
}

const searchAriaLabel = "Search fields";

const filterAriaLabel = "Filter field types";

const filterPlaceholder = "Search";

export function Tabs({
  indexPattern,
  saveIndexPattern,
  fields,
  history,
  location,
  selectedCluster,
}: TabsProps) {
  // const { uiSettings, indexPatternManagementStart, docLinks } = useKibana<
  //   IndexPatternManagmentContext
  // >().services;
  const {
    uiSettings,
    indexPatternManagementStart,
    docLinks,
    indexPatternFieldEditor,
  } = useGlobalContext();
  const [fieldFilter, setFieldFilter] = useState<string>("");
  const [complexFieldFilter, setComplexFieldFilter] = useState<string>("");
  const [indexedFieldTypeFilter, setIndexedFieldTypeFilter] = useState<string>(
    ""
  );
  const [
    scriptedFieldLanguageFilter,
    setScriptedFieldLanguageFilter,
  ] = useState<string>("");
  const [indexedFieldTypes, setIndexedFieldType] = useState<EuiSelectOption[]>(
    []
  );
  const [scriptedFieldLanguages, setScriptedFieldLanguages] = useState<
    EuiSelectOption[]
  >([]);
  const [syncingStateFunc, setSyncingStateFunc] = useState<any>({
    getCurrentTab: () => TAB_INDEXED_FIELDS,
  });

  const refreshFilters = useCallback(() => {
    const tempIndexedFieldTypes: string[] = [];
    const tempScriptedFieldLanguages: string[] = [];
    indexPattern.fields.getAll().forEach((field) => {
      if (field.scripted) {
        if (field.lang) {
          tempScriptedFieldLanguages.push(field.lang);
        }
      } else {
        tempIndexedFieldTypes.push(field.type);
      }
    });

    setIndexedFieldType(
      convertToEuiSelectOption(tempIndexedFieldTypes, "indexedFiledTypes")
    );
    setScriptedFieldLanguages(
      convertToEuiSelectOption(
        tempScriptedFieldLanguages,
        "scriptedFieldLanguages"
      )
    );
  }, [indexPattern]);

  useEffect(() => {
    refreshFilters();
  }, [indexPattern, indexPattern.fields, refreshFilters]);

  const fieldWildcardMatcherDecorated = useCallback(
    (filters: string[]) =>
      fieldWildcardMatcher(filters, uiSettings.get(UI_SETTINGS.META_FIELDS)),
    [uiSettings]
  );

  const getFilterSection = useCallback(
    (type: string) => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiFieldSearch
              fullWidth
              placeholder={filterPlaceholder}
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              data-test-subj="indexPatternFieldFilter"
              aria-label={searchAriaLabel}
            />
          </EuiFlexItem>
          {type === TAB_INDEXED_FIELDS && indexedFieldTypes.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                options={indexedFieldTypes}
                value={indexedFieldTypeFilter}
                onChange={(e) => setIndexedFieldTypeFilter(e.target.value)}
                data-test-subj="indexedFieldTypeFilterDropdown"
                aria-label={filterAriaLabel}
              />
            </EuiFlexItem>
          )}
          {type === TAB_SCRIPTED_FIELDS && scriptedFieldLanguages.length > 0 && (
            <EuiFlexItem grow={false}>
              <EuiSelect
                options={scriptedFieldLanguages}
                value={scriptedFieldLanguageFilter}
                onChange={(e) => setScriptedFieldLanguageFilter(e.target.value)}
                data-test-subj="scriptedFieldLanguageFilterDropdown"
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      );
    },
    [
      fieldFilter,
      indexedFieldTypeFilter,
      indexedFieldTypes,
      scriptedFieldLanguageFilter,
      scriptedFieldLanguages,
    ]
  );

  const getComplexFilterSection = useCallback(
    () => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem grow={true}>
            <EuiFieldSearch
              fullWidth
              placeholder={filterPlaceholder}
              value={complexFieldFilter}
              onChange={(e) => setComplexFieldFilter(e.target.value)}
              data-test-subj="complexFieldFilter"
              aria-label={searchAriaLabel}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={() => {
                history.push(`/patterns/${indexPattern?.id}/complex/create`);
              }}
            >
              {"Create field"}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    },
    [
      complexFieldFilter,
      indexPattern,
    ]
  );

  const getContent = useCallback(
    (type: string) => {
      switch (type) {
        case TAB_INDEXED_FIELDS:
          return (
            <Fragment>
              <EuiSpacer size="m" />
              {getFilterSection(type)}
              <EuiSpacer size="m" />
              <IndexedFieldsTable
                fields={fields}
                indexPattern={indexPattern}
                fieldFilter={fieldFilter}
                fieldWildcardMatcher={fieldWildcardMatcherDecorated}
                indexedFieldTypeFilter={indexedFieldTypeFilter}
                helpers={{
                  redirectToRoute: (field: IndexPatternField) => {
                    history.push(getPath(field, indexPattern));
                  },
                  getFieldInfo: indexPatternManagementStart.list.getFieldInfo,
                }}
              />
            </Fragment>
          );
        case TAB_COMPLEX_FIELDS:
            return (
              <Fragment>
                <EuiSpacer size="m" />
                {getComplexFilterSection()}
                <EuiSpacer size="m" />
                <ComplexFieldsTable
                  fields={fields}
                  indexPattern={indexPattern}
                  fieldFilter={complexFieldFilter}
                  helpers={{
                    redirectToRoute: (field) => {
                      history.push(`/patterns/${indexPattern?.id}/complex/${field?.name}/edit`);
                    },
                    getFieldInfo: indexPatternManagementStart.list.getFieldInfo,
                  }}
                />
              </Fragment>
            );
        case TAB_SCRIPTED_FIELDS:
          return (
            <Fragment>
              <EuiSpacer size="m" />
              {getFilterSection(type)}
              <EuiSpacer size="m" />
              <ScriptedFieldsTable
                indexPattern={indexPattern}
                saveIndexPattern={saveIndexPattern}
                fieldFilter={fieldFilter}
                scriptedFieldLanguageFilter={scriptedFieldLanguageFilter}
                helpers={{
                  redirectToRoute: (field: IndexPatternField) => {
                    history.push(getPath(field, indexPattern));
                  },
                }}
                onRemoveField={refreshFilters}
                painlessDocLink={docLinks.links.scriptedFields.painless}
              />
            </Fragment>
          );
        case TAB_SOURCE_FILTERS:
          return (
            <Fragment>
              <EuiSpacer size="m" />
              {getFilterSection(type)}
              <EuiSpacer size="m" />
              <SourceFiltersTable
                saveIndexPattern={saveIndexPattern}
                indexPattern={indexPattern}
                filterFilter={fieldFilter}
                fieldWildcardMatcher={fieldWildcardMatcherDecorated}
                onAddOrRemoveFilter={refreshFilters}
              />
            </Fragment>
          );
      }
    },
    [
      docLinks.links.scriptedFields.painless,
      fieldFilter,
      fieldWildcardMatcherDecorated,
      fields,
      getFilterSection,
      getComplexFilterSection,
      history,
      indexPattern,
      indexPatternManagementStart.list.getFieldInfo,
      indexedFieldTypeFilter,
      refreshFilters,
      scriptedFieldLanguageFilter,
      saveIndexPattern,
    ]
  );

  const euiTabs: EuiTabbedContentTab[] = useMemo(
    () => {
      const tabs = getTabs(indexPattern, fieldFilter, indexPatternManagementStart.list).map(
        (tab: Pick<EuiTabbedContentTab, "name" | "id">) => {
          return {
            ...tab,
            content: getContent(tab.id),
          };
        }
      )
      let count = indexPattern?.complexFields?.length || 0
      if (complexFieldFilter) {
        const normalizedFieldFilter = complexFieldFilter.toLowerCase();
        const fields = indexPattern?.complexFields?.filter((field) =>
          field.name.toLowerCase().includes(normalizedFieldFilter)
        );
        count = fields.length
      }
      return tabs.concat([{
          name: `Complex fields (${count})`,
          id: TAB_COMPLEX_FIELDS,
          content: getContent(TAB_COMPLEX_FIELDS)
      }])
    },
    [fieldFilter, getContent, indexPattern, indexPatternManagementStart.list, complexFieldFilter]
  );

  const [selectedTabId, setSelectedTabId] = useState(euiTabs[0].id);

  useEffect(() => {
    const {
      startSyncingState,
      stopSyncingState,
      setCurrentTab,
      getCurrentTab,
    } = createEditIndexPatternPageStateContainer({
      useHashedUrl: uiSettings.get("state:storeInSessionStorage"),
      defaultTab: TAB_INDEXED_FIELDS,
    });

    startSyncingState();
    setSyncingStateFunc({
      setCurrentTab,
      getCurrentTab,
    });
    setSelectedTabId(getCurrentTab());

    return () => {
      stopSyncingState();
    };
  }, [uiSettings]);

  return (
    <EuiTabbedContent
      tabs={euiTabs}
      selectedTab={euiTabs.find((tab) => tab.id === selectedTabId)}
      onTabClick={(tab) => {
        setSelectedTabId(tab.id);
        syncingStateFunc.setCurrentTab(tab.id);
      }}
    />
  );
}
