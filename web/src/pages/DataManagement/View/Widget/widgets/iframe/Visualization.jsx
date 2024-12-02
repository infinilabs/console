import styles from './Visualization.less'

export default (props) => {

    const { record } = props;

    const { url } = record;

    return (
      <div className={styles.iframe}>
        <iframe 
          src={url}
          width="100%"
          height="100%"
        />
      </div>
    )
  }