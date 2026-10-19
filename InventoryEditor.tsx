import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useWorkspaceData } from '@/lib/workspaceData';
import type { InventoryItem } from '@/types';

// Self-contained trigger + modal pair, mirroring SupplierEditorButton: render one
// with no item for "Add", or one per row with that item for "Edit".
export function InventoryEditorButton({ item, label }: { item?: InventoryItem; label?: string }) {
  const { can, upsertInventoryItem, logAction } = useWorkspaceData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<InventoryItem>>({});

  const handleClick = () => {
    if (!can('inventory.edit')) {
      logAction({
        action: `${item ? 'Edit' : 'Add'} inventory item — denied (insufficient role)`,
        resource: 'Inventory',
        resourceId: item?.id ?? 'new',
        status: 'failed',
      });
      return;
    }
    setForm(item ?? { name: '', category: 'Raw Materials', unit: 'units', stock: 0, reorderPoint: 0, avgDailyUsage: 0, unitCostInr: 0, supplier: 'Unassigned', status: 'in-stock' });
    setOpen(true);
  };

  const save = () => {
    if (!form.name) return;
    const stock = Math.max(0, Number(form.stock) || 0);
    const reorderPoint = Math.max(0, Number(form.reorderPoint) || 0);
    const record: InventoryItem = {
      id: form.id ?? `I-${Date.now()}`,
      name: form.name,
      category: form.category ?? 'Raw Materials',
      unit: form.unit ?? 'units',
      stock,
      reorderPoint,
      avgDailyUsage: Math.max(0, Number(form.avgDailyUsage) || 0),
      unitCostInr: Math.max(0, Number(form.unitCostInr) || 0),
      supplier: form.supplier ?? 'Unassigned',
      status: stock === 0 ? 'out-of-stock' : stock <= reorderPoint ? 'low-stock' : 'in-stock',
    };
    upsertInventoryItem(record);
    logAction({
      action: item ? 'Updated inventory item' : 'Added inventory item',
      resource: 'Inventory',
      resourceId: record.id,
      status: 'success',
    });
    setOpen(false);
  };

  const canEdit = can('inventory.edit');

  return (
    <>
      {label ? (
        <button type="button" onClick={handleClick} title={canEdit ? label : 'Requires Operator, Admin or Owner role'} className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-primary-700">
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          title={canEdit ? 'Edit item' : 'Requires Operator, Admin or Owner role — attempt is logged'}
          className={`rounded p-1 transition ${canEdit ? 'text-slate-400 hover:bg-primary-500/15 hover:text-primary-300' : 'text-slate-500 hover:bg-danger-500/15 hover:text-danger-400'}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      <Modal
        open={open}
        title={item ? 'Edit Inventory Item' : 'Add Inventory Item'}
        subtitle="Stock status is derived from the level you set — charts and alerts update instantly."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="button" onClick={save} disabled={!form.name} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">Save Item</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ['Item name', 'name', 'text'],
            ['Category', 'category', 'text'],
            ['Unit of measure', 'unit', 'text'],
            ['Stock level', 'stock', 'number'],
            ['Reorder point', 'reorderPoint', 'number'],
            ['Daily usage', 'avgDailyUsage', 'number'],
            ['Unit price (₹)', 'unitCostInr', 'number'],
            ['Supplier', 'supplier', 'text'],
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
