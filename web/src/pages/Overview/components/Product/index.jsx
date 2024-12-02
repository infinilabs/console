import { Card, Spin } from 'antd'
import styles from './index.less'
import { router } from "umi";
import { getLocale, formatMessage } from "umi/locale";
import { useEffect, useState } from 'react';
import request from '@/utils/request';
import CardMore from '../CardMore';

export default () => {

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true)
        fetch(`https://api.infini.cloud/updates/console.json`).then(function(response) {
            if(response.status === 200){
              return response.json();
            } else {
                return {}
            }
        }).then((data) => {
            const lang = getLocale();
            if (data?.latest_news) {
                setActivities(data?.latest_news[lang] || [])
            }
        }).finally(() => {
            setLoading(false)
        });
    };

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className={styles.product}>
            <div className={styles.title}>
                {formatMessage({ id: "overview.title.product_activities"})}
            </div>
            <Card className={styles.content} size="small">
                <CardMore linkTo="https://www.infinilabs.com/blog/" external={true}/>
                {
                  loading ?  <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}><Spin spinning={true} /></div> : (
                    activities.map((item, index) => (
                        <a key={index} onClick={() => window.open(item.link)} className={styles.item}>· {item.title}</a>
                    ))
                  )
                }
            </Card>
        </div>
    )
}