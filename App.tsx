
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Save, 
  Loader2,
  TrendingUp,
  BarChart3,
  Layers,
  CheckCircle2,
  PlusCircle,
  Trash2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Area, SRVSummary, SummaryObjective } from './types';

// --- Example Initial Data ---
const EXAMPLE_AREAS: Area[] = [
  { id: 'area-infra', name: 'Infraestructura y Cloud' },
  { id: 'area-dev', name: 'Desarrollo de Software' },
  { id: 'area-cyber', name: 'Ciberseguridad' },
  { id: 'area-ops', name: 'Operaciones TI' }
];

const INITIAL_MOCK: Record<string, SummaryObjective[]> = {
  'area-infra': [
    { id: 'obj-1', name: 'Disponibilidad de Servicios Críticos', annual_weight: 40.0, plan: Array(12).fill(99.9), exec: Array(12).fill(99.9), compliance: 100, status: 'green' },
    { id: 'obj-2', name: 'Resolución de Incidencias P1 < 4h', annual_weight: 30.0, plan: Array(12).fill(100.0), exec: [100, 95, 88, 92, 0, 0, 0, 0, 0, 0, 0, 0], compliance: 93.7, status: 'yellow' },
    { id: 'obj-3', name: 'Eficiencia Presupuestaria CAPEX', annual_weight: 30.0, plan: [50, 50, 85, 50, 50, 95, 50, 50, 85, 50, 70, 90], exec: [45, 48, 82, 40, 0, 0, 0, 0, 0, 0, 0, 0], compliance: 91.5, status: 'yellow' }
  ]
};

const formatValue = (val: number) => val.toFixed(1);

/**
 * REGLA DE NEGOCIO: 
 * "Logrado a la fecha" considera solo hasta el último mes con ejecución registrada (> 0).
 */
const calculateYTDCompliance = (plan: number[], exec: number[]): number => {
  let lastMonthIndex = -1;
  for (let i = 11; i >= 0; i--) {
    if (exec[i] > 0) {
      lastMonthIndex = i;
      break;
    }
  }

  if (lastMonthIndex === -1) return 0;

  let sumPlan = 0;
  let sumExec = 0;
  for (let i = 0; i <= lastMonthIndex; i++) {
    sumPlan += plan[i];
    sumExec += exec[i];
  }

  return sumPlan > 0 ? (sumExec / sumPlan) * 100 : 0;
};

const getStatus = (compliance: number): 'red' | 'yellow' | 'green' => {
  if (compliance >= 95) return 'green';
  if (compliance >= 85) return 'yellow';
  return 'red';
};

const StatusBadge = ({ status, compliance }: { status: string, compliance: number }) => {
  const styles = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    yellow: 'bg-[#D6B85C]/20 text-[#D6B85C] border-[#D6B85C]/40',
    red: 'bg-[#D3543A]/20 text-[#D3543A] border-[#D3543A]/40'
  };
  const currentStyle = styles[status as keyof typeof styles] || styles.red;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${currentStyle}`}>
      {formatValue(compliance)}% Logrado
    </span>
  );
};

const MonthInput = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
  <input
    type="number"
    step="0.1"
    value={value === 0 ? '' : value}
    placeholder="0.0"
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    className="w-full min-w-[70px] p-2 text-right bg-srv-navy/40 border border-srv-purple/30 rounded text-srv-light text-xs focus:ring-1 focus:ring-srv-cyan focus:border-srv-cyan outline-none transition-all placeholder:opacity-20"
  />
);

const PerformanceChart = ({ planData, execData, title }: { planData: number[], execData: number[], title?: string }) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const maxVal = Math.max(...planData, ...execData, 1) * 1.1;
  const height = 180;
  const width = 1000;
  const padding = 50;

  const getX = (i: number) => padding + (i * (width - padding * 2) / (months.length - 1));
  const getY = (v: number) => height - padding - (v / maxVal * (height - padding * 2));

  const planPath = planData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
  const lastExecIdx = execData.map((v, i) => v > 0 ? i : -1).reduce((a, b) => Math.max(a, b), -1);
  const execPath = execData.slice(0, lastExecIdx + 1).map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');

  return (
    <div className="w-full bg-srv-navy/40 p-6 rounded-3xl border border-srv-purple/20 backdrop-blur-sm mt-6">
      <div className="flex items-center justify-between mb-6 px-2">
        <h4 className="text-xs font-black uppercase tracking-widest text-srv-light/40 flex items-center gap-2">
          <Activity className="w-4 h-4 text-srv-cyan" /> {title || 'Comportamiento Anual'}
        </h4>
        <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border-t border-dashed border-srv-purple"></div>
            <span className="opacity-40">Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-srv-cyan shadow-[0_0_8px_rgba(25,227,207,0.3)]"></div>
            <span className="text-srv-cyan">Real</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {[0, 0.5, 1].map((p, i) => (
          <line key={i} x1={padding} y1={getY(maxVal * p)} x2={width - padding} y2={getY(maxVal * p)} stroke="#4B3F8F" strokeOpacity="0.05" />
        ))}
        <path d={planPath} fill="none" stroke="#4B3F8F" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
        <path d={execPath} fill="none" stroke="#19E3CF" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(25,227,207,0.3)]" strokeLinecap="round" strokeLinejoin="round" />
        {months.map((m, i) => (
          <g key={m}>
            <text x={getX(i)} y={height - 5} textAnchor="middle" fill="#E6E6F0" opacity="0.2" fontSize="9" fontWeight="900">{m}</text>
            {i <= lastExecIdx && (
              <circle cx={getX(i)} cy={getY(execData[i])} r="4" fill="#19E3CF" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

const Dashboard = () => {
  const [selectedArea, setSelectedArea] = useState('area-infra');
  const [selectedYear, setSelectedYear] = useState(2025);
  const [summary, setSummary] = useState<SRVSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      const objectives = INITIAL_MOCK[selectedArea] || [];
      const processed = objectives.map(obj => {
        const compliance = calculateYTDCompliance(obj.plan, obj.exec);
        return { ...obj, compliance, status: getStatus(compliance) };
      });
      setSummary({ objectives: JSON.parse(JSON.stringify(processed)) });
    } catch (e) {
      setSummary({ objectives: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdateWeight = (objId: string, weight: number) => {
    if (!summary) return;
    setSummary({
      ...summary,
      objectives: summary.objectives.map(o => o.id === objId ? { ...o, annual_weight: weight } : o)
    });
  };

  const handleUpdateName = (objId: string, name: string) => {
    if (!summary) return;
    setSummary({
      ...summary,
      objectives: summary.objectives.map(o => o.id === objId ? { ...o, name } : o)
    });
  };

  const handleUpdateMonthly = (objId: string, monthIndex: number, value: number, type: 'plan' | 'exec') => {
    if (!summary) return;
    setSummary({
      ...summary,
      objectives: summary.objectives.map(o => {
        if (o.id === objId) {
          const newData = [...o[type]];
          newData[monthIndex] = value;
          const currentPlan = type === 'plan' ? newData : o.plan;
          const currentExec = type === 'exec' ? newData : o.exec;
          const compliance = calculateYTDCompliance(currentPlan, currentExec);
          return { ...o, [type]: newData, compliance, status: getStatus(compliance) };
        }
        return o;
      })
    });
  };

  const handleAddObjective = () => {
    if (!summary) return;
    setSummary({
      ...summary,
      objectives: [...summary.objectives, {
        id: `new-${Date.now()}`,
        name: 'Nuevo Objetivo Estratégico',
        annual_weight: 0,
        plan: Array(12).fill(0),
        exec: Array(12).fill(0),
        compliance: 0,
        status: 'red'
      }]
    });
  };

  const handleDeleteObjective = (id: string) => {
    if (!summary) return;
    setSummary({ ...summary, objectives: summary.objectives.filter(o => o.id !== id) });
  };

  const handleSaveAll = async () => {
    if (!summary) return;
    const totalWeight = summary.objectives.reduce((sum, o) => sum + o.annual_weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      setErrorMsg(`Error: La ponderación total es ${totalWeight.toFixed(1)}%. Debe sumar exactamente 100.0%.`);
      return;
    }
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      alert("Configuración de objetivos guardada exitosamente.");
    } finally { setSaving(false); }
  };

  const globalScore = useMemo(() => {
    if (!summary) return 0;
    return summary.objectives.reduce((acc, obj) => acc + ((obj.annual_weight / 100) * obj.compliance), 0);
  }, [summary]);

  const totalWeight = summary?.objectives.reduce((s,o) => s + o.annual_weight, 0) || 0;

  return (
    <div className="relative z-10 px-6 py-12 md:px-[8%] md:py-20 max-w-[1600px] mx-auto space-y-16">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-srv-cyan font-black tracking-[0.4em] text-[10px] uppercase">
            <Layers className="w-4 h-4" />
            SRV Platform v2.8
          </div>
          <h1 className="hero-title text-5xl md:text-7xl font-bold tracking-tighter leading-none">
            Área de <span>Métricas TI</span>
          </h1>
          <p className="text-lg text-srv-light/60 font-light max-w-xl">
            Seguimiento YTD (Year-to-Date) de objetivos estratégicos por unidad operativa.
          </p>
        </div>
        <div className="bg-srv-purple/10 p-8 rounded-[35px] border border-srv-purple/20 backdrop-blur-xl shadow-2xl flex items-center gap-6">
          <div className="p-4 bg-srv-cyan/10 rounded-2xl shadow-inner"><TrendingUp className="text-srv-cyan w-10 h-10" /></div>
          <div>
            <p className="text-[9px] font-black text-srv-cyan uppercase tracking-widest mb-1 opacity-70">Sistema</p>
            <p className="text-2xl font-black text-white">Cloud Sync</p>
          </div>
        </div>
      </header>

      {/* Selectores */}
      <div className="bg-srv-navy/40 border border-srv-purple/20 p-8 rounded-[40px] backdrop-blur-3xl shadow-2xl flex flex-wrap items-end gap-8">
        <div className="flex-1 min-w-[250px] space-y-3">
          <label className="text-[9px] font-black text-srv-cyan tracking-[0.3em] uppercase">Unidad Organizativa</label>
          <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full p-4 bg-srv-navy/60 border border-srv-purple/30 rounded-2xl font-bold text-srv-light cursor-pointer outline-none focus:ring-1 focus:ring-srv-cyan">
            {EXAMPLE_AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-40 space-y-3">
          <label className="text-[9px] font-black text-srv-cyan tracking-[0.3em] uppercase">Ejercicio</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="w-full p-4 bg-srv-navy/60 border border-srv-purple/30 rounded-2xl font-bold text-srv-light cursor-pointer outline-none focus:ring-1 focus:ring-srv-cyan">
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={loadData} disabled={loading} className="h-[58px] px-10 bg-srv-cyan text-srv-navy font-black rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-srv-cyan/20">
          {loading ? 'Sincronizando...' : 'Refrescar Tablero'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-srv-orange/10 border border-srv-orange/30 p-6 rounded-3xl flex items-center gap-4 text-srv-orange font-black text-sm animate-pulse">
          <AlertCircle className="w-5 h-5" /> {errorMsg}
        </div>
      )}

      {summary && (
        <>
          {/* Panel de Configuración de Objetivos */}
          <section className="bg-srv-navy/60 border border-srv-purple/30 rounded-[45px] overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="p-10 bg-srv-purple/10 border-b border-srv-purple/20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <BarChart3 className="text-srv-cyan w-8 h-8" />
                <h2 className="text-2xl font-black uppercase tracking-tight">Panel de Control de Metas</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={handleAddObjective} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 px-6 py-3 bg-srv-purple/30 border border-srv-purple/30 rounded-xl hover:bg-srv-purple/50 transition-all">
                  <PlusCircle className="w-4 h-4 text-srv-cyan" /> Añadir Meta
                </button>
                <button onClick={handleSaveAll} disabled={saving} className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 px-8 py-3 bg-srv-cyan text-srv-navy rounded-xl shadow-lg shadow-srv-cyan/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar Plan
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-registros">
                <thead>
                  <tr>
                    <th className="text-left min-w-[320px]">Objetivo Operativo</th>
                    <th className="text-right w-36">% Peso Anual</th>
                    <th className="text-right w-48">% Logrado YTD</th>
                    <th className="text-right w-48">% Anual Cumplido</th>
                    <th className="w-24">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.objectives.map((obj) => (
                    <tr key={obj.id} className="group">
                      <td className="text-left font-bold group-hover:text-srv-cyan transition-colors">
                        <input type="text" value={obj.name} onChange={(e) => handleUpdateName(obj.id, e.target.value)} className="w-full bg-transparent border-none outline-none focus:text-srv-cyan" />
                      </td>
                      <td className="text-right">
                        <input type="number" step="0.1" value={obj.annual_weight} onChange={(e) => handleUpdateWeight(obj.id, parseFloat(e.target.value) || 0)} className="w-20 p-2 bg-srv-navy/40 border border-srv-purple/20 rounded-xl text-right font-black focus:ring-1 focus:ring-srv-cyan outline-none" />
                      </td>
                      <td className="text-right font-bold text-srv-yellow">{formatValue(obj.compliance)}%</td>
                      <td className="text-right font-black text-srv-cyan text-lg">
                        {formatValue((obj.annual_weight / 100) * obj.compliance)}%
                      </td>
                      <td>
                        <button onClick={() => handleDeleteObjective(obj.id)} className="p-3 text-srv-orange hover:bg-srv-orange/10 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                      </td>
                    </tr>
                  ))}
                  <tr className={Math.abs(totalWeight - 100) < 0.01 ? 'bg-srv-cyan/90 text-srv-navy' : 'bg-srv-orange text-white'}>
                    <td className="text-right font-black uppercase tracking-widest text-[10px] py-6 border-none">Suma Ponderación Estratégica</td>
                    <td className="text-right font-black text-xl py-6 border-none">{formatValue(totalWeight)}%</td>
                    <td className="border-none" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Paneles de Entrada Mensual con Gráficos Individuales */}
          <div className="space-y-12">
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-srv-cyan border-l-[6px] border-srv-cyan pl-8">Registro de Avance por Objetivo</h2>
            <div className="grid grid-cols-1 gap-12">
              {summary.objectives.map((obj) => (
                <div key={obj.id} className="bg-srv-navy/80 border border-srv-purple/20 rounded-[45px] overflow-hidden shadow-2xl group hover:border-srv-purple/40 transition-all">
                  <div className="p-10 bg-srv-purple/5 border-b border-srv-purple/10 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex-1">
                      <h3 className="text-3xl font-black group-hover:text-srv-cyan transition-all mb-3">{obj.name}</h3>
                      <div className="flex flex-wrap gap-8">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-srv-cyan uppercase tracking-[0.2em] opacity-60">Peso Asignado</p>
                          <p className="text-lg font-black">{formatValue(obj.annual_weight)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-srv-yellow uppercase tracking-[0.2em] opacity-60">Logro a la fecha (YTD)</p>
                          <p className="text-lg font-black text-srv-yellow">{formatValue(obj.compliance)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-srv-cyan uppercase tracking-[0.2em] opacity-60">Impacto Anual Cumplido</p>
                          <p className="text-lg font-black text-srv-cyan">{formatValue((obj.annual_weight / 100) * obj.compliance)}%</p>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={obj.status} compliance={obj.compliance} />
                  </div>
                  
                  <div className="p-10 space-y-10">
                    <div className="overflow-x-auto">
                      <table className="table-registros">
                        <thead>
                          <tr>
                            <th className="text-left w-32 border-none bg-transparent opacity-40 text-[9px] uppercase tracking-widest">Concepto</th>
                            {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(m => <th key={m} className="border-none bg-transparent opacity-80 text-[10px] font-black">{m}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="text-left py-4"><span className="text-[9px] font-black text-srv-light/30 uppercase tracking-widest">Planificado</span></td>
                            {obj.plan.map((val, idx) => <td key={idx} className="py-4"><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'plan')} /></td>)}
                          </tr>
                          <tr>
                            <td className="text-left py-4"><span className="text-[9px] font-black text-srv-navy bg-srv-cyan px-2 py-0.5 rounded uppercase tracking-widest">Ejecutado</span></td>
                            {obj.exec.map((val, idx) => <td key={idx} className="py-4"><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'exec')} /></td>)}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Gráfico Individual por Objetivo */}
                    <PerformanceChart 
                      planData={obj.plan} 
                      execData={obj.exec} 
                      title={`Curva de Avance: ${obj.name}`} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer de Resultados Globales */}
          <footer className="bg-srv-cyan text-srv-navy p-20 rounded-[60px] shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-srv-navy/5 rounded-full -mr-40 -mt-40 transition-transform duration-[1.5s] group-hover:scale-110"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-24">
              <div className="space-y-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Logro Ponderado del Área</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-9xl font-black tracking-tighter leading-none">{formatValue(globalScore)}</p>
                  <p className="text-4xl font-bold">%</p>
                </div>
                <div className="w-full bg-srv-navy/10 h-5 rounded-full overflow-hidden border border-srv-navy/5">
                  <div className="bg-srv-navy h-full transition-all duration-1000 shadow-2xl" style={{ width: `${Math.min(100, globalScore)}%` }} />
                </div>
              </div>

              <div className="space-y-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Resumen de Hitos</p>
                <div className="flex items-center gap-8">
                  <div className="p-8 bg-srv-navy text-srv-cyan rounded-[40px] shadow-2xl ring-4 ring-srv-navy/10"><CheckCircle2 className="w-20 h-20" /></div>
                  <div>
                    <p className="text-7xl font-black leading-none">{summary.objectives.filter(o => o.status === 'green').length}</p>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mt-2">Metas Cumplidas</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold italic opacity-40 leading-relaxed uppercase tracking-widest">Cálculo basado en cierre del último mes con datos.</p>
              </div>

              <div className="space-y-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Indicadores Clave</p>
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-srv-navy/5 p-6 rounded-[25px] border border-srv-navy/10 shadow-sm transition-all hover:bg-srv-navy/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Logro Promedio</span>
                    <span className="text-2xl font-black">{formatValue(summary.objectives.reduce((a,b)=>a+b.compliance,0)/summary.objectives.length)}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-srv-navy/5 p-6 rounded-[25px] border border-srv-navy/10 shadow-sm transition-all hover:bg-srv-navy/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Peso Configurado</span>
                    <span className="text-2xl font-black">{formatValue(totalWeight)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

const App = () => <Dashboard />;
export default App;
