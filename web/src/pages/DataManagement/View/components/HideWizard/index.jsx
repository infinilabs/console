export default (props) => {

    const { visible, children } = props;

    return (
        <div style={visible ? {} : { height: 0, overflow: 'hidden'}}>
            {children}
        </div>
    )
}