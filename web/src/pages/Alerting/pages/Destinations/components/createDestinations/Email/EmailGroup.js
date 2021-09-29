/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import React from 'react';
import { EuiAccordion, EuiButton } from '@elastic/eui';
import { FormikComboBox, FormikFieldText } from '../../../../../components/FormControls';
import { isInvalid, hasError } from '../../../../../utils/validate';
import { validateEmailGroupEmails, validateEmailGroupName } from './utils/validate';
import { STATE } from './utils/constants';
import {formatMessage} from 'umi/locale';

const onEmailGroupChange = (index, emailGroup, arrayHelpers) => {
  // Checking for id here since new email groups should not be marked as updated
  // Also will not replace the email group state if it has already been marked as updated
  if (emailGroup.id && emailGroup.state !== STATE.UPDATED) {
    arrayHelpers.replace(index, {
      ...emailGroup,
      state: STATE.UPDATED,
    });
  }
};

const onCreateOption = (fieldName, value, selectedOptions, setFieldValue) => {
  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) return false;

  const newOption = { label: value };
  setFieldValue(fieldName, [...selectedOptions, newOption]);
};

const EmailGroup = ({ emailGroup, emailOptions, arrayHelpers, context, index, onDelete }) => {
  const { name } = emailGroup;
  return (
    <EuiAccordion
      id={name}
      buttonContent={!name ? 'New email group' : name}
      paddingSize="l"
      extraAction={
        <EuiButton color="danger" size="s" onClick={onDelete}>
          {formatMessage({id:'alert.emailgroup.manage.button.remove'})}
        </EuiButton>
      }
    >
      <FormikFieldText
        name={`emailGroups.${index}.name`}
        formRow
        fieldProps={{ validate: validateEmailGroupName(context.ctx.emailGroups) }}
        rowProps={{
          label: formatMessage({id:'alert.emailgroup.manage.field.name'}),
          helpText:formatMessage({id:'alert.emailgroup.manage.field.name.help'}),
          style: { padding: '10px 0px' },
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          placeholder: 'my-email-group',
          onChange: (e, field, form) => {
            field.onChange(e);
            onEmailGroupChange(index, emailGroup, arrayHelpers);
          },
        }}
      />
      <FormikComboBox
        name={`emailGroups.${index}.emails`}
        formRow
        fieldProps={{ validate: validateEmailGroupEmails }}
        rowProps={{
          label: formatMessage({id:'alert.emailgroup.manage.field.emails'}),
          helpText: formatMessage({id:'alert.emailgroup.manage.field.emails.help'}),
          isInvalid,
          error: hasError,
        }}
        inputProps={{
          placeholder: 'Email addresses',
          options: emailOptions,
          onChange: (options, field, form) => {
            form.setFieldValue(`emailGroups.${index}.emails`, options);
            onEmailGroupChange(index, emailGroup, arrayHelpers);
          },
          onBlur: (e, field, form) => {
            form.setFieldTouched(`emailGroups.${index}.emails`, true);
          },
          onCreateOption: (value, field, form) => {
            onCreateOption(`emailGroups.${index}.emails`, value, field.value, form.setFieldValue);
          },
          isClearable: true,
        }}
      />
    </EuiAccordion>
  );
};

export default EmailGroup;
