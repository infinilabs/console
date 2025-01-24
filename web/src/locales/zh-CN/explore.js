export default {
  "explore.no_results.description": "没有找到数据。",
  "explore.no_results.timefield.message.title": "查询条件是否正确？",
  "explore.no_results.timefield.message.description":
    "您的查询条件没有匹配任何数据，试着修改查询或者更改时间范围。",
  "explore.no_results.timefield.message.description.or_use":
    "或者：",
  "explore.no_results.timerange.tips":
    "自动适配时间范围",

  "explore.view.btn.create": "创建视图",
  "explore.index.btn.create": "创建索引",
  "explore.no_view.title": "没有视图",
  "explore.no_view.description": "当前集群找不到任何数据视图",
  "explore.no_index.title": "没有索引",
  "explore.no_index.description": "当前集群找不到任何数据索引",
  "explore.datatype.view": "视图",
  "explore.datatype.index": "索引",
  "explore.datatype.index.include_special_index": "包含特殊索引",
  "explore.createview.title": "创建视图",
  "explore.createview.description":
    "一个数据视图可以匹配单个索引, 比如, server-log-1, 或者 多个 索引, server-log-*。",
  "explore.createview.step_view.title": "步骤 1 / 2: 定义数据视图",
  "explore.createview.field.name": "视图名称",
  "explore.createview.field.name.help": "名称不能为空",
  "explore.createview.field.match_rule": "匹配规则",
  "explore.createview.field.match_rule.help":
    '使用 (*) 来匹配多个索引。 不能包含空格或者字符 , /, ?, ", <, >, |.',
    "explore.createview.field.builtin": "是否内置",
    "explore.createview.field.builtin.true": "是",
    "explore.createview.field.builtin.false": "否",
  "explore.createview.status.match_index_num": "当前匹配到 {length} 个索引",
  "explore.createview.status.match_special_index":
    "当前规则没有匹配到任何索引。如需匹配特殊索引，请打开包含特殊索引开关。",
  "explore.createview.status.no_match_index":
    "当前匹配不到 Elasticsearch 索引。",
  "explore.createview.status.no_match_but":
    " 当前没有匹配任何索引， 您可以匹配以下其他 {length} 个索引。",
  "explore.table.rows_of_page": "每页行数",
  "explore.table.rows_of_page_option": "行",
  "explore.createview.step_config.title": "步骤 2 / 2: 配置",
  "explore.createview.step_config.description":
    "为数据视图 {pattern} 指定配置。",
  "explore.createview.step_config.select_timestamp":
    "请选择一个时间字段用于创建时序相关的数据视图。",
  "explore.createview.field.timestamp": "时间字段",
  "explore.createview.btn.refresh": "刷新",
  "explore.viewlist.description":
    "创建和管理数据视图可以更加方便的批量操作数据。",
  "explore.viewlist.title": "数据视图",
  "explore.indexfield.description":
    "当前页面列出匹配 {pattern} 索引的所有字段，字段类型为搜索引擎内的类型。 若需要更改类型，请使用",
  "explore.view.index_pattern.removeTooltip": "删除视图",
};
