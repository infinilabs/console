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
import React from "react";
import { EuiToolTip } from "@elastic/eui";
import { SortOrder } from "./helpers";
import { EuiIcon } from "@elastic/eui";

interface Props {
  colLeftIdx: number; // idx of the column to the left, -1 if moving is not possible
  colRightIdx: number; // idx of the column to the right, -1 if moving is not possible
  displayName: string;
  isRemoveable: boolean;
  isSortable: boolean;
  name: string;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (name: string, idx: number) => void;
  onRemoveColumn?: (name: string) => void;
  sortOrder: SortOrder[];
}

function getSortIconType(className: string):string {
  if(className.includes('fa-sort-down')){
    return 'sortDown';
  }else if(className.includes('fa-sort-up')){
    return 'sortUp';
  }else if(className.includes('fa-sort')){
    return 'sortUp';
  }
  return ''
}

const sortDirectionToIcon: Record<string, string> = {
  desc: "fa fa-sort-down",
  asc: "fa fa-sort-up",
  "": "fa fa-sort",
};

export function TableHeaderColumn({
  colLeftIdx,
  colRightIdx,
  displayName,
  isRemoveable,
  isSortable,
  name,
  onChangeSortOrder,
  onMoveColumn,
  onRemoveColumn,
  sortOrder,
}: Props) {
  const [, sortDirection = ""] =
    sortOrder.find((sortPair) => name === sortPair[0]) || [];
  const currentSortWithoutColumn = sortOrder.filter((pair) => pair[0] !== name);
  const currentColumnSort = sortOrder.find((pair) => pair[0] === name);
  const currentColumnSortDirection =
    (currentColumnSort && currentColumnSort[1]) || "";

  const btnSortIcon = sortDirectionToIcon[sortDirection];
  const btnSortClassName =
    sortDirection !== ""
      ? btnSortIcon
      : `kbnDocTableHeader__sortChange ${btnSortIcon}`;

  const handleChangeSortOrder = () => {
    if (!onChangeSortOrder) return;

    // Cycle goes Unsorted -> Asc -> Desc -> Unsorted
    if (currentColumnSort === undefined) {
      onChangeSortOrder([...currentSortWithoutColumn, [name, "asc"]]);
    } else if (currentColumnSortDirection === "asc") {
      onChangeSortOrder([...currentSortWithoutColumn, [name, "desc"]]);
    } else if (
      currentColumnSortDirection === "desc" &&
      currentSortWithoutColumn.length === 0
    ) {
      // If we're at the end of the cycle and this is the only existing sort, we switch
      // back to ascending sort instead of removing it.
      onChangeSortOrder([[name, "asc"]]);
    } else {
      onChangeSortOrder(currentSortWithoutColumn);
    }
  };

  const getSortButtonAriaLabel = () => {
    const sortAscendingMessage = `Sort ${name} ascending`;
    const sortDescendingMessage = `Sort ${name} descending`;
    const stopSortingMessage = `Stop sorting on ${name}`;

    if (currentColumnSort === undefined) {
      return sortAscendingMessage;
    } else if (sortDirection === "asc") {
      return sortDescendingMessage;
    } else if (
      sortDirection === "desc" &&
      currentSortWithoutColumn.length === 0
    ) {
      return sortAscendingMessage;
    } else {
      return stopSortingMessage;
    }
  };

  // action buttons displayed on the right side of the column name
  const buttons = [
    // Sort Button
    {
      active: isSortable && typeof onChangeSortOrder === "function",
      ariaLabel: getSortButtonAriaLabel(),
      className: btnSortClassName,
      onClick: handleChangeSortOrder,
      testSubject: `docTableHeaderFieldSort_${name}`,
      tooltip: getSortButtonAriaLabel(),
      iconType: getSortIconType(btnSortClassName),
    },
    // Remove Button
    {
      active: isRemoveable && typeof onRemoveColumn === "function",
      ariaLabel: `Remove ${name} column`,
      className: "fa fa-remove kbnDocTableHeader__move",
      onClick: () => onRemoveColumn && onRemoveColumn(name),
      testSubject: `docTableRemoveHeader-${name}`,
      tooltip: "Remove Column",
      iconType: 'cross',
    },
    // Move Left Button
    {
      active: colLeftIdx >= 0 && typeof onMoveColumn === "function",
      ariaLabel: `Move ${name} column to the left`,
      className: "fa fa-angle-double-left kbnDocTableHeader__move",
      onClick: () => onMoveColumn && onMoveColumn(name, colLeftIdx),
      testSubject: `docTableMoveLeftHeader-${name}`,
      tooltip: `Move ${name} column to the left`,
      iconType: 'sortLeft',
    },
    // Move Right Button
    {
      active: colRightIdx >= 0 && typeof onMoveColumn === "function",
      ariaLabel: `Move ${name} column to the right`,
      className: "fa fa-angle-double-right kbnDocTableHeader__move",
      onClick: () => onMoveColumn && onMoveColumn(name, colRightIdx),
      testSubject: `docTableMoveRightHeader-${name}`,
      tooltip: `Move ${name} column to the right`,
      iconType: 'sortRight',
    },
  ];

  return (
    <th data-test-subj="docTableHeaderField">
      <span data-test-subj={`docTableHeader-${name}`}>
        {displayName}
        {buttons
          .filter((button) => button.active)
          .map((button, idx) => (
            <EuiToolTip
              id={`docTableHeader-${name}-tt`}
              content={button.tooltip}
              key={`button-${idx}`}
            >
              <button
                aria-label={button.ariaLabel}
                className={button.className}
                data-test-subj={button.testSubject}
                onClick={button.onClick}
              >
                {button.iconType ? <EuiIcon type={button.iconType} size="s" color="black" />:null}
              </button>
            </EuiToolTip>
          ))}
      </span>
    </th>
  );
}
