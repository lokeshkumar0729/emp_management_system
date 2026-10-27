import { useState } from 'react'
import { api } from '../../api/client'
import { useToast } from '../../context/toast-context'
import { PRIORITY_OPTIONS } from '../../lib/constants'
import { todayIso } from '../../lib/format'
import Field from '../../components/ui/Field'
import Modal from '../../components/ui/Modal'
import { inputClass, primaryButton, secondaryButton } from '../../components/ui/styles'

export default function TaskFormModal({ task, employees, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(task)
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    category: task?.category ?? '',
    assigneeId: task ? String(task.assigneeId) : '',
    priority: task?.priority ?? 'MEDIUM',
    startDate: task?.startDate ?? '',
    dueDate: task?.dueDate ?? '',
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const reassignLocked = editing && task.status !== 'PENDING'
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const found = {}
    if (!form.title.trim()) found.title = 'Title is required'
    if (!form.assigneeId) found.assigneeId = 'Choose who this task is assigned to'
    if (!form.dueDate) found.dueDate = 'Due date is required'
    else if (!editing && form.dueDate < todayIso()) found.dueDate = 'Due date cannot be in the past'
    else if (form.startDate && form.dueDate < form.startDate) found.dueDate = 'Due date cannot be before the start date'
    return found
  }

  const submit = async (e) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      assigneeId: Number(form.assigneeId),
      priority: form.priority,
      startDate: form.startDate || null,
      dueDate: form.dueDate,
    }
    setBusy(true)
    try {
      if (editing) await api.tasks.update(task.id, body)
      else await api.tasks.create(body)
      toast.success(editing ? 'Task updated' : 'Task created')
      onSaved()
    } catch (err) {
      if (Object.keys(err.fieldErrors ?? {}).length) setErrors(err.fieldErrors)
      else toast.error(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit task' : 'New task'}
      onClose={onClose}
      size="max-w-2xl"
      footer={
        <>
          <button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="task-form" className={primaryButton} disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={errors.title} className="sm:col-span-2">
          <input id="title" autoFocus className={inputClass} value={form.title} onChange={set('title')} maxLength={150} aria-invalid={Boolean(errors.title)} />
        </Field>

        <Field
          label="Assign to"
          htmlFor="assigneeId"
          error={errors.assigneeId}
          hint={reassignLocked ? 'Only tasks awaiting a response can be reassigned.' : undefined}
        >
          <select id="assigneeId" className={inputClass} value={form.assigneeId} onChange={set('assigneeId')} disabled={reassignLocked}>
            <option value="">Select an employee</option>
            {(employees ?? []).map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority" htmlFor="priority" error={errors.priority}>
          <select id="priority" className={inputClass} value={form.priority} onChange={set('priority')}>
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Start date (optional)" htmlFor="startDate" error={errors.startDate}>
          <input id="startDate" type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} />
        </Field>

        <Field label="Due date" htmlFor="dueDate" error={errors.dueDate}>
          <input id="dueDate" type="date" className={inputClass} value={form.dueDate} onChange={set('dueDate')} min={editing ? undefined : todayIso()} aria-invalid={Boolean(errors.dueDate)} />
        </Field>

        <Field label="Category (optional)" htmlFor="category" error={errors.category} className="sm:col-span-2">
          <input id="category" className={inputClass} value={form.category} onChange={set('category')} maxLength={60} placeholder="e.g. Frontend, QA, HR" />
        </Field>

        <Field label="Description (optional)" htmlFor="description" error={errors.description} className="sm:col-span-2">
          <textarea id="description" rows={4} className={`${inputClass} resize-none`} value={form.description} onChange={set('description')} maxLength={2000} />
        </Field>
      </form>
    </Modal>
  )
}
