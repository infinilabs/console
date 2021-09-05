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
import { formatMessage } from 'umi/locale';

export const DESTINATION_TYPE = {
  EMAIL: 'email',
  CUSTOM_HOOK: 'custom_webhook',
  SLACK: 'slack',
  // CHIME: 'chime',
};

export const DESTINATION_OPTIONS = [
  { value: DESTINATION_TYPE.EMAIL, text: formatMessage({ id: 'alert.destination.type.email' }) },
  { value: DESTINATION_TYPE.CUSTOM_HOOK, text: formatMessage({ id: 'alert.destination.type.custom_webhook' }) },
  { value: DESTINATION_TYPE.SLACK, text: formatMessage({ id: 'alert.destination.type.slack' }) },
  // { value: DESTINATION_TYPE.CHIME, text: formatMessage({ id: 'alert.destination.type.chime' }) },

];

export const ALLOW_LIST_SETTING_PATH = 'opendistro.alerting.destination.allow_list';
