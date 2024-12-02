import { EuiIcon } from "@elastic/eui";
import { TableHeader } from "./table_header/table_header";
import { SortOrder } from "./table_header/helpers";
import "./_doc_table.scss";
import { TableRow } from "./table_row/table_row";
import React, { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import TableContext from "./table_context";
import { Loading } from "@/components/vendor/discover/public/application/components/loading_spinner/loading_spinner";

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
  hitsTotal: number;
  queryFrom:any;
  setQueryFrom:any;
  formatDisplayName?: (name: string) => string;
  formatHit?: (name: string, hit: Record<string, any>) => Record<string, any>
  pageSize?: number;
  scrollableTarget?: string;
  scrollThreshold?: number;
  hasMore?: boolean;
  filterIconRender?: (children: any, params: { field: any, values: any, operation: any }) => any;
}

const pageCount = 20;

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
  hitsTotal,
  queryFrom,
  setQueryFrom,
  formatDisplayName,
  formatHit,
  pageSize = pageCount,
  scrollableTarget,
  scrollThreshold,
  hasMore = true,
  filterIconRender
}) => {
 
  const tableRef = React.useRef(null);

  return (
    <InfiniteScroll
      dataLength={hits.length}
      next={() => {
        setQueryFrom(queryFrom + pageSize);
      }}
      hasMore={hasMore && hits.length < hitsTotal}
      loader={
        <h4 style={{ textAlign: "center", margin: "10px auto" }}><Loading label="Loading..." /></h4>
      }
      endMessage={null}
      scrollableTarget={scrollableTarget}
      scrollThreshold={scrollThreshold}
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
                    formatDisplayName={formatDisplayName}
                  />
                </thead>
                <tbody>
                  {hits.map((row, idx) => {
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
                        formatHit={formatHit}
                        filterIconRender={filterIconRender}
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
