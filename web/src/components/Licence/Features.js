import { Button, Icon, Descriptions, Result } from 'antd';
import styles from './Features.less';
import { LICENCE_ROUTES, FEATURES, checkLicenceType } from '.'
import { formatMessage } from "umi/locale";

export default ({ licence }) => {

    const { license_type, expire_at } = licence;

    return (
      <div className={styles.features}>
        <Descriptions title={formatMessage({ id: 'license.features.title' })} colon={false} column={4}>
          {
            FEATURES.map((item, index) => {
              const isAllowed = 
                checkLicenceType(license_type, expire_at) || 
                !item.route || 
                LICENCE_ROUTES.every((r) => !r.includes(item.route))
              return (
                <Descriptions.Item 
                  key={index}
                  className={`${styles.default} ${isAllowed ? styles.allow : ''}` }
                  label={''}
                >
                  <span className={styles.icon}></span>{item.name}
                </Descriptions.Item>
              )
            })
          }
          <Descriptions.Item 
                key={-1}
                className={styles.default}
                label={(
                  <span className={styles.icon}></span>
                )}
              >
                {formatMessage({ id: 'license.feature.more' })}···
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
}