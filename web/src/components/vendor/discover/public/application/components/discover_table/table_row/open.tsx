import { EuiIcon } from "@elastic/eui";

interface Props {
  open: boolean;
  onClick: ()=>void;
}


export function Open({open, onClick}: Props) {
  return (
    <td
      onClick={onClick}
      data-test-subj="docTableExpandToggleColumn"
      className="kbnDocTableCell__toggleDetails"
    >
      <button
        className={open ? "euiButtonIcon euiButtonIcon--text": "euiButtonIcon euiButtonIcon--text euiButtonIcon--empty"}
        aria-expanded={!!open}
        aria-label="Toggle row details"
      >
        {open ? (
          <EuiIcon type="arrowDown" size="s" />
        ) : (
          <EuiIcon type="arrowRight" size="s" />
        )}
      </button>
    </td>
  );
};
