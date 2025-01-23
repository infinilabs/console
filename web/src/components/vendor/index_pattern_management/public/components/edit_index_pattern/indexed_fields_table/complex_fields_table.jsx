import React, { Component } from "react";
import { createSelector } from "reselect";
import { Table } from "./components/table";
import { getFieldFormat } from "./lib";
import { IndexPatternField, IndexPattern, IFieldType } from "../../../import";
import { EuiContext } from "@elastic/eui";
import { formatMessage } from "umi/locale";
import { router } from "umi";

export class ComplexFieldsTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fields: this.mapFields(this.props.indexPattern?.complexFields),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.indexPattern?.complexFields !== this.props.indexPattern?.complexFields) {
      this.setState({
        fields: this.mapFields(nextProps.indexPattern?.complexFields),
      });
    }
  }

  mapFields(fields) {
    const { indexPattern, fieldWildcardMatcher, helpers } = this.props;
    const sourceFilters =
      indexPattern.sourceFilters &&
      indexPattern.sourceFilters.map((f) => f.value);
    const fieldWildcardMatch = fieldWildcardMatcher ? fieldWildcardMatcher(sourceFilters || []) : undefined;
    return (
      (fields &&
        fields.map((field) => {
          const func = Object.keys(field.spec?.function || {})[0]
          return {
            ...field.spec,
            displayName: field.spec.metric_name,
            func: func,
            format: getFieldFormat(indexPattern, field.name),
            excluded: fieldWildcardMatch
              ? fieldWildcardMatch(field.name)
              : false,
            info:
              helpers.getFieldInfo && helpers.getFieldInfo(indexPattern, field),
          };
        })) ||
      []
    );
  }

  getFilteredFields = createSelector(
    (state) => state.fields,
    (state, props) =>
      props.fieldFilter,
    (state, props) =>
      props.indexedFieldTypeFilter,
    (fields, fieldFilter, indexedFieldTypeFilter) => {
      if (fieldFilter) {
        const normalizedFieldFilter = fieldFilter.toLowerCase();
        fields = fields.filter((field) =>
          field.name.toLowerCase().includes(normalizedFieldFilter)
        );
      }

      if (indexedFieldTypeFilter) {
        fields = fields.filter(
          (field) => field.type === indexedFieldTypeFilter
        );
      }

      return fields;
    }
  );

  render() {
    const { indexPattern } = this.props;
    const fields = this.getFilteredFields(this.state, {...this.props, fields: indexPattern?.complexFields});
    const editField = (field) => this.props.helpers.redirectToRoute(field)
    debugger

    return (
      <div>
        <EuiContext
          i18n={{
            mapping: {
              "euiTablePagination.rowsPerPage": formatMessage({
                id: "explore.table.rows_of_page",
              }),
              "euiTablePagination.rowsPerPageOption":
                "{rowsPerPage} " +
                formatMessage({ id: "explore.table.rows_of_page_option" }),
            },
          }}
        >
          <Table
            indexPattern={indexPattern}
            items={fields}
            editField={editField}
            columns={[
                  {
                    field: 'displayName',
                    name: 'Name',
                    dataType: 'string',
                    sortable: true,
                    render: (value) => value,
                    width: '38%',
                    'data-test-subj': 'complexFieldName',
                  },
                  {
                    field: 'func',
                    name: 'Function',
                    dataType: 'string',
                    sortable: true,
                    render: (value) => value ? value.toUpperCase() : '-',
                    'data-test-subj': 'complexFieldFunc',
                  },
                  {
                    field: 'format',
                    name: 'Format',
                    dataType: 'string',
                    sortable: true,
                    render: (value) => value || 'Number',
                    'data-test-subj': 'complexFieldFormat',
                  },
                  {
                    field: 'tags',
                    name: 'Tags',
                    dataType: 'auto',
                    render: (value) => {
                      return value?.join(', ');
                    },
                    'data-test-subj': 'complexFieldTags',
                  },
                  {
                    name: '',
                    actions: [
                      {
                        name: 'Edit',
                        description: 'Edit',
                        icon: 'pencil',
                        onClick: editField,
                        type: 'icon',
                        'data-test-subj': 'editFieldFormat',
                      },
                    ],
                    width: '40px',
                  },
                ]}
          />
        </EuiContext>
      </div>
    );
  }
}
