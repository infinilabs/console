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

import { EuiListGroupItem, EuiConfirmModal, EuiOverlayMask, EuiIconTip } from '@elastic/eui';

import React, { Fragment, useState } from 'react';
import classNames from 'classnames';
import { SavedQuery } from '../..';

interface Props {
  savedQuery: SavedQuery;
  isSelected: boolean;
  showWriteOperations: boolean;
  onSelect: (savedQuery: SavedQuery) => void;
  onDelete: (savedQuery: SavedQuery) => void;
}

export const SavedQueryListItem = ({
  savedQuery,
  isSelected,
  onSelect,
  onDelete,
  showWriteOperations,
}: Props) => {
  const [showDeletionConfirmationModal, setShowDeletionConfirmationModal] = useState(false);

  const selectButtonAriaLabelText = isSelected
    ? 
    `Saved query button selected ${savedQuery.attributes.title}. Press to clear any changes.`
    : `Saved query button ${savedQuery.attributes.title}`;

  const selectButtonDataTestSubj = isSelected
    ? `load-saved-query-${savedQuery.attributes.title}-button saved-query-list-item-selected`
    : `load-saved-query-${savedQuery.attributes.title}-button`;

  const classes = classNames('kbnSavedQueryListItem', {
    'kbnSavedQueryListItem-selected': isSelected,
  });

  const label = (
    <span className="kbnSavedQueryListItem__label">
      <span className="kbnSavedQueryListItem__labelText">{savedQuery.attributes.title}</span>{' '}
      {savedQuery.attributes.description && (
        <EuiIconTip
          type="iInCircle"
          content={savedQuery.attributes.description}
          aria-label={ `${savedQuery.attributes.title} description`}
        />
      )}
    </span>
  );

  return (
    <Fragment>
      <EuiListGroupItem
        className={classes}
        key={savedQuery.id}
        data-test-subj={`saved-query-list-item ${selectButtonDataTestSubj} ${
          isSelected ? 'saved-query-list-item-selected' : ''
        }`}
        isActive={isSelected}
        onClick={() => {
          onSelect(savedQuery);
        }}
        aria-label={selectButtonAriaLabelText}
        label={label}
        iconType={isSelected ? 'check' : undefined}
        extraAction={
          showWriteOperations
            ? {
                color: 'danger',
                onClick: () => setShowDeletionConfirmationModal(true),
                iconType: 'trash',
                iconSize: 's',
                'aria-label': `Delete saved query ${savedQuery.attributes.title}`,
                title:  `Delete saved query ${savedQuery.attributes.title}`,
                'data-test-subj': `delete-saved-query-${savedQuery.attributes.title}-button`,
              }
            : undefined
        }
      />

      {showDeletionConfirmationModal && (
        <EuiOverlayMask>
          <EuiConfirmModal
            title={`Delete "${savedQuery.attributes.title}"?`}
            confirmButtonText={ 'Delete'}
            cancelButtonText={ 'Cancel'}
            onConfirm={() => {
              onDelete(savedQuery);
              setShowDeletionConfirmationModal(false);
            }}
            buttonColor="danger"
            onCancel={() => {
              setShowDeletionConfirmationModal(false);
            }}
          />
        </EuiOverlayMask>
      )}
    </Fragment>
  );
};
