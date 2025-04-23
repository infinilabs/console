---
weight: 80
title: "版本历史"
---

# 版本发布日志

这里是 INFINI Console 历史版本发布的相关说明。

## Latest (In development)  
### Breaking changes  
### Features  
### Bug fix 
- 修复删除索引后重建索引缓存问题 (#189)
- 修复`qps`相关指标展示时的小数位数 (#190)
- 修复队列数据查看不弹窗问题 (#191)
### Improvements  

## 1.29.2 (2025-03-31)
### Breaking changes  
### Features  
### Bug fix  
- 修复查询活动事件时因 `mapping` 嵌套层级超过默认值 20 报错 (#181)
- 修复开发工具查询长整型数据精度丢失问题 (#182)
- 回滚 `strict_date_optional_time` 修复 (#117) (#185)

### Improvements  
- 优化配置同步时，可根据标签进行筛选(#176)
- 优化屏幕分辨率适配，增强用户体验 (#186)

## 1.29.1 (2025-03-14)
### Breaking changes  
### Features  
### Bug fix  
- 修复 agentless 模式下计算索引级别实时 qps 不准确的问题 (#172)
### Improvements  

## 1.29.0 (2025-02-27)

### Breaking changes

### Features

- 监控（集群、节点）新增日志查询

### Bug fix
- 修复指标数据为空时的查询错误 (#144)
- 修复初始化结束步骤中主机显示为错误的问题 (#147)
- 修复数据探索中获取字段值建议的错误 (#151)
- 修复告警消息热图数据显示错误的问题 (#157)
- 修复开发工具 `_sql` 查询支撑 Elasticsearch 6.x 版本 (#158)
- 修复审计日志默认排序翻页之后丢失的问题 (#161)
- 修复 `Mapping` 冲突问题 (#161)

### Improvements
- 优化下发给 Agent 的配置，增加集群名称 (#148)
- 优化柱状图和时间选择器的 UI (#151)
- 集群，节点，索引健康状态变更支持查看日志 (#150)
- 增强 LDAP 身份验证的日志记录 (#156)
- 优化监控报表里拷贝指标请求的 UI (#155)
- 删除索引提示增加集群信息 (#162)

## 1.28.2 (2025-02-15)

### Features
- 告警功能支持根据桶之间文档数差值和内容差异告警 (#119)
- 当使用 Easysearch 存储指标时，增加 Rollup 索引生命周期 (#128)
- 增加集群指标采集模式变更事件 (#152)
- 支持清理离线 Agent 实例(#165)

### Bug fix
- 修复 Insight API 处理多时间序列数据时数据丢失的问题 (#127)
- 修复错误的节点健康状态变更事件 (#154)

### Improvements

- 告警图表新增复制请求
- 在注册 Agent 中新增 Agent 凭据设置
- 在集群编辑中新增采集模式
- 当使用 Easysearch 存储指标时，自动为系统集群创建 Agent 指标写入最小权限用户 (#120)
- 优化 LDAP 用户映射增加默认权限组 (#114) (#130)
- 优化 Agent 连接 Easysearch 的配置信息中增加 `version` 和 `distribution` 来解决启动时退出问题 (#131)

## 1.28.1 (2025-01-24)

### Features

- 创建集群时支持配置多个主机地址，增强集群的高可用性
- Insight Data API 支持函数格式查询，方便拓展查询功能
- 提供 API 来 Dump 查看当前存储的 Badger Key 列表
- Rollup 支持场景条件适配，要求 Easysearch > 1.9.2
- TopN 内置指标- 索引指标（agent 采集模式）
- TopN 内置视图模版
- TopN 支持自定义数据视图

### Bug fix

- 修复 Badger KV 存储内存占用过高的问题

### Improvements

- LDAP 配置支持带特殊符号“点”(.) 验证(#46)

## 1.28.0 (2025-01-11)

### Features

- 在集群健康状态变为红色时，将分配活动记录到动态日志中。
- 为索引增加段内存指标（包括 norms、points、version map、fixed bit set）。
- 支持在 Insight 数据查询 API 中查询 Top N 指标。
- 新增 Insight 指标 CURD API，用于管理自定义指标。
- 添加多个常见用例的内置指标模板。

### Bug fix

- 修复当集群 UUID 为空时查询线程池指标的问题。
- 修复单元测试中的问题。

### Improvements

- 优化 Agent 列表的 UI，当列数据溢出时改善显示效果。
- 在概览表格的每一行添加加载动画。
- 支持通过集群 ID 和集群 UUID 查询指标。
- 优化指标查询的桶大小设置 (#59)。
- 在监控图表中，如果时间间隔小于收集间隔导致无数据显示时，添加提示。
- 检查监控中集群版本是否支持 metric transport_outbound_connections。
- 将 DatePicker 的时间设置默认超时时间调整为 10 秒。
- 检查监控中集群版本是否支持 metric transport_outbound_connections。
- 增强 http_client，支持更多自定义配置选项。

## 1.27.0 (2024-12-13)

### Improvements

- 代码开源，统一采用 Github [仓库](https://github.com/infinilabs/console) 进行开发
- 指标采集优化，由原来的单一协程采集调整为每个注册的集群有单独的协程进行采集
- 指标监控页面图表展示采用懒加载、单个图表独立加载，增强用户体验
- 通用时间控件增加超时时间设置
- 集群选择控件增加注册、刷新功能
- 提供指标采集状态
- 表格控件排版优化

### Bug fix

- 修复集群元数据更新不及时问题
- 修复帮助文档等链接不正确问题
- 修复节点、索引数据因随机 id 出现重复记录问题
- 修复 Runtime、Agent 实例编辑页面出错问题
- 修复集群、节点、索引、分片元数据无 Loading 问题
- 修复索引健康状态指标采集失败问题
- 修复个别菜单列未国际化问题

## 1.26.1 (2024-08-13)

### Improvements

- 同步更新 Framework 修复的已知问题
- 事件上报部分代码重构

## 1.26.0 (2024-06-07)

### Bug fix

- 修复监控数据布局
- 修复命令存储权限
- 修复多行请求包含 SQL 语法
- 修复文档数过亿时换算错误
- 修复从低版本 v1.6.0 导入告警规则缺少字段问题
- 修复当 buck_size 小于 60 秒时，因指标采集延迟导致指标显示异常问题

### Improvements

## 1.25.0 (2024-04-30)

### Bug fix

- 修复数据迁移在大数据量消费不及时场景下因解压缩可能引发数据写入条数不正确的问题
- 修复概览监控页面探针安装链接地址错误问题
- 修复审计日志权限菜单不显示问题

### Improvements

- 优化索引管理，增加批量删除索引功能
- 优化告警事件明细页面，增加时间选择范围，可查看历史告警事件
- 优化探针管理页面表格布局
- 优化数据探索 URL 展示格式，便于分享使用
- 优化数据探索字段过滤设置，支持自定义采样条数及全记录分桶
- 优化系统集群不可用时，可进行开发工具进行索引数据操作
- 优化开发者工具页面，集群选择弹出框位置固定在右下方

## 1.24.0 (2024-04-15)

### Features

- 用户操作审计日志功能

### Bug fix

- 修复普通用户权限 403 问题
- 修复探针管理表格展开显示错位问题

### Improvements

- 优化开发工具集群选择控件显示位置
- 优化数据探索查询控件显示宽度
- 优化数据探索字段统计功能

## 1.23.0 (2024-03-01)

### Bug fix

- 修复数据迁移中数据分片范围因精度导致数据溢出显示为负数
- 修复删除实例队列后消费的 Offset 未重置问题
- 修复网友提出的各种问题，如集群设置默认打开节点、索引采集等

### Improvements

- 优化实例管理中增加磁盘空闲空间显示
- 优化实例队列名称显示

## 1.22.0 (2024-01-26)

### Bug fix

- 修复迁移任务场景实例状态字段字段不断占用问题
- 修复 Agent 实例管理分页参数丢失问题
- 修改 Overview 页面指标首尾过大导致显示异常问题

### Improvements

- 统一版本号
- 优化组件依赖关系

## 1.14.0 (2023-12-29)

### Features

- 数据迁移支持根据浮点类型字段进行数据分区设置
- 数据迁移支持根据数字类型字段进行数据均匀分区

### Bug fix

- 修复告警恢复后，新周期内没有发送告警通知消息的问题

## 1.13.0 (2023-12-15)

### Features

- 支持 Opensearch 集群存储系统数据

### Improvements

- 优化初始化安装流程
- 新增探针初始化配置
- 安装向导，新增凭据检查功能
- 安装向导，新增管理员密码重置功能
- 探针管理，支持自动关联 Auto Enroll

## 1.12.0 (2023-12-01)

### Bug fix

- 修复数据探索 multi fields 字段计算 top values 报错的问题
- 修复由 Framework Bug 造成连接数不释放、内存异常增长的问题
- 修复内网模式下静态资源远程加载的问题
- 修复数据看板数据源配置校验异常的问题

### Improvements

- 优化数据探索计算 top values，使用先采样后，后取 top values
- 可通过配置参数 http_client.read_buffer_size 设置读取缓存大小，解决开发工具执行命令时，默认缓存太小的问题

## 1.11.0 (2023-11-17)

### Features

- 开发工具 SQL 查询支持
  - 支持 SELECT 查询及语法高亮
  - 支持索引和字段自动提示
  - 支持 FROM 前置语法

### Bug fix

- 修复平台概览集群指标为空的问题

### Improvements

- LDAP 支持从 DN 中解析 OU 属性
- 集群动态优化显示，新增节点名称和索引名称的聚合统计过滤

# 1.10.0 (2023-11-03)

### Features

- 监控新增分片级别指标
- 重构探针注册流程
- 合并精简冗余接口
- 支持实例的配置查看和动态修改
- 允许准入和移除探针
- 节点级别添加线程池相关指标
- 新增网关动态配置查看和修改功能

### Bug fix

- 修复数据迁移/校验任务列表状态显示异常的问题
- 优化数据迁移/校验任务剩余时间显示
- 修复数据探索索引选择列表数据不完整的问题
- 修复开发工具集群列表找不到集群的问题
- 修复监控告警详情点击后查询的数据未包含告警时间点产生的数据问题

### Improvements

- 数据探索查询数据支持自定超时时间
- 数据探索字段 TOP5 统计的总数调整为当前时间范围内的文档数
- 监控指标支持自定义时间桶的大小
- 数据检验任务添加导出文档数提示信息
- 优化集群，网关注册输入框，自动去除两边空格
- 完善探针探测未知 ES 节点的流程
- 优化探针安装脚本，新增远程配置服务器参数
- 优化集群动态界面，新增筛选过滤、时序图等
- 优化集群管理界面，新增筛选过滤

# 1.9.0 (2023-10-20)

### Features

- 支持正常结束的数据校验任务重跑
- 添加后端服务关闭错误提示
- 新增统一的数据列表展示标准组件，基于该组件，配置相关字段即可快速渲染数据列表 UI
- 新增下拉列表标准组件，支持搜索、多选、排序、过滤、分组、翻页等

### Bug fix

- 修复开发工具不支持 update API 的问题
- 修复数据校验任务重跑之后不一致文档数显示不对的问题

### Improvements

- 数据校验 UI 优化
- 集群、节点、索引下拉列表 UI 优化
- 数据迁移进度条优化

# 1.8.0 (2023-09-21)

### Features

- 数据迁移任务支持自定义名称和添加标签
- 数据迁移任务详情页新增若干指标
- 数据迁移任务详情页新增查看日志

### Bug fix

### Improvements

- 数据迁移 UI 优化
- 监控报表、数据看板、数据探索页面时间控件 UI 优化

# 1.7.0 (2023-09-01)

### Features

- 告警规则新增分类和标签属性
- 告警 UI 操作增加批量操作
- 数据看板新增全屏功能
- 数据看板新增日历热力图
- 数据看板组件多分组支持分层显示

### Bug fix

- 修复数据迁移任务在大量子任务场景下，统计进度不对的问题
- 修复某些场景下集群重复注册的问题

### Improvements

- 告警中心页面 UI 优化
- 告警详情页面 UI 优化
- 数据看板组件配置 UI 优化
- 数据看板组件数据源配置优化
- 网关管理 -> 队列管理支持批量删除队列和消费者

# 1.6.0 (2023-08-10)

### Features

- 优化平台概览 UI 界面、支持卡片和表格样式切换展示
- 告警规则新增告警恢复通知配置
- 告警渠道新增邮件通知
- 告警规则和告警渠道新增导入导出
- 新增邮件服务器

### Bug fix

- 修复数据探索切换视图排序失效的问题

### Improvements

- 调整告警规则渠道配置
- 调整饼图样式

# 1.5.0 (2023-07-21)

### Features

- 新增熔断器监控指标
- 网关队列管理支持多选删除消费者
- 数据看板新增组件矩形树图

### Bug fix

- 修复开发工具智能提示兼容性问题
- 修复探针列表状态显示异常的问题
- 修复探针列表分页不生效的问题
- 修复数据看板 统计函数显示不对的问题
- 修复探针下发采集指标配置重复的问题
- 修复数据看板设置过滤条件不生效的问题
- 修复主机列表探针状态不对的问题
- 修复删除队列不成功的问题
- 修复数据探索当前集群没索引时跳转的问题
- 修复数据看板编辑状态下点击事件的问题

### Improvements

- 探针进程关联支持通过选择集群自动关联，简化操作
- 探针列表支持排序
- 探针支持向上滚动查看节点日志
- 采集监控指标添加 cluster_uuid 信息
- 数据看板支持配置指标排序

# 1.4.0 (2023-06-30)

### Features

- 支持 LDAP 集成到登录页面
- 新增主机列表，查看主机指标
- 数据看板新增 Iframe 组件，支持嵌入外部链接
- 数据看板新增表格组件（聚合结果）
- 数据看板新增全局过滤
- 数据看板新增点击过滤/下钻（饼图、柱状图、日志表格、聚合表格）

### Bug fix

- 修复数据探索通过数据视图可以查询没有权限的索引数据问题
- 修复开发工具通过 \_search 接口查询没有权限的索引数据
- 修复数据探索编辑过滤字段报错问题
- 修复数据看板快速切换工具栏字段类型和聚合方式不匹配问题
- 修复数据看板日志组件加载更多失效问题

### Improvements

- 优化 agent 查看节点日志文件
- 告警指标 bucket label 支持自定义模版显示
- 数据看板组件 bucket label 支持配置自定义模版显示
- 优化数据看板堆叠配置（柱状图、面积图、条形图），支持配置是否百分比堆叠
- 优化数据看板字段选择框，支持复制字段

# 1.3.0 (2023-06-08)

### Features

- 数据看板新增新增 Dashboard 导入导出功能
- 数据看板表格组件 UI 调整，并新增排序功能
- 数据看板组件支持多指标（折线图、面积图、柱状图、条形图）
- 数据迁移新增增量迁移功能
- 数据迁移新增定时运行功能
- 数据比对新增增量比对功能
- 数据比对新增定时运行功能
- 新增索引，节点健康状态指标
- 新增 Agent 管理功能
  - Agent 注册以及基本信息修改
  - 查看 Agent 主机 ES 进程信息，进程关联到已注册集群后，自动采集该 ES 集群指标及日志
  - 通过 Agent 查看 ES 节点日志
  - Agent 支持 linux 平台脚本一键安装
- 新增免费授权申请功能

### Bug fix

- 修复没给菜单权限，左侧菜单依然显示的问题
- 修复删除数据看板 Dashboard 时 URL 中 ID 不更新的问题
- 修复数据看板指标字段搜索无数据的问题
- 修复数据探索切换索引（视图）时报错的问题
- 修复数据探索切换时间字段后索引显示不正常的问题
- 修复数据探索切换表格样式的问题
- 修复数据看板框选一个坐标点进行时间过滤时无数据的问题
- 修复数据看板只读用户标签页样式的问题
- 修复数据看板组件放大后进入编辑界面 UI 不正常的问题

### Improvements

- 节点监控详情分片列表增加索引写入指标
- 数据看板柱状图和条形图新增配置是否堆叠
- 告警模版添加函数 get_keystore_secret 支持访问 keystore 变量

# 1.2.0 (2023-05-25)

### Features

- 数据看板新增表格组件
- 数据看板组件指标快速切换 UI 调整
- 数据看板组件时间范围框选 UI 调整，并新增下钻功能
- 告警模版支持解析配置文件环境变量
- 增加数据比对 beta 版本，支持索引数据校验

### Bug fix

- 修复数据看板组件复制的问题
- 修复开启实时推送日志后，不写文件日志的问题
- 修复初始化时，系统集群没有索引，节点元数据的问题
- 修复网关重启后，数据迁移任务无法结束的问题
- 修复数据迁移任务统计数据重复的问题
- 修复数据探索列表时间字段排序问题

### Improvements

- 告警规则表达式显示优化
- 优化数据迁移任务调度流程，减少 ES 调用次数
- 数据迁移任务增加跳过 scroll/bulk 文档数检查选项

# 1.1.0 (2023-05-11)

### Features

- 网关管理添加查看实时日志的功能
- 数据迁移添加 ILM，Template, Alias 初始化操作
- 数据看板图表支持复制、快速切换、时间框选、缩放、标记高亮

### Bug fix

- 修复数据探索保存查询出现 mapping 错误的问题
- 修复数据看板组件数据源配置的问题
- 修复数据探索左侧字段栏样式的问题
- 修复集群注册向导点击跳转后丢失集群类型的问题

### Improvements

- 数据看板汉化

# 1.0.0 (2023-04-20)

### Features

- 数据迁移添加初始化索引 settings, mappings 可选步骤
- 数据迁移添加删除功能
- discover 添加搜索关键词高亮功能
- 新增数据看板，支持多标签页，支持折线图、柱状图、饼图等图表

### Bug fix

- 修复新注册集群状态不同步更新的问题
- 修复低版本 ES 多 type 分区查询时没有根据 doctype 过滤的问题

### Improvements

- 添加 Opening scroll context 监控指标
- 数据迁移分区设置优化

# 0.9.0

### Features

- 新增数据迁移功能

### Bug fix

- 修复注册集群选择已创建的凭据时报错的问题
- 修复服务方式启动数据目录没有初始化的问题

### Improvements

- 开发工具支持 CCS
- 数据视图支持 CCS
- UI 优化

# 0.8.0

### Features

- 新增凭据管理功能
- 集群配置身份验证信息加密存储
- 在注册集群中添加凭据选择
- 在用户向导添加凭据密钥配置

### Bug fix

- 修复了网关示例列表 CPU 数值显示问题
- 修复了系统服务健康监控错误提示

### Improvements

- KV 内存占用优化.

## 0.7.0

### Breaking changes

### Features

- 新增初始化向导。
- 新增系统服务健康监控。
- 新增授权窗口。

### Bug fix

- 修复了 Discover 第一次加载未发起搜索请求的问题。
- 修复了告警记录索引配置了生命周期时，查看告警详情报错的问题。
- 修复了查看节点线程池指标时选择多个节点后指标不显示的问题。

## 0.6.0

### Breaking changes

### Features

- 新增主机概览。
- 新增主机监控。
- 节点概览新增日志查看功能（需安装 Agent）。
- Insight 配置框新增 Search 配置。

### Bug fix

- 修复了 Discover 字段过滤白屏问题。
- 修复了 Discover 表格添加字段后排序失效问题。
- 修复了低版本浏览器 JS 不兼容导致集群注册不成功的问题。
- 修复了 Elasticsearch 8.x 删除文档报错不兼容的问题。
- 修复了创建新索引不成功时，异常处理的问题。
- 修复了元数据采集配置空指针引用的问题。
- 修复了开发工具中使用加载命令失败报错的问题。

### Improvements

- 本地列表搜索查找支持通配符过滤。
- 支持配置页面标题后缀。
- 优化告警规则必填字段标记显示。
- 优化 Discover 时间范围 Auto Fit，设为 15 分钟。
- 优化 Discover 保存搜索，会保存当前的字段过滤和 Insight 图表配置。
- 优化集群列表：增加链接跳转；支持集群列表 status 字段排序。

## 0.5.0

### Breaking changes

### Features

- 集群监控节点层面添加 IO 指标（仅支持 Linux 版本 Elasticsearch 集群）。
- 新增探针管理功能。
- 新增基于 Centos 的 Docker 镜像。
- INFINI Insight 新增图表类型（单值、饼图、面积图）

### Bug fix

- 修复了 Gateway 实例列表刷新后多次请求的问题。
- 修复了 docker 镜像时区加载失败的问题。
- 修复了存储数据 Elasticsearch 集群不可用时，采集监控指标队列不消费的问题。
- 修复开发工具不能转发请求给后端集群为 Https 类型的问题。
- 修复 INFINI Insight 编辑组件后所有组件又重新获取数据的问题。
- 修复从其它页面的索引链接跳转到 Discover 时 Query 依然有旧状态的问题。

### Improvements

- 优化刷新集群状态日志输出。
- 优化了未授权时跳转至登录界面频繁的弹窗提示。
- 优化 Discover 搜索栏时间选择控件 UI，空间更紧凑，切换更方便。

## 0.4.0

### Breaking changes

### Features

- 数据探索新增 Insight 功能，根据索引下的数据特征推送图表，可视化展示指标数据。
- 数据探索新增保存搜索和回放搜索功能。
- 新增别名管理。

### Bug fix

- 修复了 v0.3.1 没有开启安全的情况下开发工具发送请求响应返回错误的 Bug。
- 修复了 AWS Elasticsearch 云环境 node http.public_address 没有，导致采集监控数据报错的 Bug。
- Fixed the bug that when the Elasticsearch cluster for storing data is unavailable, the collected metric data are not consumed(Updating the settings of `elastic>store` defaults to false in `console.yml`).

### Improvements

- 优化 Console 存储数据 Elasticsearch 版本检查提示。

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
- Added platform overview
- Added cluster activities
- Added index management
- Added data view management
- Added data discover (Support both index and view)
- Support gzip compression and it is enabled by default
- Support rbac authorization
- Added alerting management (Support Webhook channel)
- Added time-zone quick selector

### Bug fix

- Fixed bug:discover multi fields selected
- Fixed bug:the count of `nodes` and `shards` value incorrect in cluster overview
- Fixed bug:overview search request params field `from` do not counting from 0
- Fixed bug:login page tab not centered
- Fixed bug:Re-login redirect jump parameter problem caused by session expiration
- Fixed bug:OverviewStatistic component mask state value incorrect
- Fixed bug:repeat http request pending state
- Fixed bug:console copy as curl without an endpoint

### Improvements

- Rewritten monitoring UI
- Optimize cluster metrics line chart
- Optimize health status component
- Add filter component to quick filter clisters,nodes,indices
- Add local sort for table column of clisters,nodes,indices
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
- Added thread pool related metrics
- Optimize the grouping of metrics
- Index `.infini_metrics` support ilm configuration
- Added hot key(`Ctrl+Shift+O`) to dev tools
- English version support

### Bug fix

- Fixed the "required authentication credentials" issue in the test connection cluster time
- Fixed the issue that the validation failed when the cluster address is a domain name and contains special characters
- Fixed the issue that monitoring data is not displayed on 32-bit operating systems
- Fixed the issue that the development tool was initialized blank when the storage ES address changed
- Fixed the issue that the pagination of cluster list page cannot work

### Improvements

- Cluster view Added metrics of counting cluster master, data, and coordinating nodes
- Cluster view Added metric of cluster health
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
