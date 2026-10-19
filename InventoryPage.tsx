import { Package, AlertTriangle, PackageX, Clock, TrendingUp, ArrowDownToLine, ArrowUpFromLine, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { BarChart } from '@/components/charts/BarChart';
import { useWorkspaceData } from '@/lib/workspaceData';
import { InventoryEditorButton } from '@/components/editors/InventoryEditor';
import type { InventoryItem, MaterialRequirement } from '@/types';

// Shortfalls recomputed live: required quantities are fixed by the production
// plan; availability tracks current stock, so imports and edits flow through.
function deriveMaterialRequirements(inventory: InventoryItem[]): MaterialRequirement[] {
  const plan: { material: string; requiredQty: number; productionLine: string; dueDate: string }[] = [
    { material: 'Steel Sheets (2mm)', requiredQty: 500, productionLine: 'Line 2 — Stamping', dueDate: '2026-10-20' },
    { material: 'Aluminium Ingots', requiredQty: 1200, productionLine: 'Line 1 — Machining', dueDate: '2026-10-22' },
    { material: 'Copper Wire (4mm)', requiredQty: 300, productionLine: 'Line 3 — Welding', dueDate: '2026-10-19' },
  ];
  return plan.map((req, i) => {
    const item = inventory.find((inv) => inv.name === req.material);
    const availableQty = item?.stock ?? 0;
    return {
      id: `MR-${String(i + 1).padStart(3, '0')}`,
      ...req,
      availableQty,
      shortfall: Math.max(0, req.requiredQty - availableQty),
    };
  });
}

const statusConfig: Record<InventoryItem['status'], { label: string; badge: string; dot: string }> = {
  'in-stock': { label: 'In Stock', badge: 'bg-success-50 text-success-700', dot: 'bg-success-400' },
  'low-stock': { label: 'Low Stock', badge: 'bg-warning-50 text-warning-700', dot: 'bg-warning-400' },
  'out-of-stock': { label: 'Out of Stock', badge: 'bg-danger-50 text-danger-700', dot: 'bg-danger-500' },
  overstock: { label: 'Overstock', badge: 'bg-ink-100 text-ink-600', dot: 'bg-ink-400' },
};

export function InventoryPage() {
  const { data } = useWorkspaceData();
  const demoInventory = data.inventory;
  const demoMaterialRequirements = deriveMaterialRequirements(demoInventory);
  const demoInventoryMovements = data.movements;

  const totalItems = demoInventory.length;
  const lowStock = demoInventory.filter((i) => i.status === 'low-stock').length;
  const outStock = demoInventory.filter((i) => i.status === 'out-of-stock').length;
  const totalValue = demoInventory.reduce((s, i) => s + i.stock * i.unitCostInr, 0);
  const shortfalls = demoMaterialRequirements.filter((r) => r.shortfall > 0).length;

  const stockBarData = demoInventory.map((i) => ({
    label: i.name.split(' ')[0].slice(0, 8),
    value: i.stock,
    color: i.status === 'out-of-stock' ? '#ef4444' : i.status === 'low-stock' ? '#f97316' : i.status === 'overstock' ? '#64748b' : '#22c55e',
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Inventory Tracking</h1>
          <p className="text-sm text-ink-400">Stock levels, low-stock alerts, and material requirements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Items', value: `${totalItems}`, unit: 'SKUs tracked', icon: Package, color: 'bg-primary-50 text-primary-600' },
          { label: 'Low Stock', value: `${lowStock}`, unit: 'items', icon: AlertTriangle, color: 'bg-warning-50 text-warning-600' },
          { label: 'Out of Stock', value: `${outStock}`, unit: 'items', icon: PackageX, color: 'bg-danger-50 text-danger-600' },
          { label: 'Inventory Value', value: `₹${(totalValue / 1000).toFixed(0)}k`, unit: 'total stock', icon: TrendingUp, color: 'bg-success-50 text-success-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} hover className="p-5 animate-fade-in-up" >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-xs font-medium text-ink-400">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-2xl font-bold text-ink-800">{stat.value}</span>
                <span className="text-xs text-ink-400">{stat.unit}</span>
              </div>
              <div style={{ animationDelay: `${i * 0.05}s` }} />
            </Card>
          );
        })}
      </div>

      {/* Stock chart */}
      <Card>
        <CardHeader title="Stock Levels by Item" subtitle="Current quantity on hand — colored by status" icon={<Package className="h-5 w-5" />} demo />
        <div className="p-5">
          <BarChart data={stockBarData} height={220} unit="units" />
        </div>
      </Card>

      {/* Material requirements */}
      {shortfalls > 0 && (
        <Card className="border-warning-200">
          <CardHeader
            title="Material Shortfall Alert"
            subtitle={`${shortfalls} materials below required quantity for upcoming production`}
            icon={<AlertTriangle className="h-5 w-5" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-3">Material</th>
                  <th className="px-4 py-3">Required</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3">Shortfall</th>
                  <th className="hidden px-4 py-3 md:table-cell">Production Line</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {demoMaterialRequirements.filter((r) => r.shortfall > 0).map((req, i) => (
                  <tr key={req.id} className="border-b border-ink-50 hover:bg-warning-50/30 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{req.material}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{req.requiredQty}</td>
                    <td className="px-4 py-3 text-sm text-ink-600">{req.availableQty}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-danger-600">{req.shortfall}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">{req.productionLine}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 lg:table-cell">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-warning-500" />
                        {req.dueDate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Material movements */}
      <Card>
        <CardHeader
          title="Material Movements"
          subtitle="Recent receipts, issues, adjustments, and returns"
          icon={<ArrowDownToLine className="h-5 w-5" />}
          demo
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Movement</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="hidden px-4 py-3 sm:table-cell">Reference</th>
                <th className="hidden px-4 py-3 md:table-cell">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {demoInventoryMovements.map((movement, i) => {
                const movementConfig = {
                  received: { label: 'Received', color: 'text-success-600 bg-success-50', icon: ArrowDownToLine },
                  issued: { label: 'Issued', color: 'text-danger-600 bg-danger-50', icon: ArrowUpFromLine },
                  adjusted: { label: 'Adjusted', color: 'text-warning-700 bg-warning-50', icon: SlidersHorizontal },
                  returned: { label: 'Returned', color: 'text-primary-600 bg-primary-50', icon: RotateCcw },
                }[movement.type];
                const MovementIcon = movementConfig.icon;
                return (
                  <tr key={movement.id} className="border-b border-ink-50 transition-colors hover:bg-ink-50 animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-500">{movement.date}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{movement.item}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${movementConfig.color}`}><MovementIcon className="h-3 w-3" />{movementConfig.label}</span></td>
                    <td className="px-4 py-3 text-sm font-semibold text-ink-700">{movement.quantity.toLocaleString()}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 sm:table-cell">{movement.reference}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">{movement.by}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Full inventory table */}
      <Card>
        <CardHeader
          title="Full Inventory"
          subtitle="All tracked materials and spare parts"
          icon={<Package className="h-5 w-5" />}
          demo
          action={<InventoryEditorButton label="Add Item" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Stock</th>
                <th className="hidden px-4 py-3 sm:table-cell">Reorder Pt</th>
                <th className="hidden px-4 py-3 md:table-cell">Daily Usage</th>
                <th className="hidden px-4 py-3 lg:table-cell">Unit Cost</th>
                <th className="hidden px-4 py-3 lg:table-cell">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {demoInventory.map((item, i) => {
                const sc = statusConfig[item.status];
                const daysLeft = item.avgDailyUsage > 0 ? Math.floor(item.stock / item.avgDailyUsage) : Infinity;
                return (
                  <tr key={item.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${sc.dot} ${item.status === 'out-of-stock' ? '' : 'animate-pulse'}`} />
                        <div>
                          <p className="text-sm font-medium text-ink-700">{item.name}</p>
                          <p className="text-xs text-ink-400">{item.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink-500">{item.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-ink-700">{item.stock.toLocaleString()}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 sm:table-cell">{item.reorderPoint}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 md:table-cell">{item.avgDailyUsage}/day</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-600 lg:table-cell">₹{item.unitCostInr}</td>
                    <td className="hidden px-4 py-3 text-sm text-ink-500 lg:table-cell">{item.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sc.badge}`}>
                        {sc.label}
                      </span>
                      {daysLeft !== Infinity && daysLeft <= 3 && (
                        <p className="mt-0.5 text-xs text-danger-500">{daysLeft}d left</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <InventoryEditorButton item={item} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
