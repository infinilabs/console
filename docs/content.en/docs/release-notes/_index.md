---
weight: 80
title: "Release Notes"
---

# Release Notes

Information about release notes of INFINI Console is provided here.

## Latest (In development)

### Breaking changes

### Features
- Add allocation to activities if is cluster health change and changed to red.
- Add index metrics for segment memory (norms, points, version map, fixed bit set).

### Bug fix
- Fixed query thread pool metrics when cluster uuid is empty
- Fixed unit tests

### Improvements
- Optimize UI of agent list when its columns are overflow.
- Add loading to each row in overview table.
- Adapter metrics query with cluster id and cluster uuid
- Optimize metric query bucket size (#59)
- Add suggestion to chart in monitor if is no data because the time interval is less than the collection interval.
- Check if the cluster version supports metric transport_outbound_comnections in monitor.
- Set timeout to 10s by default in DatePicker's time settings.
- Check if the cluster version supports metric transport_outbound_comnections in monitor.
- Enhanced http_client to support customizable configurations.


## 1.27.0 (2024-12-09)

### Improvements
- Split monitoring metric requests to optimize monitoring metric query response speed.
- Optimizing ES metric collecting
- The code is open source and the Github repository is used for development
- Added timeout setting to general time component
- Cluster selection component adds registration and refresh feature
- Adding metrics collection status
- Optimizing layout of table component

### Bug fix
- Fixed the issue of untimely update of cluster metadata
- Fixed the issue of incorrect links in help documents, etc.
- Fixed node and index metadata ID to prevent metadata record duplication.
- Fixed the issue of errors in Runtime and Agent instance editing pages
- Fixed the issue of no loading of cluster, node, index, and shard metadata
- Fixed the issue of failure to collect index health status indicators
- Fixed the issue of some menu columns not being internationalized

## 1.26.1 (2024-08-13)

### Improvements

- Synchronize updates for known issues fixed in the Framework.
- Refactoring the event reporting code

## 1.26.0 (2024-06-07)

### Bug fix

- fix: adjust monitor data
- fix: permission of command
- fix: error with executing multi requests which contains sql query
- fix: billion to human
- fix: alert rule import for v1.6.0
- fix: expanding query metrics time and removing first and last metric dot when bucket size small than 60s

## 1.25.0 (2024-04-30)

### Bug fix

- Fixed data migration could lead to incorrect data writing counts due to decompression in scenarios with high data consumption.
- Fixed incorrect installation link address for probes on the overview monitoring page.
- Fixed the issue where the audit log permission menu was not displayed.

### Improvements

- Optimized index management by adding batch deletion of indexes feature.
- Optimized the alarm event details page by adding a time selection range to view historical alarm events.
- Optimized the table layout on the probe management page.
- Optimized the display format of URLs in data exploration for easier sharing.
- Optimized the data exploration field filtering settings to support custom sampling counts and full record buckets.
- Optimized the ability to operate index data using developer tools when the system cluster is unavailable.
- Optimized the developer tools page by fixing the position of the cluster selection pop-up box to the bottom right.

## 1.24.0 (2024-04-15)

### Features

- User operation audit log function

### Bug fix

- Fixed 403 issue with regular user permissions
- Fixed misalignment issue with probe management table expansion display

### Improvements

- Optimized cluster selection control display position for DevTools
- Optimized data exploration query control display width
- Optimized data exploration field statistics function

## 1.23.0 (2024-03-01)

### Bug fix

- Fixed the issue where data shard ranges overflowed due to precision in data migration, resulting in negative values being displayed.
- Fixed the problem of consumer offsets not being reset after deleting instance queues.
- Resolved various issues reported by users, such as default opening of nodes in cluster settings and index collection.

### Improvements

- Enhanced the display of available disk space in instance management.
- Improved the display of instance queue names.

## 1.22.0 (2024-01-26)

### Bug fix

- Fixed the issue where the instance status field was continuously occupied in the migration task scenario
- Fixed the problem of missing distribution parameters in `Agent` instance management
- Modified the issue on the `Overview` page where large metrics at the beginning and end caused abnormal display

### Improvements

- Unified version number
- Optimized component dependencies

## 1.14.0 (2023-12-29)

### Features

- Data migration supports partitioning data based on decimal type fields
- Data migration supports even partitioning of data based on numeric type fields

### Bug fix

- Fixed the issue that after the alerting is restored, the alerting notification message is not sent in the new cycle

## 1.13.0 (2023-12-15)

### Features

- Support OpenSearch cluster storage system data

### Improvements

- Optimize the initial installation process
- Added agent initialization configuration
- Setup wizard added credential secret checking feature
- Setup wizard added administrator account reset feature
- Agent management supports automatic association auto enroll

## 1.12.0 (2023-12-01)

### Bug fix

- Fixed the issue of error reporting in top values when calculating multi fields in data exploration
- Fixed the number of connections not being released and abnormal memory growth caused by Framework Bug
- Fixed the issue of remote loading of static resources in intranet mode
- Fixed the issue of abnormal data source configuration verification in the data dashboard

### Improvements

- Optimize discover calculation of top values, use sampling first, then take top values
- You can set the read cache size through the configuration parameter http_client.read_buffer_size to solve the issue that the default cache is too small when the development tool executes commands.

## 1.11.0 (2023-11-17)

### Features

- Devtools supported SQL query
  -Supported SELECT query and syntax highlighting
  -Supported index and field auto-prompt
  -Supported FROM prefix syntax

### Bug fix

- Fixed the issue where the platform overview cluster indicator is empty

### Improvements

- LDAP supports parsing OU attributes from DN
- Optimized cluster activities UI, added aggregate statistics filtering of node names and index names

## 1.10.0 (2023-11-03)

### Features

- Add shard-level metrics monitoring
- Refactor agent registration process
- Consolidate redundant APIs
- Support instance configuration viewing and dynamic modification
- Allow agent admission and removal
- Add thread pool related metrics at node level
- Add gateway dynamic configuration viewing and modification

### Bug Fixes

- Fix data migration/validation task list status display issues
- Optimize remaining time display of data migration/validation tasks
- Fix incomplete data exploration index selection list
- Fix development tool failure in finding some clusters
- Fix monitoring alert details not containing data at the time of alert

### Improvements

- Support custom timeout for data exploration queries
- Adjust data exploration TOP 5 stats to total docs in time range
- Support custom bucket size for monitoring metrics
- Add exported docs count tip for data validation tasks
- Trim whitespace when registering cluster and gateway
- Improve agent detection process for unknown ES nodes
- Optimize agent installation script, add remote config server parameter
- Enhance dynamic cluster UI with filtering, charts etc
- Enhance cluster management UI with filtering

# 1.9.0 (2023-10-20)

### Features

- Supports re-running of data comparison tasks that end normally
- Add backend service shutdown error notification
- Added a standard list component
- Added a standard dropdown list component

### Bug fix

- Fix the issue that dev tools do not support update API
- Fixed the issue where the number of inconsistent documents was incorrect after the data comparison task was re-run.

### Improvements

- Data comparison UI optimization
- Cluster, node, index dropdown list UI optimization
- Data migration progress bar optimization

# 1.8.0 (2023-09-21)

### Features

- Support custom name and tags while creating migration task
- Added some metrics to the data migration task details page
- Added viewing logs on the data migration task details page

### Bug fix

### Improvements

- Data migration UI optimization
- DatePicker UI optimization of page Monitor、Dashboard、Discover

# 1.7.0 (2023-09-01)

### Features

- Added category and tag attributes to alart rules
- Added batch operations in Alart UI
- Added full-screen function to data dashboard
- Added calendar heat map to the data dashboard
- Multiple groups of data dashboard components support hierarchical display

### Bug fix

- Fixed the issue that the statistical progress of the data migration task was incorrect in the case of a large number of subtasks
- Fixed the issue of repeated registration of clusters in some scenarios

### Improvements

- Alart message center UI optimization
- Alart details UI optimization
- Data dashboard component configuration UI optimization
- Optimization of data source configuration of data dashboard component
- Gateway management -> queue management supports batch deletion of queues and consumers

# 1.6.0 (2023-08-10)

### Features

- Optimize the platform overview UI, support card and table mode display
- Add alert recovery notification configuration for alert rules
- Add email notification for alert channels
- Add export/import for alert rules and alert channels
- Add email server

### Bug fix

- Fix the issue of sorting failure when change view in discover

### Improvements

- Optimizing alert Rule's Channel Configuration
- Optimizing chart pie's styles

# 1.5.0 (2023-07-21)

### Features

- Added monitoring metric of Circuit Breaker
- Gateway queue management supports multiple selection to delete consumers
- Added Treemap components to the data dashboard

### Bug fix

- Fix the compatibility issue of intelligent prompts in dev tools
- Fix the issue that the status of the agent is displayed abnormally
- Fix the issue that the pagination of the agent list does not work
- Fix the issue that the statistical function of the insight is displayed incorrectly
- Fix the issue that the configuration of the collection metric issued by the agent is repeated
- Fix the issue that the filter conditions set by the insight do not work
- Fix the issue that deleting the queue fails
- Fix the issue of jumping when the current cluster of data exploration has no index
- Fix the issue of click event in the editing state of the data dashboard

### Improvements

- Agent association node process supports automatic association by selecting clusters, simplifying operations
- Agent list supports sorting
- Supports scrolling up to view node logs
- Add cluster_uuid information to collect monitoring metric
- Data Dashboard supports configuration index sorting

# 1.4.0 (2023-06-30)

### Features

- Support LDAP in login
- Added host list to view host's metrics
- Added widget Iframe for dashboard, support embedding external link
- Added widget Table(aggregation) for dashboard
- Added global filters for dashboard
- Added click to filter(drilling) for dashboard widget(pie\histogram\log\table)

### Bug fix

- Fix the issue that discover can search some indices without permission
- Fix the issue that dev tools can search some indices by /\_search without permission
- Fix the issue that error will occur when discover editing field filter
- Fix the issue that the mismatch between the field type and aggregation method in dashboard quickbar
- Fix the issue that dashboard widget log's loading more is invalid

### Improvements

- Optimizing agent viewing node's log files
- Alert metrics support bucket label template
- Dashboard widget support bucket label template
- Support percentage stack for dashobard widget(histogram\area\bar)
- Support field copy for dashboard field selection

# 1.3.0 (2023-06-08)

### Features

- Support dashboard import and export
- Dashboard table component UI adjustment, and support sorting
- Dashboard component supports multiple indicators (line chart, area chart, histogram, bar chart)
- Added incremental migration for data migration
- Added scheduled operation for data migration
- Added incremental comparison for data comparison
- Added scheduled operation for data comparison
- Added index, node health status metrics
- Added Agent management
  - Agent registration and basic information modification
  - View the elasticsearch processes and automatic collecting metrics of elasticsearch cluster after the process is associated with registered cluster
  - View elasticsearch node logs
  - Agent supports linux platform script one-click installation
- Added free license request

### Bug fix

- Fix the issue that the menu on the left is still displayed without permission to the menu
- Fix the issue that the ID in the URL is not updated when the Dashboard is deleted
- Fix the issue that there is no data in the search for the metric field of the dashboard
- Fix the issue that an error is reported when switches indexes (views) in data discover
- Fix the issue that the index error display after switches the time field in data discover
- Fix the issue of wrong table style while switching to table mode in data discover
- Fix the issue that there is no data when a coordinate point is selected in the dashboard frame for time filtering
- Fix the issue of the style of the read-only user tab page of the data kanban
- Fix the issue that the UI of the dashboard component is not normal after entering the editing interface after being enlarged

### Improvements

- Added index qps to the shard list of node monitoring
- Added new configuration to the histogram and bar chart of dashboard indicates whether to stack
- Alert template added function get_keystore_secret to support access to keystore variables

# 1.2.0 (2023-05-25)

### Features

- Added table components to the data dashboard
- Quickly switch UI adjustments for data kanban component indicators
- UI adjustment for the time range frame selection of the data kanban component, and a new drill-down function
- Alert template support parsing environment variables
- Add data comparison beta version, support index data verification

### Bug fixes

- Fix the issue of data kanban component replication
- Fix the issue that the file log is not written after the real-time push log is enabled
- Fix the issue that the system cluster has no index and node metadata after initialized
- Fixed the issue that the data migration task could not end after the gateway was restarted
- Fixed the issue of duplication of statistical data in data migration tasks
- Fix the sorting issue of the time field in the data exploration list

### Improvements

- Alart rule expression display optimization
- Optimize the data migration task scheduling process and reduce the number of ES calls
- The data migration task adds the option to skip the scroll/bulk document number check

# 1.1.0 (2023-05-11)

### Features

- Support viewing real-time logs in gateway management
- Add initialization ILM，Template and Alias optional steps for data migration
- Dashboard chart supports copying, quick switching, time frame selection, zooming, and marker highlighting

### Bug fix

- Fix the issue of mapping error while saving queries in discover
- Fix the data source configuration of dashboard
- Fix multi scroll bar of fields list in discover
- Fix missing cluster distribution after jumping from cluster registration wizard

### Improvements

- Dashboard localization

# 1.0.0 (2023-04-20)

### Features

- Add initialization index settings, mappings optional steps for data migration
- Support delete for data migration
- Add search keyword highlighting for discover
- Add databoard, support multiple tabs, and some chart (line,bar,pie,and more)

### Bug fix

- Fix the issue that cluster status of cluster list was not updated
- Fix wrong partition query when source index has multi type with elasticsearch version 2.x, 5.x

### Improvements

- Add metric of opening scroll context in node metric monitor
- Optimize partition query of data migration

# 0.9.0

### Features

- add data migration feature

### Bug fix

- Fix the issue that an error reported when registering a cluster and selecting an already created credential
- init path while app start with service

### Improvements

- support CCS in dev tools
- support CCS in data view
- UI optimization

# 0.8.0

### Features

- Add credential management.
- Encrypted storage of elasticsearch authentication information.
- Add credential selection in cluster registration
- Add credential key in user guide

### Bug fix

- Fix the display of the cpu column in the gateway instance list
- Fix the error prompt of system service health monitoring

### Improvements

- KV memory usage optimization.

# 0.7.0

### Breaking changes

### Features

- Add Setup Wizard.
- Add System Service Health Monitoring.
- Add License Validation.

### Bug fix

- Fixed the issue that Discover did not search for the first time.
- Fixed the error of getting alert detail info when ilm is configured.
- Fixed the metric display bug of thread pool after select multi node.

# 0.6.0

### Breaking changes

### Features

- Add Overview Hosts.
- Add Monitor Hosts.
- Add log viewing in node overview (agent installation required).
- Add Insight Config Modal add Search Config.

### Bug fix

- Fixed the issue that page Discover became white screen when used field filter.
- Fixed the issue that sort failure after adding fields to page Discover's table.
- Fixed the issue that the cluster registration was unsuccessful due to the incompatibility of JS in low-level browsers.
- Fixed the incompatibility issue of Elasticsearch 8.x deleting documents.
- Fixed the issue of exception handling when creating a new index was unsuccessful.
- Fixed the issue with null pointer references in metadata configuration.
- Fixed the issue where loading common commands failed in the dev tools.

### Improvements

- Local list search lookup supports wildcard filtering.
- Support configuration page title suffix.
- Optimized the display of required fields in alerting rules.
- Set Discover TimeRange Auto Fit to 15 minutes.
- Optimize Discover to save the search, the field filters and Insight widget configuration will be saved.
- Optimized cluster list: add link jump; Support cluster list status field sorting.

## 0.5.0

### Breaking changes

### Features

- Add IO metrics at the elasticsearch node level (only supports the Linux version of Elasticsearch cluster).
- Add agent management.
- Add docker image based on Centos.
- Add INFINI Insight chart type (number, pie, area).

### Bug fix

- Fixed an issue with duplicate requests after the Gateway instance list was refreshed.
- Fixed an issue where docker image timezone loading failed.
- Fixed the issue that the metrics queue does not consume when the Elasticsearch cluster of storing data is unavailable.
- Fixed the issue that the development tool cannot forward the request to the Https based cluster.
- Fixed INFINI Insight all chart fetch data again after edits one of them.
- Fixed query still has the old state when jumping from the index link of other pages to discover.

### Improvements

- Optimized the log output when refresh cluster state.
- Optimized the pop-up prompt that frequently jumps to the login page when unauthorized.
- Optimize the time selection UI of the discover search bar, make the space more compact and switch more convenien

## 0.4.0

### Breaking changes

### Features

- Discover adds an Insight module, which pushes charts according to the data characteristics under the index, and visualizes the metrics data.
- Discover adds the functions of saving searches and replaying searches.
- Add alias management.

### Bug fix

- Fixed the bug that the Dev tools returned an error when sending a request response in v0.3.1 without security enabled.
- Fixed the bug that the AWS Elasticsearch cloud environment had no node http.public_address, which caused an error in collecting monitoring data.
- Fixed the bug that when the Elasticsearch cluster for storing data is unavailable, the collected metric data are not consumed(Updating the settings of `elastic>store` defaults to false in `console.yml`).

### Improvements

- Optimized Console storage data Elasticsearch version check prompt.

## 0.3.1

### Bug fix

- The KV module should be initialized before elastic module
- The account profile api should get builtin username dynamically
- Fixed an issue where the index in the overview was not displayed correctly
- Fixed node health status in the overview was not displayed correctly
- Fixed the bug that the new channel could not get the type when the rule was submit

## 0.3.0

### Breaking changes

### Features

- Support basic authentication
- Add platform overview
- Add cluster activities
- Add index management
- Add data view management
- Add data discover (Support both index and view)
- Support gzip compression and it is enabled by default
- Support rbac authorization
- Add alerting management (Support webhook channel)
- Add time-zone quick selector

### Bug fix

- Fixed bug: discover multi fields selected
- Fixed bug: the count of `nodes` and `shards` value incorrect in cluster overview
- Fixed bug: overview search request params field `from` do not counting from 0
- Fixed bug: login page tab not centered
- Fixed bug: Re-login redirect jump parameter problem caused by session expiration
- Fixed bug: Overview Statistic component mask state value incorrect
- Fixed bug: repeat http request pending state
- Fixed bug: console copy as curl without an endpoint

### Improvements

- Rewritten monitoring UI
- Optimize cluster metrics line chart
- Optimize health status component
- Add filter component to quick filter clusters,nodes,indices
- Add local sort for table column of clusters,nodes,indices
- Add isTLS form field for Gateway register
- Index list and node list Support real-time and non-real-time data switching viewing
- The interval for collecting elasticsearch cluster state is configurable
- Optimized requests to elasticsearch
- Add Console version info
- Add client http request timeout auto abort
- Dev tool support search
- Proper Handle metrics collecting while cluster in partial failure

## 0.2.0

### Breaking changes

### Features

- Collect Elasticsearch `cluster_health` metrics
- Add thread pool related metrics
- Optimize the grouping of metrics
- Index `.infini_metrics` support ilm configuration
- Add hot key (`Ctrl+Shift+O`) to dev tools
- English version support

### Bug fix

- Fixed the "required authentication credentials" issue in the test connection cluster time
- Fixed the issue that the validation failed when the cluster address is a domain name and contains special characters
- Fixed the issue that monitoring data is not displayed on 32-bit operating systems
- Fixed the issue that the Dev tools was initialized blank when the storage ES address changed
- Fixed the issue that the pagination of cluster list page cannot work

### Improvements

- Add metrics of counting cluster master, data, and coordinating nodes to cluster view
- Add metric of cluster health to cluster view
- Node view Add JVM grouping, display related information of JVM memory
- Node view added JVM GC frequency and GC delay metrics
- Use `POST` instead of `GET` when request body is not nil
- Node view added cache hit rate and other related metrics
- Node View added metric of the number of open files
- Show the last time of the metrics was collected When the cluster is unavailable

## 0.1.0

- Elasticsearch clusters management
- Basic monitoring supported for Elasticsearch cluster
- Dev tools support elasticsearch
