import {Open} from './open';
import {Cell} from './cell';
import {Detail} from './detail';
import {useState} from 'react';

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
}:Props){
  const mapping = indexPattern.fields.getByName;
  const [open,setOpen] = useState(false);
  return (
    <>
    <tr
      className="kbnDocTable__row"
    >
      <Open open={open} onClick={()=>{
        setOpen(!open);
      }}/>
      {(indexPattern.timeFieldName && !hideTimeColumn)? <Cell timefield={true}
              row={row}
              indexPattern={indexPattern}
              inlineFilter={onFilter}
              formatted={_displayField(indexPattern, row, indexPattern.timeFieldName)}
              filterable={mapping(indexPattern.timeFieldName).filterable}  //&& $scope.filter
              column= {indexPattern.timeFieldName}/>: null}

      {columns.map(function (column: any) {
          const isFilterable = mapping(column) && mapping(column).filterable ;//&& $scope.filter;
          return <Cell key={'discover-cell-'+column} timefield={false}
          row={row}
          inlineFilter={onFilter}
          indexPattern={indexPattern}
          sourcefield={column === '_source'}
          formatted={_displayField(indexPattern, row, column, true)}
          filterable={isFilterable}  //&& $scope.filter
          column= {column}/>
        })}
    </tr>
    
    {open? <tr className="kbnDocTableDetails__row">
      <Detail columns={columns}
        indexPattern={indexPattern}
        row={row}
        onFilter={onFilter}
        onAddColumn={onAddColumn}
        onRemoveColumn={onRemoveColumn}/>
    </tr>:null
    }
    </>
  )
}

const MIN_LINE_LENGTH = 20;

function _displayField(indexPattern:any, row: any, fieldName: string, truncate = false) {
  const text = indexPattern.formatField(row, fieldName);

  if (truncate && text.length > MIN_LINE_LENGTH) {
    return <div className="truncate-by-height" dangerouslySetInnerHTML={{ __html: text }} >
    </div>
  }

  return  <span dangerouslySetInnerHTML={{ __html: text }} />;
}