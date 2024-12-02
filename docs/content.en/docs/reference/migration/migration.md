---
weight: 1
title: Data Migration
asciinema: true
---

# Data Migration

## Create Migration Task

Click on the **Data Tools** option in the left menu of the INFINI Console, then click the **New** button to create a migration task, as shown in the following image:

### Configure Migration Clusters

{{% load-img "/img/screenshot/migration/20221025-migration-step1-1.jpg"%}}
Select the cluster `es-v5616` from the source cluster list and `es-v710` from the destination cluster list.

### Configure Migration Indices

Click the **Select Migration Indices** button, as shown in the image below:

{{% load-img "/img/screenshot/migration/20230420-create-migration3.jpg"%}}

Here, we select the index `test` and then click **Confirm**.

{{% load-img "/img/screenshot/migration/20230420-create-migration4.jpg"%}}

> The `test` index contains two types, which are automatically split into two indices.

You can modify the target index name and document type on the right side of the table as needed. After selecting the index, click **Next** to perform index initialization, as shown in the following image:
{{% load-img "/img/screenshot/migration/20230420-create-migration5.jpg"%}}

After expanding, you can see the mappings and settings. The mappings on the left side display the mappings of the source cluster index. You can click the middle button to copy them to the right side. Then click `Auto Optimize` for automatic optimization (compatibility optimization). After completing the settings, click `Start` to initialize the mappings and settings. If no settings are provided, it will be skipped automatically.

> If you have already initialized the index settings and mappings through other means, you can directly click **Next** to skip this step.

After completing the index initialization, click **Next** to set the data range and partition settings for the migration task, as shown in the following image:
{{% load-img "/img/screenshot/migration/20230420-create-migration6.jpg"%}}

### Configure Data Range

If you need to filter the data migration, you can set the data range. In this case, we are performing a full data migration, so we won't set it.
{{% load-img "/img/screenshot/migration/20230420-create-migration7.jpg"%}}

### Configure Data Partition

If an index has a large amount of data, you can configure data partitioning. Data partitioning divides the data into multiple segments based on the specified field and partitioning step. The system will treat each segment as a subtask for migrating the data. This way, even if an exception occurs during the migration of one segment, you only need to rerun that subtask.

{{% load-img "/img/screenshot/migration/20230420-create-migration8.jpg"%}}

Data partitioning currently supports partitioning based on date type fields (date) and numeric type fields (number). In the example above, we select the date type field `now_widh_format` for partitioning and set the partitioning step to 5 minutes (5m). Then click the **Preview** button to see the result. Based on the settings, it will generate 8 partitions (partitions with 0 documents will not generate subtasks). After confirming the partition settings based on the preview information, click **Save** to close the partition settings and proceed to the next step for runtime configuration.

### Runtime Configuration

{{% load-img "/img/screenshot/migration/20230420-create-migration9.jpg"%}}

In general, use the default settings and select the previously registered gateway instance, Nebula, for the execution nodes. Then click **Create Task**.

### Configure Incremental Data Migration

If the data within the index is continuously being written (e.g., log data), you can configure incremental migration to continuously detect and migrate data from the source cluster to ensure synchronization with the destination cluster.

When configuring the index, specify the incremental field (e.g., timestamp) and the data write delay (default is 15 minutes) for the index. The purpose of configuring the write delay is to prevent data loss in the destination cluster due to some data not being persisted when exporting from the source cluster:
{{% load-img "/img/screenshot/migration/20230608-migration-incremental-1.png"%}}

When creating the task, select **Detect Incremental Data** and set the detection interval (default is 15 minutes):
{{% load-img "/img/screenshot/migration/20230608-migration-incremental-2.png"%}}

After clicking **Start**, the task will import incremental data from the source cluster to the destination cluster every 15 minutes. To pause the incremental migration, you can click the **Pause** button. Clicking **Resume** will resume the incremental task, and the data written to the source cluster during the pause will be imported to the destination cluster as usual:

{{% load-img "/img/screenshot/migration/20230608-migration-incremental-3.png"%}}

## Start Migration Task

After successfully creating the migration task, you will see the task list, as shown in the following image:

{{% load-img "/img/screenshot/migration/20230420-migration10.jpg"%}}
You can see that the recently created task is listed. Click the **Start** button in the action bar on the right side of the table to begin the task.

> Before starting the task, make sure that if the migration index involves ILM configuration, the relevant index templates and ILM aliases are properly configured in the destination cluster.

Click the **Start** button to initiate the migration task.

## View Migration Task Progress

After the task is successfully started, click on **Details** to view the task execution status. By clicking the **Refresh** button to enable auto-refresh, you will see the following changes in the task details:

{{% load-img "/img/screenshot/migration/20230420-migration11.jpg"%}}

The blue squares indicate that the subtasks (partition tasks) are already running, while the gray squares indicate that the tasks have not started.

{{% load-img "/img/screenshot/migration/20230420-migration12.jpg"%}}

In the image above, you can see that the squares have turned green, indicating that the subtasks (partition tasks) have completed data migration. The migration progress for the index `test-doc` is 100%, and for the index `test-doc1`, it is 21.11.

{{% load-img "/img/screenshot/migration/20230420-migration13.jpg"%}}

In the image above, all the squares have turned green, indicating that the migration progress for all indices is 100%, indicating that the data migration is complete. If any square turns red during the migration, it means that an error has occurred. In such cases, you can click on the task square to view the error log in the progress information and identify the specific cause of the error.
