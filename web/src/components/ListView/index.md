## Props

### ListView

| Property             | Description                                                 | Type                    | Default              | Version |
| -------------------- | ----------------------------------------------------------- | ----------------------- | -------------------- | ------- |
| ref                  | 父子组件上下文 ref 对象                                     | object                  | -                    | 1.0.0   |
| viewLayout           | 列表显示模式： table(表格)、card(卡片)、timeline(时间线)等  | string                  | 'table'              | 1.0.0   |
| viewLayoutItemRender | 列表项渲染回调方法，当 viewLayout="table"时可忽略该回调方法 | Function(record)        | null                 | 1.0.0   |
| clusterID            | 集群 ID                                                     | string                  | -                    | 1.0.0   |
| collectionName       | 集合对象名，后端映射具体索引名                              | string                  | -                    | 1.0.0   |
| timeField            | 时间字段，用于 dateTime 和 histogram 组件                   | string                  | 'timestamp'          | 1.0.0   |
| columns              | 表格列的配置描述，具体项见下表                              | array[]                 | -                    | 1.0.0   |
| formatDataSource     | 格式化数据数组方法                                          | Function(dataSource)    | null                 | 1.0.0   |
| queryFilter          | query DSL 过滤条件                                          | object                  | null                 | 1.0.0   |
| defaultQueryParams   | 默认查询参数，具体项见下表                                  | object                  | {"from":0,"size":10} | 1.0.0   |
| dateTimeEnable       | 是否启用时间选择组件                                        | boolean                 | false                | 1.0.0   |
| isRefreshPaused      | 是否暂停时间选择组件内的自动刷新功能                        | boolean                 | true                 | 1.0.0   |
| sortEnable           | 是否启用排序组件                                            | boolean                 | true                 | 1.0.0   |
| sideEnable           | 是否启用侧边栏聚合过滤组件                                  | boolean                 | false                | 1.0.0   |
| sideVisible          | 是否显示/隐藏侧边栏                                         | boolean                 | false                | 1.0.0   |
| sidePlacement        | 侧边栏摆放位置,可选 left right                              | string                  | 'left'               | 1.0.0   |
| histogramEnable      | 是否启用直方图组件                                          | boolean                 | false                | 1.0.0   |
| histogramVisible     | 是否显示/隐藏直方图                                         | boolean                 | false                | 1.0.0   |
| histogramComponent   | 直方图组件参数配置                                          | object                  | -                    | 1.0.0   |
| headerToobarExtra    | 列表右上角工具栏扩展                                        | object                  | -                    | 1.0.0   |
| rowSelectionExtra    | 批量多选操作扩展                                            | object                  | -                    | 1.0.0   |
| onRow                | 设置行属性                                                  | Function(record, index) | -                    | 1.0.0   |
| showEmptyUI          | 是否展示列表数据为空时的向导 UI                             | boolean                 | false                | 1.0.0   |
| setShowEmptyUI       | 回调函数                                                    | Function(boolean)       | -                    | 1.0.0   |

#### columns

列描述数据对象，是 columns 中的一项，Column 使用相同的 API。
| Property | Description | Type | Default | 1.0.0 |
| -------- | ----------- | ---- | ------- | ------- |
| title | 字段名称 | string | - | 1.0.0 |
| key | 字段名称，对应 antd table 组件中的 dataIndex，唯一键 | string | - | 1.0.0 |
| visible | 是否显示 | boolean | true | 1.0.0 |
| aggregable | 是否可聚合 | boolean | false | 1.0.0 |
| sortable | 是否可排序 | boolean | false | 1.0.0 |
| searchable | 是否可被搜索 | boolean | false | 1.0.0 |
| render | 自定义渲染，参数分别为当前行的值，当前行数据，行索引，对应 antd table 中的 render | Function(text, record, index) {} | - | 1.0.0 |

更多配置项参考：<https://3x.ant.design/components/table-cn/#Column>

#### onRow 用法

设置行属性（适用于 ListView 组件内 Table 组件）

```jsx
<ListView
  onRow={(record) => {
    return {
      onClick: (event) => {}, // 点击行
      onDoubleClick: (event) => {},
      onContextMenu: (event) => {},
      onMouseEnter: (event) => {}, // 鼠标移入行
      onMouseLeave: (event) => {},
    };
  }}
/>
```

更多配置项参考：<https://3x.ant.design/components/table-cn/#onRow-%E7%94%A8%E6%B3%95>

#### defaultQueryParams

默认查询参数
| Property | Description | Type | Default | 1.0.0 |
| -------- | ----------- | ---- | ------- | ------- |
| from | 翻页参数 from | number | 0 | 1.0.0 |
| size | 每页 size 条数 | number | 10 | 1.0.0 |
| timeRange | 时间范围 | object | - | 1.0.0 |
| timeRange.from | 开始时间 | string|number | "now-7d" | 1.0.0 |
| timeRange.from | 截止时间 | string|number | "now" | 1.0.0 |
| timeRange.timeField | 时间字段 | string | "timestamp" | 1.0.0 |

#### headerToobarExtra

列表右上角工具栏扩展

#### rowSelectionExtra

批量多选操作扩展
