import { Open } from "./open";
import { Cell } from "./cell";
import { Detail } from "./detail";
import React, { useState } from "react";

const MemoDetail = React.memo(Detail);

interface Props {
  // sorting="sorting"
  onFilter: (field: any, values: any, operation: any) => void;
  columns: string[];
  hideTimeColumn: boolean;
  indexPattern: any;
  isShortDots: boolean;
  onAddColumn?: (name: string) => void;
  onRemoveColumn?: (name: string) => void;
  row: any;
  document: any;
  formatHit?: (name: string, hit: Record<string, any>) => Record<string, any>
  filterIconRender?: (children: any, params: { field: any, values: any, operation: any }) => any;
}

export function TableRow({
  onFilter,
  columns,
  hideTimeColumn,
  indexPattern,
  isShortDots,
  onAddColumn,
  onRemoveColumn,
  row,
  document,
  formatHit,
  filterIconRender
}: Props) {
  const mapping = indexPattern.fields.getByName;
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="kbnDocTable__row">
        <Open
          open={open}
          onClick={() => {
            setOpen(!open);
          }}
        />
        {indexPattern.timeFieldName && !hideTimeColumn ? (
          <Cell
            timefield={true}
            row={row}
            indexPattern={indexPattern}
            inlineFilter={onFilter}
            formatted={_displayField(
              indexPattern,
              row,
              indexPattern.timeFieldName
            )}
            filterable={!!onFilter && mapping(indexPattern.timeFieldName).filterable} //&& $scope.filter
            column={indexPattern.timeFieldName}
            filterIconRender={filterIconRender}
          />
        ) : null}

        {columns.map(function(column: any) {
          const isFilterable = !!onFilter && mapping(column) && mapping(column).filterable; //&& $scope.filter;
          return (
            <Cell
              key={"discover-cell-" + column}
              timefield={false}
              row={row}
              inlineFilter={onFilter}
              indexPattern={indexPattern}
              sourcefield={column === "_source"}
              formatted={_displayField(indexPattern, row, column, true, formatHit)}
              filterable={isFilterable} //&& $scope.filter
              column={column}
              filterIconRender={filterIconRender}
            />
          );
        })}
      </tr>

      {open && (
        <tr className="kbnDocTableDetails__row">
          <MemoDetail
            columns={columns}
            indexPattern={indexPattern}
            row={row}
            document={document}
            onFilter={onFilter}
            onAddColumn={onAddColumn}
            onRemoveColumn={onRemoveColumn}
            filterIconRender={filterIconRender}
          />
        </tr>
      )}
    </>
  );
}

const MIN_LINE_LENGTH = 20;

function _displayField(
  indexPattern: any,
  row: any,
  fieldName: string,
  truncate = false,
  formatHit?: (name: string, hit: Record<string, any>) => Record<string, any>
) {
  let text = indexPattern.formatField(row, fieldName, formatHit);

  if (truncate && text.length > MIN_LINE_LENGTH) {
    return (
      <div
        className="truncate-by-height"
        dangerouslySetInnerHTML={{ __html: text }}
      ></div>
    );
  }

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
}
