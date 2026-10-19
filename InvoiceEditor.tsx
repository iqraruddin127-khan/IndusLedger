import { useState } from 'react';
import { Plus, CheckCircle2, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useWorkspaceData } from '@/lib/workspaceData';
import type { InvoiceRecord } from '@/types';

// Trigger + modal pair for adding an invoice, or marking an existing one paid/pending.
export function InvoiceEditorButton({ invoice, mode = 'add' }: { invoice?: InvoiceRecord; mode?: 'add' | 'toggle' }) {
  const { can, upsertInvoice, logAction } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<InvoiceRecord>>({});

  const canEdit = can('finance.edit');

  const handleClick = () => {
    if (!canEdit) {
      logAction({
        action: `${mode === 'add' ? 'Add invoice' : 'Update invoice status'} — denied (insufficient role)`,
        resource: 'Finance',
        resourceId: invoice?.id ?? 'new',
        status: 'failed',
      });
      return;
    }
    if (mode === 'toggle' && invoice) {
      const nextStatus: InvoiceRecord['status'] = invoice.status === 'paid' ? 'pending' : 'paid';
      upsertInvoice({ ...invoice, status: nextStatus });
      logAction({ action: `Marked invoice ${nextStatus}`, resource: 'Finance', resourceId: invoice.invoiceNo, status: 'success' });
      return;
    }
    setForm({ invoiceNo: `INV-2026-${String(Date.now()).slice(-5)}`, client: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '', amountInr: 0, status: 'pending' });
    setOpen(true);
  };

  const save = () => {
    if (!form.client || !form.amountInr) return;
    const record: InvoiceRecord = {
      id: form.id ?? `INV-${Date.now()}`,
      invoiceNo: form.invoiceNo ?? `INV-2026-${String(Date.now()).slice(-5)}`,
      client: form.client,
      issueDate: form.issueDate ?? new Date().toISOString().slice(0, 10),
      dueDate: form.dueDate ?? new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      amountInr: Number(form.amountInr) || 0,
      status: form.status ?? 'pending',
    };
    upsertInvoice(record);
    logAction({ action: 'Added invoice', resource: 'Finance', resourceId: record.invoiceNo, status: 'success' });
    setOpen(false);
  };

  if (mode === 'toggle' && invoice) {
    const isPaid = invoice.status === 'paid';
    return (
      <button
        type="button"
        onClick={handleClick}
        title={canEdit ? (isPaid ? 'Mark as Pending' : 'Mark as Paid') : 'Requires Admin or Owner role — attempt is logged'}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
          isPaid ? 'bg-slate-700 text-slate-300 hover:bg-warning-500/15 hover:text-warning-300' : 'bg-success-500/15 text-success-300 hover:bg-success-500/25'
        }`}
      >
        {isPaid ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
        {isPaid ? 'Pending' : 'Mark Paid'}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={canEdit ? 'Add invoice' : 'Requires Admin or Owner role — attempt is logged'}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
      >
        <Plus className="h-3.5 w-3.5" /> Add Invoice
      </button>
      <Modal
        open={open}
        title="Add Invoice"
        subtitle="New invoices appear in the Finance module and update outstanding totals immediately."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="button" onClick={save} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Save Invoice</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ['Client name', 'client', 'text'],
            ['Amount (₹)', 'amountInr', 'number'],
            ['Issue date', 'issueDate', 'date'],
            ['Due date', 'dueDate', 'date'],
          ] as const).map(([label, key, type]) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400">{label}</label>
              <input
                type={type}
                value={String(form[key] ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-400">Status</label>
            <select
              value={form.status ?? 'pending'}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InvoiceRecord['status'] }))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-primary-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Modal>
    </>
  );
}
