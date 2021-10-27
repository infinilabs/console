import './cluster_card.scss';

const ClusterCard = ()=>{
  return (
    <div class="cluster-item">
        <div class="cluster-name">
            <span>Cluster A</span>
        </div>
        <div class="cluster-info">
            <div class="info-top">
                <span class="text">Availability History(Last 7 Days)</span>
            </div>
            <div class="info-middle">
                <span class="label">100.0%</span>
                <span class="label label-primary">128 Nodes</span>
                <span class="label label-primary">1280 Shards</span>
            </div>
            <div class="info-bottom">
                <span class="status-block bg-green"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-yellow"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-yellow"></span>
                <span class="status-block bg-red"></span>
                <span class="status-block bg-red"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-yellow"></span>
                <span class="status-block bg-red"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-yellow"></span>
                <span class="status-block bg-red"></span>
                <span class="status-block bg-red"></span>
                <span class="status-block bg-green"></span>
                <span class="status-block bg-yellow"></span>
                <span class="status-block bg-red"></span>
            </div>
        </div>
        <div class="cluster-chart">
            <div class="chart-top">
                <div class="pie-chart">
                    <div class="item pie1"></div>
                    <div class="item pie2"></div>
                </div>
                <div class="line-chart">
                    <div class="item line1"></div>
                    <div class="item line2"></div>
                </div>
            </div>
            <div class="chart-bottom">
                <span class="label label-primary">100TB</span>
                <span class="label label-primary">Dev</span>
                <span class="label label-primary">7.6.1</span>
                <span class="label label-primary">8 Nodes</span>
            </div>
        </div>
    </div>
  )
}

export default ClusterCard;