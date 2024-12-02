import { Descriptions, Icon, Typography } from "antd";
import moment from "moment";
import styles from "./Version.less";
import { DATE_FORMAT } from ".";
import { formatMessage } from "umi/locale";
import AGPL from "./AGPL";
const { Paragraph, Text } = Typography;

export default ({ application, licence }) => {
  const { number, build_date, build_hash } = application?.version || {};

  return (
    <div className={styles.version}>
      <div className={styles.header}>
        <Descriptions size="small" title={`${APP_DOMAIN} Console`} column={1}>
          <Descriptions.Item
            label={formatMessage({ id: "license.label.version" })}
          >
            {number}
          </Descriptions.Item>
          <Descriptions.Item
            label={formatMessage({ id: "license.label.build_time" })}
          >
            {moment(build_date).format(DATE_FORMAT)}
          </Descriptions.Item>
          <Descriptions.Item label="Hash">{build_hash}</Descriptions.Item>
        </Descriptions>
      </div>
      <div style={{ margin: '10px 0', height: 217, overflow: 'hidden' }}>
        <Icon style={{ transform: 'scale(0.6)', position: 'relative', top: -70, left: -172 }} component={AGPL}/>
      </div>
      <div className={styles.licence}>
        <Paragraph>
          Copyright (C) INFINI Labs & INFINI LIMITED.
        </Paragraph>
        <Paragraph>The INFINI Console is offered under the GNU Affero General Public License v3.0 and as commercial software.</Paragraph>
        <Paragraph>
          For commercial licensing, contact us at:
          <ul>
            <li>Email: hello@infini.ltd</li>
            <li>Website: <a href="http://www.infinilabs.com" target="_blank">infinilabs.com</a></li>
          </ul>
        </Paragraph>
        <Paragraph>
          Open Source licensed under AGPL V3:
          <br />
          This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
        </Paragraph>
        <Paragraph>This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.</Paragraph>
        <Paragraph>{`You should have received a copy of the GNU Affero General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.`}</Paragraph>
      </div>
    </div>
  );
};
