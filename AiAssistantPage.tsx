import { useState } from 'react';
import { Bot, Send, Sparkles, Zap, Package, Wallet, Truck, Leaf } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { useWorkspaceData } from '@/lib/workspaceData';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  { icon: Zap, text: 'How can I lower my energy bill?' },
  { icon: Package, text: 'Which inventory items should I reorder first?' },
  { icon: Wallet, text: 'Summarize my profit position' },
  { icon: Truck, text: 'Which suppliers are risky?' },
  { icon: Leaf, text: 'What is my carbon footprint trend?' },
];

export function AiAssistantPage() {
  const { kpis, data } = useWorkspaceData();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: "Hello! I'm your IndusLedger business assistant. I analyze your live workspace data — energy, inventory, suppliers, finance, and carbon — and answer with specific figures. Ask me anything, or try a suggestion below.",
    },
  ]);

  const answer = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('energy') || q.includes('power') || q.includes('electric')) {
      return `Your daily energy spend is ₹${kpis.energyDailyCost.toLocaleString()} (₹${kpis.energyCostPerHour.toLocaleString()}/hour). Peak-hour use is the biggest lever: shifting 30% of the 09:00–18:00 load to off-peak would save about ₹${kpis.potentialSavingsInr.toLocaleString()}/day — roughly ₹${(kpis.potentialSavingsInr * 30).toLocaleString()}/month. Batch mixing and compressed-air charging are the easiest candidates (see the Energy Optimization module for the ranked list).`;
    }
    if (q.includes('inventory') || q.includes('stock') || q.includes('reorder')) {
      const critical = data.inventory.filter((i) => i.status === 'out-of-stock' || i.stock <= i.reorderPoint).slice(0, 3);
      return `Inventory is worth ₹${Math.round(kpis.inventoryValue / 1000)}k. ${kpis.shortfalls} item(s) are at or below their reorder point${critical.length > 0 ? `, most urgently: ${critical.map((i) => `${i.name} (${i.stock} ${i.unit} left, usage ${i.avgDailyUsage}/day → ~${Math.max(0, Math.floor(i.stock / i.avgDailyUsage))} days cover)`)}` : ''}. Consolidating these into one PO reduces freight and may hit supplier free-shipping thresholds.`;
    }
    if (q.includes('profit') || q.includes('finance') || q.includes('margin') || q.includes('cash')) {
      return `You're at ₹${(kpis.netProfit / 100000).toFixed(1)}L net profit on ₹${(kpis.totalIncome / 100000).toFixed(1)}L revenue — a ${kpis.profitMargin}% margin. Watch-outs: ${kpis.overdueInvoices} overdue invoice(s) worth ₹${Math.round(kpis.overdueInvoiceValue / 1000)}k. Collecting those would materially improve working capital. Energy is ${Math.round((kpis.energyDailyCost * 30 / Math.max(1, kpis.totalExpense)) * 100)}% of expense — the second-largest controllable cost after materials.`;
    }
    if (q.includes('supplier') || q.includes('vendor') || q.includes('risk')) {
      const risky = data.suppliers.filter((s) => s.reliability === 'low' || s.onTimeRate < 70);
      const best = [...data.suppliers].sort((a, b) => b.onTimeRate - a.onTimeRate)[0];
      return `${risky.length > 0 ? `${risky.length} supplier(s) carry high delay risk: ${risky.map((s) => `${s.name} (${s.onTimeRate}% on-time)`).join(', ')}. Consider dual-sourcing their materials.` : 'No suppliers are currently flagged high-risk.'} Your most reliable partner is ${best.name} at ${best.onTimeRate}% on-time and ${best.qualityScore}/100 quality — a good benchmark when negotiating.`;
    }
    if (q.includes('carbon') || q.includes('emission') || q.includes('co2')) {
      return `Your estimated footprint is ${kpis.carbonDailyTons} tons CO₂/day, based on a ${data.mode === 'demo' ? '0.71' : data.baselines.gridEmissionFactor} kg CO₂/kWh grid factor. Grid electricity dominates the mix; the diesel generator is your highest-intensity source per kWh. Cutting peak-hour generation and shifting to off-peak grid power reduces both cost and carbon simultaneously. A downloadable compliance CSV is in the Energy & Carbon Ledger module.`;
    }
    if (q.includes('alert') || q.includes('urgent') || q.includes('risk')) {
      const items: string[] = [];
      if (kpis.outOfStockCount > 0) items.push(`${kpis.outOfStockCount} out-of-stock item(s)`);
      if (kpis.overdueInvoices > 0) items.push(`${kpis.overdueInvoices} overdue invoice(s)`);
      if (kpis.energySpikeKwh > 0) items.push(`a ${kpis.energySpikeKwh} kWh peak-hour energy spike`);
      if (kpis.highRiskSuppliers > 0) items.push(`${kpis.highRiskSuppliers} high-risk supplier(s)`);
      return items.length > 0 ? `Top priorities right now: ${items.join('; ')}. Each is flagged with a banner on the Dashboard.` : 'Nothing urgent — all monitored signals are within normal ranges.';
    }
    return `Here's your current snapshot: ₹${(kpis.netProfit / 100000).toFixed(1)}L net profit (${kpis.profitMargin}% margin), ₹${kpis.energyDailyCost.toLocaleString()}/day energy cost, ₹${Math.round(kpis.inventoryValue / 1000)}k inventory with ${kpis.shortfalls} reorder flag(s), ${kpis.avgOnTimeRate}% average supplier on-time rate, and ${kpis.carbonDailyTons} t CO₂/day. Ask about any area — energy, inventory, suppliers, finance, or carbon — for a deeper answer.`;
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now(), role: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, role: 'assistant', text: answer(trimmed) }]);
    }, 450);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">AI Business Assistant</h1>
          <p className="text-sm text-ink-400">Ask questions about your live workspace data — answers use real module figures</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col lg:col-span-2">
          <CardHeader title="Conversation" subtitle="Analysis grounded in your current dataset" icon={<Sparkles className="h-5 w-5" />} />
          <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: '440px' }}>
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600'}`}>
                  {message.role === 'user' ? <span className="text-xs font-bold">You</span> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'rounded-tr-sm bg-primary-600 text-white' : 'rounded-tl-sm bg-ink-50 text-ink-700'}`}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-ink-100 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(input); }}
                placeholder="Ask about energy, inventory, suppliers, finance, or carbon…"
                className="h-11 flex-1 rounded-xl border border-ink-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-ink-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              <button
                type="button"
                onClick={() => send(input)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Suggested Questions" subtitle="Tap to ask instantly" icon={<Sparkles className="h-5 w-5" />} />
            <div className="space-y-2 p-4">
              {SUGGESTIONS.map((suggestion) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => send(suggestion.text)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-ink-100 px-3.5 py-2.5 text-left text-sm text-ink-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    <Icon className="h-4 w-4 flex-shrink-0 text-primary-500" />
                    {suggestion.text}
                  </button>
                );
              })}
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs leading-relaxed text-ink-400">
              The assistant reads the same workspace dataset as every module, so answers always reflect your current
              data mode (demo, custom, or IoT). Figures are estimates — verify before financial decisions.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
