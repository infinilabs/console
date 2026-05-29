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
  "explore.view.index_pattern.refreshTooltip": "刷新字段列表",
  "explore.view.index_pattern.refreshFieldListTitle": "刷新字段列表？",
  "explore.view.index_pattern.back_to_list": "返回视图列表",
  "explore.view.index_pattern.detail_title": "视图详情",
  "explore.view.index_pattern.delete_confirm": "删除视图？",
  "explore.view.index_pattern.time_field": "时间字段：'{field}'",
  "explore.view.index_pattern.mapping_conflict_title": "Mapping 冲突",
  "explore.view.index_pattern.mapping_conflict_desc":
    "当前视图匹配的索引中有 {count} 个字段存在多种类型定义，例如 string、integer 等。您仍可查看这些冲突字段，但无法把它们用于函数计算；如需消除冲突，请重新整理索引映射。",
  "explore.view.index_pattern.tab.fields": "字段",
  "explore.view.index_pattern.tab.scripted_fields": "脚本字段",
  "explore.view.index_pattern.tab.source_filters": "源过滤器",
  "explore.view.index_pattern.tab.complex_fields": "复杂字段 ({count})",
  "explore.view.index_pattern.search_fields": "搜索字段",
  "explore.view.index_pattern.filter_field_types": "筛选字段类型",
  "explore.view.index_pattern.search_placeholder": "搜索",
  "explore.view.index_pattern.create_field": "创建字段",
  "explore.view.index_pattern.all_field_types": "全部字段类型",
  "explore.view.index_pattern.all_languages": "全部语言",
  "explore.view.index_pattern.field_editor.default_option": "- 默认 -",
  "explore.view.index_pattern.field_editor.default_label": "默认",
  "explore.view.index_pattern.field_editor.format": "格式",
  "explore.view.index_pattern.field_editor.format_help":
    "格式化允许您控制特定值的显示方式。它也可能完全改变值的显示结果，并导致 Discover 中的高亮失效。",
  "explore.view.index_pattern.field_editor.save_field": "保存字段",
  "explore.view.index_pattern.field_editor.statistics": "统计项",
  "explore.view.index_pattern.field_editor.field": "字段",
  "explore.view.index_pattern.field_editor.group_field": "分组字段",
  "explore.view.index_pattern.field_editor.dividend_field": "被除数字段",
  "explore.view.index_pattern.field_editor.divisor_field": "除数字段",
  "explore.view.index_pattern.field_editor.add_new": "新增",
  "explore.view.index_pattern.complex_field_editor.name": "名称",
  "explore.view.index_pattern.complex_field_editor.name_required":
    "名称不能为空",
  "explore.view.index_pattern.complex_field_editor.new_field_placeholder":
    "新字段",
  "explore.view.index_pattern.complex_field_editor.duplicate_name":
    "已存在名为 {name} 的字段。",
  "explore.view.index_pattern.complex_field_editor.metric_name":
    "指标名称",
  "explore.view.index_pattern.complex_field_editor.function": "函数",
  "explore.view.index_pattern.complex_field_editor.unit": "单位",
  "explore.view.index_pattern.complex_field_editor.tags": "标签",
  "explore.view.index_pattern.complex_field_editor.delete_title":
    "删除字段“{name}”",
  "explore.view.index_pattern.complex_field_editor.delete_confirm":
    "删除后的字段无法恢复，确认要继续吗？",
  "explore.view.index_pattern.complex_field_editor.edit_title":
    "编辑 {name}",
  "explore.save_queries.title": "保存查询",
  "explore.save_queries.field.title": "标题",
  "explore.save_queries.field.tag": "标签",
  "explore.save_queries.field.description": "描述",
  "explore.save_queries.button.cancel": "取消",
  "explore.save_queries.button.save": "保存",
  "explore.save_queries.button.update": "更新",
  "explore.save_queries.validation.title_required": "请输入标题！",
  "explore.save_queries.validation.title_exists": "修改后的标题已存在！",
  "explore.load_queries.title": "加载查询",
  "explore.load_queries.search.title": "请输入查询标题",
  "explore.load_queries.search.tag": "请选择标签",
  "explore.load_queries.updated_at": "更新时间",
};
