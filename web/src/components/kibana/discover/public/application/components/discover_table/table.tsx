import { EuiIcon } from "@elastic/eui";
import { TableHeader } from "./table_header/table_header";
import { SortOrder } from "./table_header/helpers";
import './_doc_table.scss';
import {TableRow} from './table_row/table_row';
import { useState, useEffect} from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

interface TableProps {
  columns: string[];
  hits: any[];
  sortOrder?: SortOrder[];
  indexPattern: any;
  onFilter: (field: any, values: any, operation: any) => void;
  onChangeSortOrder?: (sortOrder: SortOrder[]) => void;
  onMoveColumn?: (name: string, index: number) => void;
  onRemoveColumn?: (name: string) => void;
}

const pageCount = 50;

const Table: React.FC<TableProps> = ({ columns, hits, sortOrder, indexPattern, onFilter, onMoveColumn, 
  onRemoveColumn, onChangeSortOrder }) => {
  const [scrollState, setScrollState] = useState({limit: pageCount, hasMore: true});
  useEffect(()=>{
    setScrollState({
      limit: pageCount, 
      hasMore: hits.length > pageCount,
    })
  },[indexPattern, hits])
  
  return (
    <InfiniteScroll
      dataLength={scrollState.limit}
      next={()=>{
        const newLimit = scrollState.limit + pageCount;
        setScrollState({limit: newLimit, hasMore: newLimit < hits.length});
      }}
      hasMore={scrollState.hasMore}
      loader={<h4 style={{textAlign: 'center', margin: '10px auto'}}>Loading...</h4>}
      endMessage={
        <p style={{ textAlign: 'center' }}>
          {/* <b>no more data</b> */}
        </p>
      }>
      <div>
        {hits.length ? (
          <div>
            <table className="kbn-table table" data-test-subj="docTable">
              <thead>
              <TableHeader  columns={columns}
                defaultSortOrder={''}
                hideTimeColumn={false}
                indexPattern={indexPattern}
                isShortDots={false}
                onChangeSortOrder={onChangeSortOrder}
                onMoveColumn={onMoveColumn}
                onRemoveColumn={onRemoveColumn}
                sortOrder={sortOrder||[]}/>
              </thead>
              <tbody>
                {hits.slice(0, scrollState.limit).map((row, idx)=>{
                  
                  return <TableRow key={'discover-table-row'+idx} onFilter={onFilter}
                  columns={columns}
                  hideTimeColumn={false}
                  indexPattern={indexPattern}
                  isShortDots={false}
                  onAddColumn={()=>{}}
                  onRemoveColumn={()=>{}}
                  row={row}
                  />
                })}
              </tbody>
            </table>
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

export default Table;
