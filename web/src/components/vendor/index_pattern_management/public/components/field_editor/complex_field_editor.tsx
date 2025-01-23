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

import React, { PureComponent, Fragment, useState, useCallback } from 'react';
import { intersection, union, get, cloneDeep } from 'lodash';

import {
  EuiButton,
  EuiButtonEmpty,
  EuiCode,
  EuiConfirmModal,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiOverlayMask,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EUI_MODAL_CONFIRM_BUTTON,
  EuiBadge,
} from '@elastic/eui';

import {
  IndexPatternField,
  FieldFormatInstanceType,
  IndexPattern,
  IFieldType,
  KBN_FIELD_TYPES,
  ES_FIELD_TYPES,
  DataPublicPluginStart,
} from '../../../../../kibana/data/public';

import { FieldFormatEditor } from './components/field_format_editor';
import { IndexPatternManagmentContextValue } from '../../types';

import { FIELD_TYPES_BY_LANG, DEFAULT_FIELD_TYPES } from './constants';

// This loads Ace editor's "groovy" mode, used below to highlight the script.
import 'brace/mode/groovy';
import { useGlobalContext } from '../../context';
import { formatMessage } from "umi/locale";
import { message } from 'antd';
import functions from './functions';
import styles from './complex_field_editor.less'
import { generate20BitUUID } from '@/utils/utils';

const getFieldTypeFormatsList = (
  field: IndexPatternField['spec'],
  defaultFieldFormat: FieldFormatInstanceType,
  fieldFormats: DataPublicPluginStart['fieldFormats']
) => {
  const formatsByType = fieldFormats
    .getByFieldType(field.type as KBN_FIELD_TYPES)
    .map(({ id, title }) => ({
      id,
      title,
    })).filter((item) => ['number', 'bytes', 'percent'].includes(item.id));

  return [
    {
      id: '',
      defaultFieldFormat,
      title: '- Default -',
    },
    ...formatsByType,
  ];
};

interface FieldTypeFormat {
  id: string;
  title: string;
}

interface InitialFieldTypeFormat extends FieldTypeFormat {
  defaultFieldFormat: FieldFormatInstanceType;
}

export interface FieldEditorState {
  isReady: boolean;
  isCreating: boolean;
  isDeprecatedLang: boolean;
  fieldTypes: string[];
  fieldTypeFormats: FieldTypeFormat[];
  existingFieldNames: string[];
  fieldFormatId?: string;
  fieldFormatParams: { [key: string]: unknown };
  showDeleteModal: boolean;
  hasFormatError: boolean;
  isSaving: boolean;
  errors?: string[];
  format: any;
  spec: IndexPatternField['spec'];
}

export interface FieldEdiorProps {
  indexPattern: IndexPattern;
  spec: IndexPatternField['spec'];
  services: {
    redirectAway: () => void;
    saveIndexPattern: DataPublicPluginStart['indexPatterns']['updateSavedObject'];
  };
}

const { data } = useGlobalContext();

export class ComplexFieldEditor extends PureComponent<FieldEdiorProps, FieldEditorState> {
  // static contextType = contextType;

  public readonly context!: IndexPatternManagmentContextValue;

  constructor(props: FieldEdiorProps, context: IndexPatternManagmentContextValue) {
    super(props, context);

    const { spec, indexPattern } = props;

    const isCreating = !indexPattern.complexFields.getByName(spec.name)
    const initSpec = cloneDeep({ ...spec, type: 'number' })
    if (isCreating) {
      initSpec['function'] = {
        'rate': {}
      }
    }
    const format = props.indexPattern.getFormatterForField(initSpec)
    const DefaultFieldFormat = data.fieldFormats.getDefaultType(
      initSpec.type as KBN_FIELD_TYPES,
      initSpec.esTypes as ES_FIELD_TYPES[]
    );
    this.state = {
      isDeprecatedLang: false,
      existingFieldNames: indexPattern.complexFields.getAll().map((f: IFieldType) => f.name),
      showDeleteModal: false,
      hasFormatError: false,
      isSaving: false,
      format: props.indexPattern.getFormatterForField(initSpec),
      spec: initSpec,
      isReady: true,
      isCreating: !indexPattern.complexFields.getByName(initSpec.name),
      errors: [],
      fieldTypeFormats: getFieldTypeFormatsList(
        initSpec,
        DefaultFieldFormat as FieldFormatInstanceType,
        data.fieldFormats
      ),
      fieldFormatId: get(indexPattern, ['fieldFormatMap', initSpec.name, 'type', 'id']),
      fieldFormatParams: format?.params(),
    };
  }

  onFieldChange = (fieldName: string, value: string | number) => {
    const { spec } = this.state;
    (spec as any)[fieldName] = value;
    this.forceUpdate();
  };

  onFormatChange = (formatId: string, params?: any) => {
    const { spec, fieldTypeFormats } = this.state;
    const { uiSettings, data } = useGlobalContext(); //this.context.services;

    const FieldFormat = data.fieldFormats.getType(
      formatId || (fieldTypeFormats[0] as InitialFieldTypeFormat).defaultFieldFormat.id
    ) as FieldFormatInstanceType;

    const newFormat = new FieldFormat(params, (key)=>{})//(key) => uiSettings.get(key));
    spec.format = newFormat;

    this.setState({
      fieldFormatId: FieldFormat.id,
      fieldFormatParams: newFormat.params(),
      format: newFormat,
    });
  };

  onFormatParamsChange = (newParams: { fieldType: string; [key: string]: any }) => {
    const { fieldFormatId } = this.state;
    this.onFormatChange(fieldFormatId as string, newParams);
  };

  onFormatParamsError = (error?: string) => {
    this.setState({
      hasFormatError: !!error,
    });
  };

  isDuplicateName() {
    const { isCreating, spec, existingFieldNames } = this.state;
    return isCreating && existingFieldNames.includes(spec.name);
  }

  renderName() {
    const { isCreating, spec } = this.state;
    const isInvalid = !spec.name || !spec.name.trim();

    return isCreating ? (
      <EuiFormRow
        label={'Name'}
        helpText={
          this.isDuplicateName() ? (
            <span>
              <EuiIcon type="alert" color="warning" size="s" />
              &nbsp;
              You already have a field with the name <EuiCode>{spec.name}</EuiCode>.
            </span>
          ) : null
        }
        isInvalid={isInvalid}
        error={
          isInvalid
            ? 'Name is required'
            : null
        }
      >
        <EuiFieldText
          value={spec.name || ''}
          placeholder={'New field'}
          data-test-subj="editorFieldName"
          onChange={(e) => {
            this.onFieldChange('name', e.target.value);
          }}
          isInvalid={isInvalid}
        />
      </EuiFormRow>
    ) : null;
  }

  renderFormat() {
    const { spec, fieldTypeFormats, fieldFormatId, fieldFormatParams, format } = this.state;
    const { indexPatternManagementStart } = useGlobalContext(); //this.context.services;
    const defaultFormat = (fieldTypeFormats[0] as InitialFieldTypeFormat).defaultFieldFormat.title;

    const label = defaultFormat ? (<>
      Format (Default: <EuiCode>{defaultFormat}</EuiCode>)</>
    ) : (
      "Format"
    );

    return (
      <Fragment>
        <EuiFormRow
          label={label}
          helpText={
            `Formatting allows you to control the way that specific values are displayed. It can also cause values to be
              completely changed and prevent highlighting in Discover from working.`
          }
        >
          <EuiSelect
            value={fieldFormatId}
            options={fieldTypeFormats.map((fmt) => {
              return { value: fmt.id || '', text: fmt.title };
            })}
            data-test-subj="editorSelectedFormatId"
            onChange={(e) => {
              this.onFormatChange(e.target.value);
            }}
          />
        </EuiFormRow>
        {fieldFormatId ? (
          <FieldFormatEditor
            fieldType={spec.type}
            fieldFormat={format}
            fieldFormatId={fieldFormatId}
            fieldFormatParams={fieldFormatParams}
            fieldFormatEditors={indexPatternManagementStart.fieldFormatEditors}
            onChange={this.onFormatParamsChange}
            onError={this.onFormatParamsError}
          />
        ) : null}
      </Fragment>
    );
  }

  renderDeleteModal = () => {
    const { spec } = this.state;

    return this.state.showDeleteModal ? (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={ `Delete field '${spec.metric_name }'`}
          onCancel={this.hideDeleteModal}
          onConfirm={() => {
            this.hideDeleteModal();
            this.deleteField();
          }}
          cancelButtonText='Cancel'
          confirmButtonText= 'Delete'
          buttonColor="danger"
          defaultFocusedButton={EUI_MODAL_CONFIRM_BUTTON}
        >
          <p>
            You can't recover a deleted field. <span>
                    <br />
                    <br />
                  </span>Are you sure you want to do this?
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    ) : null;
  };

  showDeleteModal = () => {
    this.setState({
      showDeleteModal: true,
    });
  };

  hideDeleteModal = () => {
    this.setState({
      showDeleteModal: false,
    });
  };

  renderActions() {
    const { isCreating, spec, isSaving } = this.state;
    const { redirectAway } = this.props.services;

    if (spec?.builtin) {
      return null
    }

    return (
      <EuiFormRow>
        <EuiFlexGroup>
          <EuiFlexItem grow={false}>
            <EuiButton
              fill
              onClick={this.saveField}
              isDisabled={this.isSavingDisabled()}
              isLoading={isSaving}
              data-test-subj="fieldSaveButton"
            >
              {isCreating ? (
                "Create field"
              ) : (
                "Save field"
              )}
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={redirectAway} data-test-subj="fieldCancelButton">
              Cancel
            </EuiButtonEmpty>
          </EuiFlexItem>
          {!isCreating ? (
            <EuiFlexItem>
              <EuiFlexGroup justifyContent="flexEnd">
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty color="danger" onClick={this.showDeleteModal}>
                    Delete
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      </EuiFormRow>
    );
  }

  deleteField = () => {
    const { redirectAway, saveIndexPattern } = this.props.services;

    const field = this.state.spec;
    const { indexPattern } = this.props;

    const fieldExists = !!indexPattern.complexFields.getByName(field.name);

    if (fieldExists) {
      indexPattern.complexFields.remove(field);
    }

    if (indexPattern.fieldFormatMap[field.name]) {
      indexPattern.fieldFormatMap[field.name] = undefined;
    }

    saveIndexPattern(indexPattern).then(() => {
      // const message = `Deleted '${spec.name}'`;
      // this.context.services.notifications.toasts.addSuccess(message);
      redirectAway();
    });
  };

  saveField = async () => {
    const field = this.state.spec;
    const { indexPattern } = this.props;
    const { fieldFormatId } = this.state;

    const { redirectAway, saveIndexPattern } = this.props.services;
    const fieldExists = !!indexPattern.complexFields.getByName(field.name);

    let oldField: IndexPatternField['spec'];

    if (fieldExists) {
      oldField = indexPattern.complexFields.getByName(field.name)!.spec;
      indexPattern.complexFields.update(field);
    } else {
      field.name = generate20BitUUID()
      indexPattern.complexFields.add(field);
    }

    if (!fieldFormatId) {
      indexPattern.fieldFormatMap[field.name] = undefined;
    } else {
      indexPattern.fieldFormatMap[field.name] = field.format;
    }

    return saveIndexPattern(indexPattern)
      .then(() => {
        // const message = i18n.translate('indexPatternManagement.deleteField.savedHeader', {
        //   defaultMessage: "Saved '{fieldName}'",
        //   values: { fieldName: field.name },
        // });
        // this.context.services.notifications.toasts.addSuccess(message);
        redirectAway();
      })
      .catch(() => {
        if (oldField) {
          indexPattern.complexFields.update(oldField);
        } else {
          indexPattern.complexFields.remove(field);
        }
      });
  };

  isSavingDisabled() {
    const { spec, hasFormatError } = this.state;

    if (
      hasFormatError
    ) {
      return true;
    }

    return false;
  }

  renderFunction(func) {
    const { spec } = this.state;
    const { indexPattern } = this.props;
    const component = functions[func]
    const props = {
      spec,
      indexPattern,
      onChange: (value) => {
        this.onFieldChange('function', value)
      }
    }
    if (component) {
      return component(props)
    }
  }

  renderMetricConfig() {
    const { spec } = this.state;
    const keys = Object.keys(spec?.function || {})
    const statistic = keys[0]

    return (
      <>
        <EuiFormRow
          label={'Metric Name'}
        >
          <EuiFieldText
            value={spec?.metric_name}
            onChange={(e) => {
              this.onFieldChange('metric_name', e.target.value)
            }}
          />
        </EuiFormRow>
        <EuiFormRow
          label={'Function'}
        >
          <EuiSelect
            options={[
              "rate",
              "rate_sum_func_value_in_group",
              "latency",
              "latency_sum_func_value_in_group",
              "sum_func_value_in_group",
            ].map((item) => ({ value: item, text: item.toUpperCase() }))}
            value={statistic}
            onChange={(e) => {
              this.onFieldChange('function', { [e.target.value]: {} })
            }}
          />
        </EuiFormRow>
        {this.renderFunction(statistic || 'rate')}
        {this.renderFormat()}
        <EuiFormRow
          label={'Unit'}
        >
          <EuiFieldText
            value={spec?.unit}
            onChange={(e) => {
              this.onFieldChange('unit', e.target.value)
            }}
          />
        </EuiFormRow>
        <EuiFormRow
          label={'Tags'}
        >
          <Tags value={spec?.tags} onChange={(value) => {
            this.onFieldChange('tags', value)
          }}/>
        </EuiFormRow>
      </>
    );
  }

  render() {
    const { isReady, isCreating, spec } = this.state;

    return isReady ? (
      <div className={styles.editor}>
        <EuiText>
          <h3>
            {isCreating ? (
              "Create field"
            ) : (
              `Edit ${spec.metric_name }`
            )}
          </h3>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiForm>
          {this.renderMetricConfig()}
          {this.renderActions()}
          {this.renderDeleteModal()}
        </EuiForm>
        <EuiSpacer size="l" />
      </div>
    ) : null;
  }
}

const Tags = ({ value = [], onChange }) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleRemove = useCallback(
    (index) => {
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    },
    [value]
  );

  const handleInputConfirm = (input) => {
    if (input.length === 0) {
      return message.warning(
        formatMessage({ id: "command.message.invalid.tag" })
      );
    }
    if (input) onChange([...(value || []), input]);
    setInputVisible(false);
    setInputValue("");
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleInputConfirm(inputValue)
    }
  };

  return (
    <EuiFlexGroup wrap responsive={false} gutterSize="xs">
      {value.map((tag, index) => (
        <EuiFlexItem grow={false}>
          <EuiBadge
            color="hollow"
            iconType="cross"
            iconSide="right"
            iconOnClick={() => handleRemove(index)}
            style={{ height: '40px', lineHeight: '40px', fontSize: 14, fontWeight: 400 }}
          >
            {tag}
          </EuiBadge>
        </EuiFlexItem>
        
      ))}
      {inputVisible && (
        <EuiFlexItem grow={false}>
          <EuiFieldText
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={() => handleInputConfirm(inputValue)}
            autoFocus
          />
        </EuiFlexItem>
      )}
      {!inputVisible && (
        <EuiFlexItem grow={false}>
          <EuiBadge
            color="hollow"
            iconType="plus"
            iconSide="left"
            onClick={showInput}
            style={{ height: '40px', lineHeight: '40px', fontSize: 14}}
          >
            Add New
          </EuiBadge>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
