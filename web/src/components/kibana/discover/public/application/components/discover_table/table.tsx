import { EuiIcon } from "@elastic/eui";
import { TableHeader } from "./table_header/table_header";
import { SortOrder } from "./table_header/helpers";
import "./_doc_table.scss";
import { TableRow } from "./table_row/table_row";
import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import TableContext from "./table_context";

interface TableProps {
  columns: string[];
  hits: any[];
  sortOrder?: SortOrder[];
  indexPattern: any;
  onFilter: (field: any, values: any, operation: any) => void;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (name: string, index: number) => void;
  onRemoveColumn?: (name: string) => void;
  onAddColumn?: (name: string) => void;
  document: any;
}

const pageCount = 50;

const Table: React.FC<TableProps> = ({
  columns,
  hits,
  sortOrder,
  indexPattern,
  onFilter,
  onMoveColumn,
  onAddColumn,
  onRemoveColumn,
  onChangeSortOrder,
  document,
}) => {
  const [scrollState, setScrollState] = useState({
    limit: pageCount,
    hasMore: true,
  });
  useEffect(() => {
    setScrollState({
      limit: pageCount,
      hasMore: hits.length > pageCount,
    });
  }, [indexPattern, hits]);
  const tableRef = React.useRef(null);

  return (
    <InfiniteScroll
      dataLength={scrollState.limit}
      next={() => {
        const newLimit = scrollState.limit + pageCount;
        setScrollState({ limit: newLimit, hasMore: newLimit < hits.length });
      }}
      hasMore={scrollState.hasMore}
      loader={
        <h4 style={{ textAlign: "center", margin: "10px auto" }}>Loading...</h4>
      }
      endMessage={
        <p style={{ textAlign: "center" }}>{/* <b>no more data</b> */}</p>
      }
    >
      <div ref={tableRef}>
        {hits.length ? (
          <div>
            <TableContext.Provider value={{ tableRef: tableRef.current }}>
              <table className="kbn-table table">
                <thead>
                  <TableHeader
                    columns={columns}
                    defaultSortOrder={"desc"}
                    hideTimeColumn={false}
                    indexPattern={indexPattern}
                    isShortDots={false}
                    onChangeSortOrder={onChangeSortOrder}
                    onMoveColumn={onMoveColumn}
                    onRemoveColumn={onRemoveColumn}
                    sortOrder={sortOrder || []}
                  />
                </thead>
                <tbody>
                  {hits.slice(0, scrollState.limit).map((row, idx) => {
                    return (
                      <TableRow
                        key={"discover-table-row" + row._id}
                        onFilter={onFilter}
                        columns={columns}
                        hideTimeColumn={false}
                        indexPattern={indexPattern}
                        isShortDots={false}
                        onAddColumn={onAddColumn}
                        onRemoveColumn={onRemoveColumn}
                        row={row}
                        document={document}
                      />
                    );
                  })}
                </tbody>
              </table>
            </TableContext.Provider>
          </div>
        ) : null}

        {hits != null && !hits.length ? (
          <div className="kbnDocTable__error">
            <div className="euiText euiText--extraSmall euiTextColor euiTextColor--subdued">
              <EuiIcon type="visualizeApp" size="m" color="subdued" />
              <div className="euiSpacer euiSpacer--m"></div>
              <p>No results found</p>
            </div>
          </div>
        ) : null}
      </div>
    </InfiniteScroll>
  );
};

export default React.memo(Table);
