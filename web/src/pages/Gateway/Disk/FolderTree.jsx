import React,{useMemo} from 'react';
import { Tree } from 'antd';
import { FolderFilled, FileFilled } from '@ant-design/icons';

const { TreeNode } = Tree;

const FolderTree = ({ loading,folders,selectedKeys, onFolderSelect, }) => {

  const renderTreeNodes = (data) => {
    const sortedData = data.sort((a, b) => {
      // 先按类型排序（文件夹在前，文件在后），再按名称排序
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return b.type - a.type;
    });

    return sortedData.map((folder) => (
      <TreeNode title={folder.name} key={folder.name} dataRef={folder} icon={folder.type === 1 ? <FolderFilled style={{ color: '#1890ff' }} /> : <FileFilled style={{ color: '#52c41a' }} />}>
        {folder.children && folder.children.length > 0 && renderTreeNodes(folder.children)}
      </TreeNode>
    ));
  };

  // 使用 useMemo 缓存计算结果
  const memoizedTreeData = useMemo(() => {
    return renderTreeNodes(folders);
  }, [folders]);

  return (
    <Tree loading={loading} defaultSelectedKeys={selectedKeys} onSelect={onFolderSelect} selectedKeys={selectedKeys} expandedKeys={selectedKeys} selectable showIcon defaultExpandAll>
      {memoizedTreeData}
    </Tree>
  );
};

export default FolderTree;