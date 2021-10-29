import './cluster_card.scss';

import React from "react";

import {
    MiniArea, Pie
} from '@/components/Charts';

const ClusterCard = ()=>{

    const dataLine1 = [
        {
            x:"1991",
            y: 10
        },
        {
            x:"1992",
            y: 161
        },
        {
            x:"1993",
            y: 120
        },
        {
            x:"1994",
            y: 190
        },
        {
            x:"1995",
            y: 50
        },
        {
            x:"1996",
            y: 80
        },
        {
            x:"1997",
            y: 130
        },
        {
            x:"1998",
            y: 200
        },
        {
            x:"1999",
            y: 140
        },
        {
            x:"2000",
            y: 90
        },
        {
            x:"2001",
            y: 40
        },
        {
            x:"2002",
            y: 100
        },
        {
            x:"2003",
            y: 10
        }
    ];

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
                <span class="label font-bold">100.0%</span>
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
                    <div class="item pie1">
                        <Pie
                            animate={false}
                            color={'#a9b108'}
                            inner={0.55}
                            tooltip={false}
                            margin={[0, 0, 0, 0]}
                            percent={0.75 * 100}
                            height={80}
                            total={'75%'}
                        />
                    </div>
                    <div class="item pie2">
                        <Pie
                            animate={false}
                            color={'#a9b108'}
                            inner={0.55}
                            tooltip={false}
                            margin={[0, 0, 0, 0]}
                            percent={0.96 * 100}
                            height={80}
                            total={'96%'}
                        />
                    </div>
                </div>
                <div class="line-chart">
                    <div class="item line1">
                        <MiniArea color="#efe6e6" height={40} data={dataLine1} />
                        <div class="line-subtitle">200k search/s</div>
                    </div>
                    <div class="item line2">
                        <MiniArea color="#efe6e6" height={40} data={dataLine1} />
                        <div class="line-subtitle">200k indexing/s</div>
                    </div>
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