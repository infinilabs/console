import { useMemo } from "react";
import { EuiIcon } from "@elastic/eui";

interface Props{
  timefield: boolean;
  sourcefield?: boolean;
  formatted: any;
  filterable: boolean;
  inlineFilter: (field: any, values: any, operation: any) => void;
  column: string;
  row: any;
  indexPattern: any;
  filterIconRender?: (children: any, params: { field: any, values: any, operation: any }) => any;
}

export function Cell({
  timefield,
  sourcefield,
  formatted,
  filterable,
  inlineFilter,
  column,
  row,
  indexPattern,
  filterIconRender
}:Props){

  const renderFilterIcon = (children: any, operation: any) => {
    if (filterIconRender) {
      const flattened = indexPattern.flattenHit(row);
      if (flattened) {
        inlineFilter(column, flattened[column], operation);
        return filterIconRender(children, { field: column, values: flattened[column], operation})
      }
      return children;
    } else {
      return children
    }
  }

  const attributes = useMemo(() => {
    let attributes = {};
    if (timefield) {
      attributes = {
        className: "eui-textNoWrap",
        width: "1%",
      };
    } else if (sourcefield) {
      attributes = {
        className: "eui-textBreakAll eui-textBreakWord",
      };
    } else {
      attributes = {
        className:
          "kbnDocTableCell__dataField eui-textBreakAll eui-textBreakWord",
      };
    }
    return attributes;
  }, [timefield, sourcefield]);

  return (
    <td {...attributes} data-test-subj="docTableField">
      {formatted}
      <span className="kbnDocTableCell__filter">
        {filterable ? (
          <>
            {renderFilterIcon((
              <button
                onClick={() => {
                  const flattened = indexPattern.flattenHit(row);
                  if (flattened) {
                    inlineFilter(column, flattened[column], '+');
                  }
                }}
                className="kbnDocTableRowFilterButton"
                data-column={column}
                tooltip-append-to-body="1"
                data-test-subj="docTableCellFilter"
                // tooltip="Filter for value"
                tooltip-placement="bottom"
                aria-label="Filter for value"
              >
                <EuiIcon type="plusInCircle" size="s" color="primary"></EuiIcon>
              </button>
            ), '+')}
            {
              renderFilterIcon((
                <button
                  onClick={() => {
                    const flattened = indexPattern.flattenHit(row);
                    if (flattened) {
                      inlineFilter(column, flattened[column], '-');
                    }
                  }}
                  className="kbnDocTableRowFilterButton"
                  data-column="<%- column %>"
                  data-test-subj="docTableCellFilterNegate"
                  // tooltip="Filter out value"
                  aria-label="Filter out value"
                  tooltip-append-to-body="1"
                  tooltip-placement="bottom"
                >
                  <EuiIcon type="minusInCircle" size="s" color="primary" />
                </button>
              ), '-' )
            }
          </>
        ):null}
      </span>
    </td>
  );
};
