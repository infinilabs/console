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

import React, { PureComponent, Fragment, useState, useMemo, useCallback } from 'react';
import { intersection, union, get, cloneDeep } from 'lodash';

import {
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiCodeEditor,
  EuiConfirmModal,
  EuiFieldNumber,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiIcon,
  EuiLink,
  EuiOverlayMask,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EUI_MODAL_CONFIRM_BUTTON,
  EuiFilterButton,
  EuiFilterGroup,
  EuiPopover,
  EuiSelectable,
  EuiPopoverTitle,
  EuiBadge,
} from '@elastic/eui';

import {
  getEnabledScriptingLanguages,
  getDeprecatedScriptingLanguages,
  getSupportedScriptingLanguages,
} from '../../scripting_languages';
import {
  IndexPatternField,
  FieldFormatInstanceType,
  IndexPattern,
  IFieldType,
  KBN_FIELD_TYPES,
  ES_FIELD_TYPES,
  DataPublicPluginStart,
} from '../../../../../kibana/data/public';
// import { context as contextType } from '../../../../kibana_react/public';
import {
  ScriptingDisabledCallOut,
  ScriptingWarningCallOut,
} from './components/scripting_call_outs';

import { ScriptingHelpFlyout } from './components/scripting_help';
import { FieldFormatEditor } from './components/field_format_editor';
import { IndexPatternManagmentContextValue } from '../../types';

import { FIELD_TYPES_BY_LANG, DEFAULT_FIELD_TYPES } from './constants';
import { executeScript, isScriptValid } from './lib';

// This loads Ace editor's "groovy" mode, used below to highlight the script.
import 'brace/mode/groovy';
import { useGlobalContext } from '../../context';
import { formatMessage } from "umi/locale";
import { message } from 'antd';

const getStatistics = (type) => {
  if (!type || type === 'string') return ["count",  "cardinality"];
  return [
    "max",
    "min",
    "avg",
    "sum",
    "medium",
    "p99",
    "p95",
    "p90",
    "p80",
    "p50",
    "count",
    "cardinality",
  ];
};

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
    }));

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
  scriptingLangs: string[];
  fieldTypes: string[];
  fieldTypeFormats: FieldTypeFormat[];
  existingFieldNames: string[];
  fieldFormatId?: string;
  fieldFormatParams: { [key: string]: unknown };
  showScriptingHelp: boolean;
  showDeleteModal: boolean;
  hasFormatError: boolean;
  hasScriptError: boolean;
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

export class FieldEditor extends PureComponent<FieldEdiorProps, FieldEditorState> {
  // static contextType = contextType;

  public readonly context!: IndexPatternManagmentContextValue;

  supportedLangs: string[] = [];
  deprecatedLangs: string[] = [];
  constructor(props: FieldEdiorProps, context: IndexPatternManagmentContextValue) {
    super(props, context);

    const { spec, indexPattern } = props;

    this.state = {
      isReady: false,
      isCreating: false,
      isDeprecatedLang: false,
      scriptingLangs: [],
      fieldTypes: [],
      fieldTypeFormats: [],
      existingFieldNames: indexPattern.fields.getAll().map((f: IFieldType) => f.name),
      fieldFormatId: undefined,
      fieldFormatParams: {},
      showScriptingHelp: false,
      showDeleteModal: false,
      hasFormatError: false,
      hasScriptError: false,
      isSaving: false,
      format: props.indexPattern.getFormatterForField(spec),
      spec: { ...spec },
    };
    this.supportedLangs = getSupportedScriptingLanguages();
    this.deprecatedLangs = getDeprecatedScriptingLanguages();
    this.init(context);
  }

  async init(context: IndexPatternManagmentContextValue) {
    const { http, notifications, data } = useGlobalContext();//context.services;
    const { format, spec } = this.state;
    const { indexPattern } = this.props;

    const enabledLangs = await getEnabledScriptingLanguages(http, notifications.toasts);
    const scriptingLangs = intersection(
      enabledLangs,
      union(this.supportedLangs, this.deprecatedLangs)
    );

    spec.lang = spec.lang && scriptingLangs.includes(spec.lang) ? spec.lang : undefined;
    if (spec.scripted && !spec.lang) {
      spec.lang = scriptingLangs[0];
    }

    const fieldTypes = get(FIELD_TYPES_BY_LANG, spec.lang || '', DEFAULT_FIELD_TYPES);
    spec.type = fieldTypes.includes(spec.type) ? spec.type : fieldTypes[0];

    const DefaultFieldFormat = data.fieldFormats.getDefaultType(
      spec.type as KBN_FIELD_TYPES,
      spec.esTypes as ES_FIELD_TYPES[]
    );

    this.setState({
      isReady: true,
      isCreating: !indexPattern.fields.getByName(spec.name),
      isDeprecatedLang: this.deprecatedLangs.includes(spec.lang || ''),
      errors: [],
      scriptingLangs,
      fieldTypes,
      fieldTypeFormats: getFieldTypeFormatsList(
        spec,
        DefaultFieldFormat as FieldFormatInstanceType,
        data.fieldFormats
      ),
      fieldFormatId: get(indexPattern, ['fieldFormatMap', spec.name, 'type', 'id']),
      fieldFormatParams: format?.params(),
    });
  }

  onFieldChange = (fieldName: string, value: string | number) => {
    const { spec } = this.state;
    (spec as any)[fieldName] = value;
    this.forceUpdate();
  };

  onTypeChange = (type: KBN_FIELD_TYPES) => {
    const { uiSettings, data } = useGlobalContext() //this.context.services;
    const { spec, format } = this.state;
    const DefaultFieldFormat = data.fieldFormats.getDefaultType(type) as FieldFormatInstanceType;

    spec.type = type;

    spec.format = new DefaultFieldFormat(null, (key) => uiSettings.get(key));

    this.setState({
      fieldTypeFormats: getFieldTypeFormatsList(spec, DefaultFieldFormat, data.fieldFormats),
      fieldFormatId: DefaultFieldFormat.id,
      fieldFormatParams: format.params(),
    });
  };

  onLangChange = (lang: string) => {
    const { spec } = this.state;
    const fieldTypes = get(FIELD_TYPES_BY_LANG, lang, DEFAULT_FIELD_TYPES);
    spec.lang = lang;
    spec.type = fieldTypes.includes(spec.type) ? spec.type : fieldTypes[0];

    this.setState({
      fieldTypes,
    });
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
              <strong>
                      Mapping Conflict:
                    </strong> You already have a field with the name <EuiCode>{spec.name}</EuiCode>. Naming your scripted field with
              the same name means you won't be able to query both fields at the same time.
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
          placeholder={'New scripted field'}
          data-test-subj="editorFieldName"
          onChange={(e) => {
            this.onFieldChange('name', e.target.value);
          }}
          isInvalid={isInvalid}
        />
      </EuiFormRow>
    ) : null;
  }

  renderLanguage() {
    const { spec, scriptingLangs, isDeprecatedLang } = this.state;

    return spec.scripted ? (
      <EuiFormRow
        label={ 'Language'}
        helpText={
          isDeprecatedLang ? (
            <span>
              <EuiIcon type="alert" color="warning" size="s" />
              &nbsp;
              <strong>
                Deprecation Warning:
              </strong>
              &nbsp;
              <EuiCode>{spec.lang}</EuiCode> is deprecated and support will be removed in the next major version of Kibana and Elasticsearch.
              We recommend using   <EuiLink
                      target="_blank"
                      href={this.context.services.docLinks.links.scriptedFields.painless}
                    >
                      Painless
                    </EuiLink> for new scripted fields.
            </span>
          ) : null
        }
      >
        <EuiSelect
          value={spec.lang}
          options={scriptingLangs.map((lang) => {
            return { value: lang, text: lang };
          })}
          data-test-subj="editorFieldLang"
          onChange={(e) => {
            this.onLangChange(e.target.value);
          }}
        />
      </EuiFormRow>
    ) : null;
  }

  renderType() {
    const { spec, fieldTypes } = this.state;

    return (
      <EuiFormRow
        label={'Type'}
      >
        <EuiSelect
          value={spec.type}
          disabled={!spec.scripted}
          options={fieldTypes.map((type) => {
            return { value: type, text: type };
          })}
          data-test-subj="editorFieldType"
          onChange={(e) => {
            this.onTypeChange(e.target.value as KBN_FIELD_TYPES);
          }}
        />
      </EuiFormRow>
    );
  }

  /**
   * renders a warning and a table of conflicting indices
   * in case there are indices with different types
   */
  renderTypeConflict() {
    const { spec } = this.state;
    if (!spec.conflictDescriptions || typeof spec.conflictDescriptions !== 'object') {
      return null;
    }

    const columns = [
      {
        field: 'type',
        name: 'Type',
        width: '100px',
      },
      {
        field: 'indices',
        name:  'Index names',
      },
    ];

    const items = Object.entries(spec.conflictDescriptions).map(([type, indices]) => ({
      type,
      indices: Array.isArray(indices) ? indices.join(', ') : 'Index names unavailable',
    }));

    return (
      <div>
        <EuiSpacer size="m" />
        <EuiCallOut
          color="warning"
          iconType="alert"
          title={
            "Field type conflict"
          }
          size="s"
        >
          The type of this field changes across indices. It is unavailable for many analysis functions.
          The indices per type are as follows:
        </EuiCallOut>
        <EuiSpacer size="m" />
        <EuiBasicTable items={items} columns={columns} />
        <EuiSpacer size="m" />
      </div>
    );
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

  renderPopularity() {
    const { spec } = this.state;

    return (
      <EuiFormRow
        label={ 'Popularity'}
      >
        <EuiFieldNumber
          value={spec.count}
          data-test-subj="editorFieldCount"
          onChange={(e) => {
            this.onFieldChange('count', e.target.value ? Number(e.target.value) : '');
          }}
        />
      </EuiFormRow>
    );
  }

  onScriptChange = (value: string) => {
    this.setState({
      hasScriptError: false,
    });
    this.onFieldChange('script', value);
  };

  renderScript() {
    const { spec, hasScriptError } = this.state;
    const isInvalid = !spec.script || !spec.script.trim() || hasScriptError;
    const errorMsg = hasScriptError ? (
      <span data-test-subj="invalidScriptError">
        Script is invalid. View script preview for details
      </span>
    ) : (
      "Script is required"
    )
    
    return spec.scripted ? (
      <Fragment>
        <EuiFormRow
          fullWidth
          label={'Script'}
          isInvalid={isInvalid}
          error={isInvalid ? errorMsg : null}
        >
          <EuiCodeEditor
            value={spec.script}
            data-test-subj="editorFieldScript"
            onChange={this.onScriptChange}
            mode="groovy"
            width="100%"
            height="300px"
          />
        </EuiFormRow>

        <EuiFormRow>
          <Fragment>
            <EuiText>
              Access fields with  <code>{`doc['some_field'].value`}</code>.
            </EuiText>
            <br />
            <EuiLink onClick={this.showScriptingHelp} data-test-subj="scriptedFieldsHelpLink">
              Get help with the syntax and preview the results of your script.
            </EuiLink>
          </Fragment>
        </EuiFormRow>
      </Fragment>
    ) : null;
  }

  showScriptingHelp = () => {
    this.setState({
      showScriptingHelp: true,
    });
  };

  hideScriptingHelp = () => {
    this.setState({
      showScriptingHelp: false,
    });
  };

  renderDeleteModal = () => {
    const { spec } = this.state;

    return this.state.showDeleteModal ? (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={ `Delete field '${spec.name }'`}
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
          {!isCreating && spec.scripted ? (
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

  renderScriptingPanels = () => {
    const { scriptingLangs, spec, showScriptingHelp } = this.state;

    if (!spec.scripted) {
      return;
    }

    return (
      <Fragment>
        <ScriptingDisabledCallOut isVisible={!scriptingLangs.length} />
        <ScriptingWarningCallOut isVisible />
        <ScriptingHelpFlyout
          isVisible={showScriptingHelp}
          onClose={this.hideScriptingHelp}
          indexPattern={this.props.indexPattern}
          lang={spec.lang as string}
          name={spec.name}
          script={spec.script}
          executeScript={executeScript}
        />
      </Fragment>
    );
  };

  deleteField = () => {
    const { redirectAway, saveIndexPattern } = this.props.services;
    const { indexPattern } = this.props;
    const { spec } = this.state;
    indexPattern.removeScriptedField(spec.name);
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

    if (field.scripted) {
      this.setState({
        isSaving: true,
      });

      const isValid = await isScriptValid({
        name: field.name,
        script: field.script as string,
        indexPatternTitle: indexPattern.title,
        http: useGlobalContext().http, //this.context.services.http,
      });

      if (!isValid) {
        this.setState({
          hasScriptError: true,
          isSaving: false,
        });
        return;
      }
    }

    const { redirectAway, saveIndexPattern } = this.props.services;
    const fieldExists = !!indexPattern.fields.getByName(field.name);

    let oldField: IndexPatternField['spec'];

    if (fieldExists) {
      oldField = indexPattern.fields.getByName(field.name)!.spec;
      indexPattern.fields.update(field);
    } else {
      indexPattern.fields.add(field);
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
          indexPattern.fields.update(oldField);
        } else {
          indexPattern.fields.remove(field);
        }
      });
  };

  isSavingDisabled() {
    const { spec, hasFormatError, hasScriptError } = this.state;

    if (
      hasFormatError ||
      hasScriptError ||
      !spec.name ||
      !spec.name.trim() ||
      (spec.scripted && (!spec.script || !spec.script.trim()))
    ) {
      return true;
    }

    return false;
  }

  onMetricSettingsChange = (key, value) => {
    const { spec = {} } = this.state;
    const settings = cloneDeep(spec['metric_config'] || {})
    settings[key] = value
    this.onFieldChange('metric_config', settings)
  };

  renderMetricConfig() {
    const { spec } = this.state;

    return (
      <>
        <EuiFormRow
          label={'Metric Name'}
        >
          <EuiFieldText
            value={spec?.metric_config?.name}
            onChange={(e) => {
              this.onMetricSettingsChange('name', e.target.value)
            }}
          />
        </EuiFormRow>
        <EuiFormRow
          label={'Statistics'}
        >
          <StatisticsSelect 
            value={spec?.metric_config?.option_aggs || []}
            statistics={getStatistics(spec?.type)}
            onChange={(value) => {
              this.onMetricSettingsChange('option_aggs', value)
            }}
          />
        </EuiFormRow>
        
        <EuiFormRow
          label={'Unit'}
        >
          <EuiFieldText
            value={spec?.metric_config?.unit}
            onChange={(e) => {
              this.onMetricSettingsChange('unit', e.target.value)
            }}
          />
        </EuiFormRow>
        <EuiFormRow
          label={'Tags'}
        >
          <Tags value={spec?.metric_config?.tags} onChange={(value) => {
            this.onMetricSettingsChange('tags', value)
          }}/>
        </EuiFormRow>
      </>
    );
  }

  render() {
    const { isReady, isCreating, spec } = this.state;

    return isReady ? (
      <div>
        <EuiText>
          <h3>
            {isCreating ? (
              "Create scripted field"
            ) : (
              `Edit ${spec.name }`
            )}
          </h3>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiForm>
          {this.renderScriptingPanels()}
          {this.renderName()}
          {this.renderLanguage()}
          {this.renderType()}
          {this.renderTypeConflict()}
          {this.renderFormat()}
          {this.renderPopularity()}
          {this.renderScript()}
          {this.renderMetricConfig()}
          {this.renderActions()}
          {this.renderDeleteModal()}
        </EuiForm>
        <EuiSpacer size="l" />
      </div>
    ) : null;
  }
}


const StatisticsSelect = (props) => {

  const { value = [], statistics = [], onChange } = props;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };
  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  const items = useMemo(() => {
    return statistics.map((item) => ({
      label: item.toUpperCase(), key: item, checked: value.includes(item) ? 'on' : undefined
    }))
  }, [value, statistics])

  const button = (
    <EuiFilterButton
      iconType="arrowDown"
      badgeColor="success"
      onClick={onButtonClick}
      isSelected={isPopoverOpen}
      // numFilters={items.filter((item) => item.checked !== 'off').length}
      // hasActiveFilters={!!items.find((item) => item.checked === 'on')}
      // numActiveFilters={items.filter((item) => item.checked === 'on').length}
    >
      {value.map((item) => item.toUpperCase()).join(', ')}
    </EuiFilterButton>
  );
  return (
    <>
      <EuiFilterGroup style={{ width: '100%' }}>
        <EuiPopover
          button={button}
          isOpen={isPopoverOpen}
          closePopover={closePopover}
          panelPaddingSize="none"
        >
          <EuiSelectable
            allowExclusions
            searchable
            searchProps={{
              placeholder: 'Filter list',
              compressed: true,
            }}
            aria-label="Composers"
            options={items}
            onChange={(newOptions) => {
              onChange(newOptions.filter((item) => item.checked === 'on').map((item) => item.key))
            }}
            emptyMessage="No data"
            noMatchesMessage="No data"
          >
            {(list, search) => (
              <div style={{ width: 300 }}>
                <EuiPopoverTitle paddingSize="s">{search}</EuiPopoverTitle>
                {list}
              </div>
            )}
          </EuiSelectable>
        </EuiPopover>
      </EuiFilterGroup>
    </>
  );
};

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
            style={{ height: '40px', lineHeight: '40px', fontSize: 14}}
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
