export default {
  "explore.no_results.description":
    "Nothing found.",
  "explore.no_results.timefield.message.title": "Try another query?",
  "explore.no_results.timefield.message.description":
    "Your query criteria do not match any data, try to modify the query or change the time range. ",
  "explore.no_results.timefield.message.description.or_use":
    "Try",
  "explore.no_results.timerange.tips":
    " Auto-Fit the date range.",

  "explore.view.btn.create": "Create View",
  "explore.index.btn.create": "Create Index",
  "explore.no_view.title": "Empty Views",
  "explore.no_view.description": "No views found in the current cluster.",
  "explore.no_index.title": "Empty Indices",
  "explore.no_index.description": "No indices found in the current cluster.",
  "explore.datatype.view": "View",
  "explore.datatype.index": "Index",
  "explore.datatype.index.include_special_index": "Include special index",
  "explore.createview.title": "Create View",
  "explore.createview.description":
    "A data view can match a single index, e.g., server-log-1, or multiple indexes, server-log-*.",
  "explore.createview.step_view.title": "Step 1 / 2: Define View",
  "explore.createview.field.name": "View Name",
  "explore.createview.field.name.help": "Name cant not be empty",
  "explore.createview.field.match_rule": "Match Rule",
  "explore.createview.field.match_rule.help":
    'Use (*) to match multiple indices and cannot contain spaces or characters , /, ?, ", <, >, |.',
  "explore.createview.field.builtin": "Builtin",
  "explore.createview.field.builtin.true": "True",
  "explore.createview.field.builtin.false": "false",
  "explore.createview.status.match_index_num": "Matching {length} indices",
  "explore.createview.status.match_special_index":
    "The current matching rule did not match the Elasticsearch index.To match the special index, turn on the Include special index switch.",
  "explore.createview.status.no_match_index":
    "No Elasticsearch index is matched.",
  "explore.createview.status.no_match_but":
    "No index is matched, you can match {length} additional indexes below.",
  "explore.table.rows_of_page": "Rows per page",
  "explore.table.rows_of_page_option": "rows",

  "explore.createview.step_config.title": "Step 2 / 2: Configuration",
  "explore.createview.step_config.description":
    "Specify configuration for view {pattern}.",
  "explore.createview.step_config.select_timestamp":
    "Please select a time field as the time filter for the view.",
  "explore.createview.field.timestamp": "Time field",
  "explore.createview.btn.refresh": "Refresh",
  "explore.viewlist.description":
    "Creating and managing data views can help you better get data from Elasticsearch.",
  "explore.viewlist.title": "View",
  "explore.indexfield.description":
    "The current page lists all fields that match the {pattern} index, and the field type is an Elasticsearch data type. To change the type, use the ",
  "explore.view.index_pattern.removeTooltip": "Delete view",
  "explore.view.index_pattern.refreshTooltip": "Refresh field list",
  "explore.view.index_pattern.refreshFieldListTitle": "Refresh field list?",
  "explore.view.index_pattern.back_to_list": "Back to view list",
  "explore.view.index_pattern.detail_title": "View details",
  "explore.view.index_pattern.delete_confirm": "Delete view?",
  "explore.view.index_pattern.time_field": "Time field: '{field}'",
  "explore.view.index_pattern.mapping_conflict_title": "Mapping conflict",
  "explore.view.index_pattern.mapping_conflict_desc":
    "The indices matched by this view contain {count} field conflicts across multiple types, such as string and integer. You can still inspect conflicted fields, but they cannot be used in functions until the index mappings are reconciled.",
  "explore.view.index_pattern.tab.fields": "Fields",
  "explore.view.index_pattern.tab.scripted_fields": "Scripted fields",
  "explore.view.index_pattern.tab.source_filters": "Source filters",
  "explore.view.index_pattern.tab.complex_fields": "Complex fields ({count})",
  "explore.view.index_pattern.search_fields": "Search fields",
  "explore.view.index_pattern.filter_field_types": "Filter field types",
  "explore.view.index_pattern.search_placeholder": "Search",
  "explore.view.index_pattern.create_field": "Create field",
  "explore.view.index_pattern.all_field_types": "All field types",
  "explore.view.index_pattern.all_languages": "All languages",
  "explore.save_queries.title": "Save Queries",
  "explore.save_queries.field.title": "Title",
  "explore.save_queries.field.tag": "Tag",
  "explore.save_queries.field.description": "Description",
  "explore.save_queries.button.cancel": "Cancel",
  "explore.save_queries.button.save": "Save",
  "explore.save_queries.button.update": "Update",
  "explore.save_queries.validation.title_required": "Please input title!",
  "explore.save_queries.validation.title_exists": "Changed title already exists!",
  "explore.load_queries.title": "Load Queries",
  "explore.load_queries.search.title": "Please input queries title",
  "explore.load_queries.search.tag": "Please select a tag",
  "explore.load_queries.updated_at": "Updated at",
};
