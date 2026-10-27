import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/toast-context'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { inputClass, primaryButton, secondaryButton } from '../../components/ui/styles'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function EmployeeFormModal({ employee, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(employee)
  const [form, setForm] = useState({
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    department: employee?.department ?? '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const found = {}
    if (!form.name.trim()) found.name = 'Name is required'
    if (!form.email.trim()) found.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(form.email.trim())) found.email = 'Enter a valid email address'
    if (!editing && !form.password) found.password = 'Set a password for the new employee'
    else if (form.password && (form.password.length < 8 || form.password.length > 72)) {
      found.password = 'Password must be 8 to 72 characters'
    }
    return found
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      ...(form.password ? { password: form.password } : {}),
    }
    setBusy(true)
    try {
      if (editing) await api.employees.update(employee.id, body)
      else await api.employees.create(body)
      toast.success(editing ? 'Employee updated' : 'Employee added')
      onSaved()
    } catch (err) {
      if (err.status === 409) setErrors({ email: err.message })
      else if (Object.keys(err.fieldErrors ?? {}).length) setErrors(err.fieldErrors)
      else toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit employee' : 'Add employee'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="employee-form" className={primaryButton} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
          </button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input id="name" autoFocus className={inputClass} value={form.name} onChange={set('name')} maxLength={100} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" className={inputClass} value={form.email} onChange={set('email')} maxLength={150} />
        </Field>
        <Field label="Department (optional)" htmlFor="department" error={errors.department}>
          <input id="department" className={inputClass} value={form.department} onChange={set('department')} maxLength={100} />
        </Field>
        <Field
          label={editing ? 'New password' : 'Password'}
          htmlFor="password"
          error={errors.password}
          hint={editing ? 'Leave blank to keep the current password.' : 'At least 8 characters.'}
        >
          <input id="password" type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={set('password')} maxLength={72} />
        </Field>
      </form>
    </Modal>
  )
}
