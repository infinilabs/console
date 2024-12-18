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

import { EuiBadge, useInnerText } from '@elastic/eui';
import React, { FC } from 'react';
import { FilterLabel } from '../';
import { Filter, isFilterPinned } from '../../../../common';
import type { FilterLabelStatus } from '../filter_item';

interface Props {
  filter: Filter;
  valueLabel: string;
  filterLabelStatus: FilterLabelStatus;
  errorMessage?: string;
  [propName: string]: any;
}

export const FilterView: FC<Props> = ({
  filter,
  iconOnClick,
  onClick,
  valueLabel,
  errorMessage,
  filterLabelStatus,
  ...rest
}: Props) => {
  const [ref, innerText] = useInnerText();

  let title =
    errorMessage || `Filter: ${innerText}. Select for more filter actions.`;

  if (isFilterPinned(filter)) {
    title = `'Pinned', ${title}`;
  }
  if (filter.meta.disabled) {
    title = `'Disabled', ${title}`;
  }

  return (
    <EuiBadge
      title={title}
      color="hollow"
      iconType="cross"
      iconSide="right"
      closeButtonProps={{
        // Removing tab focus on close button because the same option can be obtained through the context menu
        // Also, we may want to add a `DEL` keyboard press functionality
        tabIndex: -1,
      }}
      iconOnClick={iconOnClick}
      iconOnClickAriaLabel={ 'Delete'}
      onClick={onClick}
      onClickAriaLabel={'Filter actions'}
      {...rest}
    >
      <span ref={ref}>
        <FilterLabel
          filter={filter}
          valueLabel={valueLabel}
          filterLabelStatus={filterLabelStatus}
        />
      </span>
    </EuiBadge>
  );
};
