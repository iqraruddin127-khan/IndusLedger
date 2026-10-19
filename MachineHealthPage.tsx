import { useCallback, useEffect, useRef, useState } from 'react';
import { Cpu, Activity, Gauge, Clock, Play, WifiOff, Loader2 } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { useWorkspaceData } from '@/lib/workspaceData';
import { demoMachines } from '@/data/demoData';

const API_BASE = 'https://soft-snakes-beg.loca.lt';

interface Prediction {
  status: string;
  failure_risk: number;
  remaining_useful_life: number;
}

const DEFAULTS = { vibration: 5.0, temperature: 70, hours: 5000 };

type ConnectionState = 'idle' | 'loading' | 'live' | 'offline';

// Local heuristic used when the FastAPI service is unreachable, so the widget
// stays functional. Higher vibration/temp and more hours → higher risk.
function localFallback(vibration: number, temperature: number, hours: number): Prediction {
  const risk = Math.min(
    98,
    Math.round(vibration * 3.2 + Math.max(0, temperature - 60) * 1.4 + (hours / 10000) * 12)
  );
  const rul = Math.max(1, Math.round(90 - risk * 0.85));
  const status = risk >= 70 ? 'Critical' : risk >= 40 ? 'At Risk' : 'Healthy';
  return { status, failure_risk: risk, remaining_useful_life: rul };
}

const statusBadge = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes('crit') || s.includes('fail')) return 'bg-danger-50 text-danger-300';
  if (s.includes('risk') || s.includes('warn')) return 'bg-warning-50 text-warning-300';
  if (s.includes('maint')) return 'bg-primary-50 text-primary-300';
  return 'bg-success-50 text-success-300';
};

const riskColor = (risk: number): string =>
  risk >= 70 ? '#ef4444' : risk >= 40 ? '#f97316' : '#22c55e';

export function MachineHealthPage() {
  const { data, logAction } = useWorkspaceData();
  const [inputs, setInputs] = useState(DEFAULTS);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('idle');
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const predict = useCallback(
    async (source: 'auto' | 'manual') => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 4000);
      setConnection('loading');

      try {
        const res = await fetch(`${API_BASE}/predict`, {
          method: 'POST',
          headers: { 'Bypass-Tunnel-Reminder': 'true', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vibration: inputs.vibration,
            temperature: inputs.temperature,
            operating_hours: inputs.hours,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as Partial<Prediction>;
        console.log('[predict] response:', body);
        if (
          typeof body.status !== 'string' ||
          typeof body.failure_risk !== 'number' ||
          typeof body.remaining_useful_life !== 'number'
        ) {
          throw new Error('Unexpected response shape');
        }
        setPrediction({
          status: body.status,
          failure_risk: body.failure_risk,
          remaining_useful_life: body.remaining_useful_life,
        });
        setConnection('live');
        if (source === 'manual') {
          logAction({ action: 'Ran live machine health prediction', resource: 'Machine Health', resourceId: 'predict', status: 'success' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[predict] failed:', err);
        setError(message);
        // Server offline, timed out, or returned malformed data — use local estimate
        setPrediction(localFallback(inputs.vibration, inputs.temperature, inputs.hours));
        setConnection('offline');
      } finally {
        window.clearTimeout(timeout);
        setRan(true);
      }
    },
    [inputs, logAction]
  );

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!ran) return;
    const t = window.setTimeout(() => predict('auto'), 500);
    return () => window.clearTimeout(t);
  }, [predict, ran]);

  const machines = demoMachines;

  const levers = [
    { key: 'vibration' as const, label: 'Vibration', min: 0, max: 20, step: 0.5, unit: 'mm/s', icon: Activity },
    { key: 'temperature' as const, label: 'Temperature', min: 30, max: 120, step: 1, unit: '°C', icon: Gauge },
    { key: 'hours' as const, label: 'Operating Hours', min: 0, max: 50000, step: 100, unit: 'h', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Cpu className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-ink-800">Machine Health AI</h1>
          <p className="text-sm text-ink-400">Predictive maintenance powered by your FastAPI model service</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Sensor inputs */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Sensor Inputs"
            subtitle="Adjust the readings and run a prediction"
            icon={<Activity className="h-5 w-5" />}
          />
          <div className="space-y-6 p-5">
            {levers.map((lever) => {
              const Icon = lever.icon;
              return (
                <div key={lever.key}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700">
                      <Icon className="h-3.5 w-3.5 text-ink-400" /> {lever.label}
                    </label>
                    <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-bold text-ink-700">
                      {inputs[lever.key]} {lever.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={lever.min}
                    max={lever.max}
                    step={lever.step}
                    value={inputs[lever.key]}
                    onChange={(e) => setInputs((s) => ({ ...s, [lever.key]: Number(e.target.value) }))}
                    className="mt-2 w-full accent-primary-600"
                  />
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => predict('manual')}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Play className="h-4 w-4" /> Run Prediction
            </button>
          </div>
        </Card>

        {/* Prediction result */}
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader
              title="Prediction Result"
              subtitle={
                connection === 'live'
                  ? 'Live from your FastAPI model service'
                  : connection === 'offline'
                    ? 'Model server unreachable — showing local estimate'
                    : 'Sensor readings feed the /predict endpoint'
              }
              icon={<Cpu className="h-5 w-5" />}
              demo
            />
            {connection === 'offline' && (
              <div className="mx-5 mb-2 flex items-start gap-2 rounded-lg border border-warning-500/40 bg-warning-50 px-3 py-2">
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-warning-300" />
                <div>
                  <p className="text-xs font-semibold text-warning-300">
                    Could not reach the model server — displaying an offline estimate so you can keep working.
                  </p>
                  {error && <p className="mt-1 text-xs text-warning-300/80">Error: {error}</p>}
                </div>
              </div>
            )}
            {!ran ? (
              <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
                <Cpu className="h-10 w-10 text-ink-200" />
                <p className="mt-3 text-sm text-ink-400">Set the sensor readings, then press Run Prediction.</p>
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-ink-100 p-4 sm:col-span-1">
                    <p className="text-xs font-medium text-ink-400">Status</p>
                    {connection === 'loading' ? (
                      <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary-500" />
                    ) : (
                      <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(prediction?.status ?? '')}`}>
                        {prediction?.status}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="text-xs font-medium text-ink-400">Failure Risk</p>
                    <p className="mt-1 font-display text-2xl font-bold" style={{ color: riskColor(prediction?.failure_risk ?? 0) }}>
                      {prediction?.failure_risk}%
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${prediction?.failure_risk ?? 0}%`, background: riskColor(prediction?.failure_risk ?? 0) }}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-ink-100 p-4">
                    <p className="text-xs font-medium text-ink-400">Remaining Useful Life</p>
                    <p className="mt-1 font-display text-2xl font-bold text-ink-800">{prediction?.remaining_useful_life}</p>
                    <p className="text-xs text-ink-400">days estimated</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {machines.length > 0 && (
            <Card>
              <CardHeader title="Fleet Reference" subtitle="Current health snapshot for comparison" icon={<Cpu className="h-5 w-5" />} demo />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-400">
                      <th className="px-4 py-3">Machine</th>
                      <th className="px-4 py-3">Health</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Temp</th>
                      <th className="hidden px-4 py-3 sm:table-cell">Vibration Proxy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machines.map((m, i) => (
                      <tr key={m.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-ink-700">{m.name}</p>
                          <p className="text-xs text-ink-400">{m.line}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
                              <div
                                className={`h-full rounded-full ${m.healthScore >= 80 ? 'bg-success-400' : m.healthScore >= 60 ? 'bg-warning-400' : 'bg-danger-500'}`}
                                style={{ width: `${m.healthScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-ink-600">{m.healthScore}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-ink-600 sm:table-cell">{m.temperatureC > 0 ? `${m.temperatureC}°C` : '—'}</td>
                        <td className="hidden px-4 py-3 text-sm text-ink-600 sm:table-cell">{m.torqueNm} Nm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
