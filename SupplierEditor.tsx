import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useWorkspaceData } from '@/lib/workspaceData';
import type { SupplierRecord } from '@/types';

// Self-contained trigger + modal pair. Render one with no supplier for "Add",
// or one per row with that supplier for "Edit". Each manages its own state.
export function SupplierEditorButton({ supplier, label }: { supplier?: SupplierRecord; label?: string }) {
  const { can, upsertSupplier, logAction } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<SupplierRecord>>({});

  const handleClick = () => {
    if (!can('suppliers.edit')) {
      logAction({
        action: `${supplier ? 'Edit' : 'Add'} supplier — denied (insufficient role)`,
        resource: 'Supplier',
        resourceId: supplier?.id ?? 'new',
        status: 'failed',
      });
      return;
    }
    setForm(supplier ?? { name: '', category: 'Raw Materials', onTimeRate: 80, qualityScore: 80, avgPriceInr: 0, totalOrders: 0, activeOrders: 0, paymentTerms: 'Net 30' });
    setOpen(true);
  };

  const save = () => {
    if (!form.name) return;
    const onTime = Math.min(100, Math.max(0, Number(form.onTimeRate) || 0));
    const record: SupplierRecord = {
      id: form.id ?? `S-${Date.now()}`,
      name: form.name,
      category: form.category ?? 'Raw Materials',
      onTimeRate: onTime,
      qualityScore: Math.min(100, Math.max(0, Number(form.qualityScore) || 0)),
      avgPriceInr: Number(form.avgPriceInr) || 0,
      totalOrders: Number(form.totalOrders) || 0,
      activeOrders: Number(form.activeOrders) || 0,
      reliability: onTime >= 85 ? 'high' : onTime >= 70 ? 'medium' : 'low',
      paymentTerms: form.paymentTerms ?? 'Net 30',
    };
    upsertSupplier(record);
    logAction({
      action: supplier ? 'Updated supplier' : 'Added supplier',
      resource: 'Supplier',
      resourceId: record.id,
      status: 'success',
    });
    setOpen(false);
  };

  const canEdit = can('suppliers.edit');

  return (
    <>
      {label ? (
        <button type="button" onClick={handleClick} title={canEdit ? label : 'Requires Admin or Owner role'} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-700">
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title={canEdit ? 'Edit supplier' : 'Requires Admin or Owner role — attempt is logged'}
          className={`rounded p-1 transition ${canEdit ? 'text-slate-400 hover:bg-primary-500/15 hover:text-primary-300' : 'text-slate-500 hover:bg-danger-500/15 hover:text-danger-400'}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      <Modal
        open={open}
        title={supplier ? 'Edit Supplier' : 'Add Supplier'}
        subtitle="On-time rate drives the reliability rating; prices recalculate comparisons instantly."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="button" onClick={save} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">Save Supplier</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ['Supplier name', 'name', 'text'],
            ['Category', 'category', 'text'],
            ['On-time delivery rate (%)', 'onTimeRate', 'number'],
            ['Quality score (0–100)', 'qualityScore', 'number'],
            ['Average price (₹)', 'avgPriceInr', 'number'],
            ['Active orders', 'activeOrders', 'number'],
            ['Payment terms', 'paymentTerms', 'text'],
          ] as const).map(([labelText, key, type]) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400">{labelText}</label>
              <input
                type={type}
                value={String(form[key] ?? '')}
                onChange={(e) => setForm((f) => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                className="mt-1 h-10 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
