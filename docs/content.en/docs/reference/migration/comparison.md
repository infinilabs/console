---
weight: 1
title: Data Comparison
asciinema: true
---

# Data Comparison

## Create a Comparison Task

Click on **Data Tools** in the left menu of the INFINI Console, then click on the **New** button to create a comparison task, as shown in the following image:

![Image 1](/img/reference/migration/comparison/1.png)

### Configure Comparison Clusters

Next, select the cluster `opensearch-v1.0` from the source cluster list, and select the cluster `sy_cluster` from the target cluster list:

![Image 2](/img/reference/migration/comparison/2.png)

### Configure Comparison Indices

Click on the **Select Comparison Index** button. Here, we have chosen the index `tv6-migration` and click **Confirm**:

![Image 3](/img/reference/migration/comparison/3.png)

Then, we can select the target index to compare, `tv6-sy`:

![Image 4](/img/reference/migration/comparison/4.png)

Click **Next**.

### Configure Filter Conditions and Partition Rules

If you need to filter data from both the source and target indices, you can set the data range filter conditions, which will be applied to both indices simultaneously:

![Image 5](/img/reference/migration/comparison/5.png)

You can configure partitioning of the data for comparison, which will help in identifying the source of the differing data. The partition rules also apply to both the source and target indices:

![Image 6](/img/reference/migration/comparison/6.png)

Click **Next**.

### Runtime Settings

We can set the runtime parameters for the task, which usually do not need to be adjusted. Select the nodes for the task to run on, and then click **Create Task**:

![Image 7](/img/reference/migration/comparison/7.png)

### Configure Incremental Data Comparison

If the data within the index is continuously being written (e.g., in a log scenario), you can configure an incremental comparison task to continuously detect the differences between the source and target clusters.

When configuring the index, specify the incremental fields (e.g., timestamp) and the data write delay (default: 15 minutes) for the index that receives incremental writes. The purpose of configuring the write delay is to prevent data discrepancies caused by some data not being persisted to disk when exporting:

![Image Incremental 1](/img/reference/migration/comparison/incremental-1.png)

When creating the task, select **Detect Incremental Data** and set the detection interval (default: 15 minutes):

![Image Incremental 2](/img/reference/migration/comparison/incremental-2.png)

Once the task starts, it will continuously compare the incremental data between the source and target clusters. If you want to pause the data comparison, click the **Pause** button to pause the incremental task. After clicking **Resume**, the data written during the pause will be verified as usual:

![Image Incremental 3](/img/reference/migration/comparison/incremental-3.png)

## Start the Comparison Task

After successfully creating the comparison task, you will see the task list. You can select **Start** on the right-hand side to launch the newly created task:

![Image 8](/img/reference/migration/comparison/8.png)

Click the **Detail** button to view the detailed information about the task:

![Image 9](/img/reference/migration/comparison/9.png)

You can click the refresh button at the top right of the index

list to continuously update the progress information:

![Image 10](/img/reference/migration/comparison/10.png)

If the data comparison is successful, the corresponding partition block will be displayed in green; otherwise, it will be displayed in red:

![Image 11](/img/reference/migration/comparison/11.png)

If a block turns red during the comparison process, it indicates a failure. You can click on the **View Log** in the progress information of the task block to view the error log and locate the specific cause of the error.
