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

import React from 'react';
import { debounce, keyBy, sortBy, uniq } from 'lodash';
import {
  EuiTitle,
  EuiInMemoryTable,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiSpacer,
  EuiOverlayMask,
  EuiConfirmModal,
  EuiCallOut,
  EuiBasicTableColumn,
} from '@elastic/eui';
import { HttpFetchError, ToastsStart } from 'kibana/public';
import { toMountPoint } from '../util';

interface Column {
  name: string;
  width?: string;
  actions?: object[];
}

interface Item {
  id?: string;
}

export interface TableListViewProps {
  createItem?(): void;
  deleteItems?(items: object[]): Promise<void>;
  editItem?(item: object): void;
  entityName: string;
  entityNamePlural: string;
  findItems(query: string): Promise<{ total: number; hits: object[] }>;
  listingLimit: number;
  initialFilter: string;
  initialPageSize: number;
  noItemsFragment: JSX.Element;
  // update possible column types to something like (FieldDataColumn | ComputedColumn | ActionsColumn)[] when they have been added to EUI
  tableColumns: Column[];
  tableListTitle: string;
  toastNotifications: ToastsStart;
  /**
   * Id of the heading element describing the table. This id will be used as `aria-labelledby` of the wrapper element.
   * If the table is not empty, this component renders its own h1 element using the same id.
   */
  headingId?: string;
}

export interface TableListViewState {
  items: object[];
  hasInitialFetchReturned: boolean;
  isFetchingItems: boolean;
  isDeletingItems: boolean;
  showDeleteModal: boolean;
  showLimitError: boolean;
  fetchError?: HttpFetchError;
  filter: string;
  selectedIds: string[];
  totalItems: number;
}

// saved object client does not support sorting by title because title is only mapped as analyzed
// the legacy implementation got around this by pulling `listingLimit` items and doing client side sorting
// and not supporting server-side paging.
// This component does not try to tackle these problems (yet) and is just feature matching the legacy component
// TODO support server side sorting/paging once title and description are sortable on the server.
class TableListView extends React.Component<TableListViewProps, TableListViewState> {
  private pagination = {};
  private _isMounted = false;

  constructor(props: TableListViewProps) {
    super(props);

    this.pagination = {
      initialPageIndex: 0,
      initialPageSize: props.initialPageSize,
      pageSizeOptions: uniq([10, 20, 50, props.initialPageSize]).sort(),
    };
    this.state = {
      items: [],
      totalItems: 0,
      hasInitialFetchReturned: false,
      isFetchingItems: false,
      isDeletingItems: false,
      showDeleteModal: false,
      showLimitError: false,
      filter: props.initialFilter,
      selectedIds: [],
    };
  }

  UNSAFE_componentWillMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
    this.debouncedFetch.cancel();
  }

  componentDidMount() {
    this.fetchItems();
  }

  debouncedFetch = debounce(async (filter: string) => {
    try {
      const response = await this.props.findItems(filter);

      if (!this._isMounted) {
        return;
      }

      // We need this check to handle the case where search results come back in a different
      // order than they were sent out. Only load results for the most recent search.
      // Also, in case filter is empty, items are being pre-sorted alphabetically.
      if (filter === this.state.filter) {
        this.setState({
          hasInitialFetchReturned: true,
          isFetchingItems: false,
          items: !filter ? sortBy(response.hits, 'title') : response.hits,
          totalItems: response.total,
          showLimitError: response.total > this.props.listingLimit,
        });
      }
    } catch (fetchError) {
      this.setState({
        hasInitialFetchReturned: true,
        isFetchingItems: false,
        items: [],
        totalItems: 0,
        showLimitError: false,
        fetchError,
      });
    }
  }, 300);

  fetchItems = () => {
    this.setState(
      {
        isFetchingItems: true,
        fetchError: undefined,
      },
      this.debouncedFetch.bind(null, this.state.filter)
    );
  };

  deleteSelectedItems = async () => {
    if (this.state.isDeletingItems || !this.props.deleteItems) {
      return;
    }
    this.setState({
      isDeletingItems: true,
    });
    try {
      const itemsById = keyBy(this.state.items, 'id');
      await this.props.deleteItems(this.state.selectedIds.map((id) => itemsById[id]));
    } catch (error) {
      this.props.toastNotifications.addDanger({
        title: toMountPoint(
          `Unable to delete ${this.props.entityName}(s)`
        ),
        text: `${error}`,
      });
    }
    this.fetchItems();
    this.setState({
      isDeletingItems: false,
      selectedIds: [],
    });
    this.closeDeleteModal();
  };

  closeDeleteModal = () => {
    this.setState({ showDeleteModal: false });
  };

  openDeleteModal = () => {
    this.setState({ showDeleteModal: true });
  };

  setFilter({ queryText }: { queryText: string }) {
    // If the user is searching, we want to clear the sort order so that
    // results are ordered by Elasticsearch's relevance.
    this.setState(
      {
        filter: queryText,
      },
      this.fetchItems
    );
  }

  hasNoItems() {
    if (!this.state.isFetchingItems && this.state.items.length === 0 && !this.state.filter) {
      return true;
    }

    return false;
  }

  renderConfirmDeleteModal() {
    let deleteButton = (
      "Delete"
    );
    if (this.state.isDeletingItems) {
      deleteButton = (
        "Deleting"
      );
    }

    return (
      <EuiOverlayMask>
        <EuiConfirmModal
          title={
            `Delete ${this.state.selectedIds.length} ${ this.state.selectedIds.length === 1
              ? this.props.entityName
              : this.props.entityNamePlural}?`
          }
          buttonColor="danger"
          onCancel={this.closeDeleteModal}
          onConfirm={this.deleteSelectedItems}
          cancelButtonText={
            "Cancel"
          }
          confirmButtonText={deleteButton}
          defaultFocusedButton="cancel"
        >
          <p>
            You can't recover deleted {this.props.entityNamePlural}.
          </p>
        </EuiConfirmModal>
      </EuiOverlayMask>
    );
  }

  renderListingLimitWarning() {
    if (this.state.showLimitError) {
      return (
        <React.Fragment>
          <EuiCallOut
            title={
              "Listing limit exceeded"
            }
            color="warning"
            iconType="help"
          >
            <p>
              You have {this.state.totalItems} {this.props.entityNamePlural}, but your <strong>listingLimit</strong> setting prevents
                the table below from displaying more than {this.props.listingLimit}. You can change this setting under  <EuiLink href="#/management/kibana/settings">
                      Advanced Settings
                    </EuiLink>.
            </p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </React.Fragment>
      );
    }
  }

  renderFetchError() {
    if (this.state.fetchError) {
      return (
        <React.Fragment>
          <EuiCallOut
            title={
              "Fetching listing failed"
            }
            color="danger"
            iconType="alert"
          >
            <p>
              The {this.props.entityName} listing could not be fetched: {this.state.fetchError.body?.message || this.state.fetchError.message}.
            </p>
          </EuiCallOut>
          <EuiSpacer size="m" />
        </React.Fragment>
      );
    }
  }

  renderNoItemsMessage() {
    if (this.props.noItemsFragment) {
      return this.props.noItemsFragment;
    } else {
      return (
        `No ${this.props.entityNamePlural} available.`
      );
    }
  }

  renderToolsLeft() {
    const selection = this.state.selectedIds;

    if (selection.length === 0) {
      return;
    }

    const onClick = () => {
      this.openDeleteModal();
    };

    return (
      <EuiButton
        color="danger"
        iconType="trash"
        onClick={onClick}
        data-test-subj="deleteSelectedItems"
      >
        Delete {selection.length} {selection.length === 1 ? this.props.entityName : this.props.entityNamePlural}
      </EuiButton>
    );
  }

  renderTable() {
    const selection = this.props.deleteItems
      ? {
          onSelectionChange: (obj: Item[]) => {
            this.setState({
              selectedIds: obj
                .map((item) => item.id)
                .filter((id: undefined | string): id is string => Boolean(id)),
            });
          },
        }
      : undefined;

    const actions = [
      {
        name: 'Edit',
        description: 'Edit',
        icon: 'pencil',
        type: 'icon',
        enabled: ({ error }: { error: string }) => !error,
        onClick: this.props.editItem,
      },
    ];

    const search = {
      onChange: this.setFilter.bind(this),
      toolsLeft: this.renderToolsLeft(),
      defaultQuery: this.state.filter,
      box: {
        incremental: true,
      },
    };

    const columns = this.props.tableColumns.slice();
    if (this.props.editItem) {
      columns.push({
        name: 'Actions',
        width: '100px',
        actions,
      });
    }

    const noItemsMessage = (
      `No ${this.props.entityNamePlural} matched your search.`
    );
    return (
      <EuiInMemoryTable
        itemId="id"
        items={this.state.items}
        columns={(columns as unknown) as Array<EuiBasicTableColumn<object>>} // EuiBasicTableColumn is stricter than Column
        pagination={this.pagination}
        loading={this.state.isFetchingItems}
        message={noItemsMessage}
        selection={selection}
        search={search}
        sorting={true}
        data-test-subj="itemsInMemTable"
      />
    );
  }

  renderListingOrEmptyState() {
    if (!this.state.fetchError && this.hasNoItems()) {
      return this.renderNoItemsMessage();
    }

    return this.renderListing();
  }

  renderListing() {
    let createButton;
    if (this.props.createItem) {
      createButton = (
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={this.props.createItem}
            data-test-subj="newItemButton"
            iconType="plusInCircle"
            fill
          >
            Create {this.props.entityName }
          </EuiButton>
        </EuiFlexItem>
      );
    }
    return (
      <div>
        {this.state.showDeleteModal && this.renderConfirmDeleteModal()}

        <EuiFlexGroup justifyContent="spaceBetween" alignItems="flexEnd" data-test-subj="top-nav">
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <h1 id={this.props.headingId}>{this.props.tableListTitle}</h1>
            </EuiTitle>
          </EuiFlexItem>

          {createButton}
        </EuiFlexGroup>

        <EuiSpacer size="m" />

        {this.renderListingLimitWarning()}
        {this.renderFetchError()}

        {this.renderTable()}
      </div>
    );
  }

  renderPageContent() {
    if (!this.state.hasInitialFetchReturned) {
      return;
    }

    return (
      <EuiPageContent horizontalPosition="center">
        {this.renderListingOrEmptyState()}
      </EuiPageContent>
    );
  }

  render() {
    return (
      <EuiPage
        data-test-subj={this.props.entityName + 'LandingPage'}
        className="itemListing__page"
        restrictWidth
      >
        <EuiPageBody
          aria-labelledby={this.state.hasInitialFetchReturned ? this.props.headingId : undefined}
        >
          {this.renderPageContent()}
        </EuiPageBody>
      </EuiPage>
    );
  }
}

export { TableListView };

// eslint-disable-next-line import/no-default-export
export default TableListView;
