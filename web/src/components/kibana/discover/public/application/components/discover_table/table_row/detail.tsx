import {EuiIcon} from '@elastic/eui';
import { DocViewer } from '../../doc_viewer/doc_viewer';

interface Props {
  columns: string[];
  indexPattern: any;
  row: any;
  onFilter: (field: any, values: any, operation: any) => void;
  onAddColumn?: (name: string) => void;
  onRemoveColumn?: (name: string) => void;
}

export function Detail({
  columns,
  indexPattern,
  row,
  onFilter,
  onAddColumn,
  onRemoveColumn,
}:Props){
  return (
    <td colSpan={ columns.length + 2 }>
  <div className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--directionRow euiFlexGroup--justifyContentSpaceBetween">
    <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
      <div className="euiFlexGroup euiFlexGroup--gutterSmall euiFlexGroup--directionRow">
        <div className="euiFlexItem euiFlexItem--flexGrowZero">
          <EuiIcon type="folderOpen" size="m" style={{marginTop: 5}}/>
        </div>
        <div className="euiFlexItem euiFlexItem--flexGrowZero">
          <h4
            data-test-subj="docTableRowDetailsTitle"
            className="euiTitle euiTitle--xsmall"
          >Expanded document</h4>
        </div>
      </div>
    </div>
    {/* <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
      <div className="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--directionRow">
        <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
          <a
            className="euiLink"
          >View surrounding documents</a>
        </div>
        <div className="euiFlexItem euiFlexItem--flexGrowZero euiText euiText--small">
          <a
            className="euiLink"
          >View single document</a>
        </div>
      </div>
    </div> */}
  </div>
  <div data-test-subj="docViewer">
    <DocViewer
      columns={columns}
      filter={onFilter}
      hit={row}
      indexPattern={indexPattern}
      onAddColumn={onAddColumn}
      onRemoveColumn={onRemoveColumn}   
    />
  </div>

</td>

  )
}