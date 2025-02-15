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

import {
  EuiPopover,
  EuiPopoverTitle,
  EuiPopoverFooter,
  EuiButtonEmpty,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiListGroup,
  EuiPagination,
  EuiText,
  EuiSpacer,
  EuiIcon,
} from '@elastic/eui';

import React, { useCallback, useEffect, useState, Fragment, useRef } from 'react';
import { sortBy } from 'lodash';
import { SavedQuery, SavedQueryService } from '../..';
import { SavedQueryListItem } from './saved_query_list_item';

const perPage = 50;
interface Props {
  showSaveQuery?: boolean;
  loadedSavedQuery?: SavedQuery;
  savedQueryService: SavedQueryService;
  onSave: () => void;
  onSaveAsNew: () => void;
  onLoad: (savedQuery: SavedQuery) => void;
  onClearSavedQuery: () => void;
}

export function SavedQueryManagementComponent({
  showSaveQuery,
  loadedSavedQuery,
  onSave,
  onSaveAsNew,
  onLoad,
  onClearSavedQuery,
  savedQueryService,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [savedQueries, setSavedQueries] = useState([] as SavedQuery[]);
  const [count, setTotalCount] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const cancelPendingListingRequest = useRef<() => void>(() => {});

  useEffect(() => {
    const fetchCountAndSavedQueries = async () => {
      cancelPendingListingRequest.current();
      let requestGotCancelled = false;
      cancelPendingListingRequest.current = () => {
        requestGotCancelled = true;
      };

      const {
        total: savedQueryCount,
        queries: savedQueryItems,
      } = await savedQueryService.findSavedQueries('', perPage, activePage + 1);

      if (requestGotCancelled) return;

      const sortedSavedQueryItems = sortBy(savedQueryItems, 'attributes.title');
      setTotalCount(savedQueryCount);
      setSavedQueries(sortedSavedQueryItems);
    };
    if (isOpen) {
      fetchCountAndSavedQueries();
    }
  }, [isOpen, activePage, savedQueryService]);

  const handleTogglePopover = useCallback(() => setIsOpen((currentState) => !currentState), [
    setIsOpen,
  ]);

  const handleClosePopover = useCallback(() => setIsOpen(false), []);

  const handleSave = useCallback(() => {
    handleClosePopover();
    onSave();
  }, [handleClosePopover, onSave]);

  const handleSaveAsNew = useCallback(() => {
    handleClosePopover();
    onSaveAsNew();
  }, [handleClosePopover, onSaveAsNew]);

  const handleSelect = useCallback(
    (savedQueryToSelect) => {
      handleClosePopover();
      onLoad(savedQueryToSelect);
    },
    [handleClosePopover, onLoad]
  );

  const handleDelete = useCallback(
    (savedQueryToDelete: SavedQuery) => {
      const onDeleteSavedQuery = async (savedQuery: SavedQuery) => {
        cancelPendingListingRequest.current();
        setSavedQueries(
          savedQueries.filter((currentSavedQuery) => currentSavedQuery.id !== savedQuery.id)
        );

        if (loadedSavedQuery && loadedSavedQuery.id === savedQuery.id) {
          onClearSavedQuery();
        }

        await savedQueryService.deleteSavedQuery(savedQuery.id);
        setActivePage(0);
      };

      onDeleteSavedQuery(savedQueryToDelete);
      handleClosePopover();
    },
    [handleClosePopover, loadedSavedQuery, onClearSavedQuery, savedQueries, savedQueryService]
  );

  const savedQueryDescriptionText = 'Save query text and filters that you want to use again.';

  const noSavedQueriesDescriptionText = 'There are no saved queries.' +
    ' ' +
    savedQueryDescriptionText;

  const savedQueryPopoverTitleText =  'Saved Queries';

  const goToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
  };

  const savedQueryPopoverButton = (
    <EuiButtonEmpty
      onClick={handleTogglePopover}
      aria-label={'See saved queries'}
      title={ 'See saved queries'}
      data-test-subj="saved-query-management-popover-button"
    >
      <EuiIcon type="save" className="euiQuickSelectPopover__buttonText" />
      <EuiIcon type="arrowDown" />
    </EuiButtonEmpty>
  );

  const savedQueryRows = () => {
    const savedQueriesWithoutCurrent = savedQueries.filter((savedQuery) => {
      if (!loadedSavedQuery) return true;
      return savedQuery.id !== loadedSavedQuery.id;
    });
    const savedQueriesReordered =
      loadedSavedQuery && savedQueriesWithoutCurrent.length !== savedQueries.length
        ? [loadedSavedQuery, ...savedQueriesWithoutCurrent]
        : [...savedQueriesWithoutCurrent];
    return savedQueriesReordered.map((savedQuery) => (
      <SavedQueryListItem
        key={savedQuery.id}
        savedQuery={savedQuery}
        isSelected={!!loadedSavedQuery && loadedSavedQuery.id === savedQuery.id}
        onSelect={handleSelect}
        onDelete={handleDelete}
        showWriteOperations={!!showSaveQuery}
      />
    ));
  };

  return (
    <Fragment>
      <EuiPopover
        id="savedQueryPopover"
        button={savedQueryPopoverButton}
        isOpen={isOpen}
        closePopover={handleClosePopover}
        anchorPosition="downLeft"
        panelPaddingSize="none"
        buffer={-8}
        ownFocus
        repositionOnScroll
      >
        <div
          className="kbnSavedQueryManagement__popover"
          data-test-subj="saved-query-management-popover"
        >
          <EuiPopoverTitle id={'savedQueryManagementPopoverTitle'}>
            {savedQueryPopoverTitleText}
          </EuiPopoverTitle>
          {savedQueries.length > 0 ? (
            <Fragment>
              <EuiText size="s" color="subdued" className="kbnSavedQueryManagement__text">
                <p>{savedQueryDescriptionText}</p>
              </EuiText>
              <div className="kbnSavedQueryManagement__listWrapper">
                <EuiListGroup
                  flush={true}
                  className="kbnSavedQueryManagement__list"
                  aria-labelledby={'savedQueryManagementPopoverTitle'}
                >
                  {savedQueryRows()}
                </EuiListGroup>
              </div>
              <EuiPagination
                className="kbnSavedQueryManagement__pagination"
                pageCount={Math.ceil(count / perPage)}
                activePage={activePage}
                onPageClick={goToPage}
              />
            </Fragment>
          ) : (
            <Fragment>
              <EuiText size="s" color="subdued" className="kbnSavedQueryManagement__text">
                <p>{noSavedQueriesDescriptionText}</p>
              </EuiText>
              <EuiSpacer size="s" />
            </Fragment>
          )}
          <EuiPopoverFooter>
            <EuiFlexGroup
              direction="rowReverse"
              gutterSize="s"
              alignItems="center"
              justifyContent="flexEnd"
              responsive={false}
              wrap={true}
            >
              {showSaveQuery && loadedSavedQuery && (
                <Fragment>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      fill
                      onClick={handleSave}
                      aria-label={`Save changes to ${loadedSavedQuery.attributes.title}`}
                      data-test-subj="saved-query-management-save-changes-button"
                    >
                      {'Save changes'}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      size="s"
                      onClick={handleSaveAsNew}
                      aria-label={'Save as new saved query'}
                      data-test-subj="saved-query-management-save-as-new-button"
                    >
                      { 'Save as new'}
                    </EuiButton>
                  </EuiFlexItem>
                </Fragment>
              )}
              {showSaveQuery && !loadedSavedQuery && (
                <EuiFlexItem grow={false}>
                  <EuiButton
                    size="s"
                    fill
                    onClick={handleSave}
                    aria-label={ 'Save a new saved query' }
                    data-test-subj="saved-query-management-save-button"
                  >
                    {'Save current query'}
                  </EuiButton>
                </EuiFlexItem>
              )}
              <EuiFlexItem />
              <EuiFlexItem grow={false}>
                {loadedSavedQuery && (
                  <EuiButtonEmpty
                    size="s"
                    flush="left"
                    onClick={onClearSavedQuery}
                    aria-label={'Clear current saved query'}
                    data-test-subj="saved-query-management-clear-button"
                  >
                    {'Clear'}
                  </EuiButtonEmpty>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopoverFooter>
        </div>
      </EuiPopover>
    </Fragment>
  );
}
