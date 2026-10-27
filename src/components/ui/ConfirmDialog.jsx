import Modal from './Modal'
import { dangerButton, secondaryButton } from './styles'

export default function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={busy ? () => {} : onCancel}
      size="max-w-md"
      footer={
        <>
          <button className={secondaryButton} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={dangerButton} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  )
}
