
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Save, 
  Loader2,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  CheckCircle2,
  PlusCircle,
  Trash2,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Area, SRVSummary, SummaryObjective } from './types';

// Supabase client initialization (placeholder keys)
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    { id: 'obj-2', name: 'Resolución de Incidencias P1 < 4h', annual_weight: 30.0, plan: Array(12).fill(100.0), exec: [100, 95, 88, 92, 90, 85, 80, 82, 88, 90, 0, 0], compliance: 89.2, status: 'yellow' },
    { id: 'obj-3', name: 'Eficiencia Presupuestaria CAPEX', annual_weight: 30.0, plan: [50, 50, 85, 50, 50, 95, 50, 50, 85, 50, 70, 90], exec: [45, 48, 82, 40, 35, 88, 30, 42, 81, 45, 0, 0], compliance: 76.4, status: 'red' }
  ]
};

// --- Helper for consistent formatting ---
const formatValue = (val: number) => val.toFixed(1);

// --- Components ---

const StatusBadge = ({ status, compliance }: { status: string, compliance: number }) => {
  const styles = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    yellow: 'bg-[#D6B85C]/20 text-[#D6B85C] border-[#D6B85C]/40',
    red: 'bg-[#D3543A]/20 text-[#D3543A] border-[#D3543A]/40'
  };
  const currentStyle = styles[status as keyof typeof styles] || styles.red;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentStyle}`}>
      {formatValue(compliance)}%
    </span>
  );
};

const MonthInput = ({ value, onChange }: { value: number, onChange: (v: number) => void }) => (
  <input
    type="number"
    step="0.1"
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    className="w-full min-w-[75px] p-2 text-right bg-srv-navy/60 border border-srv-purple/40 rounded text-srv-light text-xs focus:ring-1 focus:ring-srv-cyan focus:border-srv-cyan outline-none transition-all"
  />
);

/**
 * Custom SVG Chart to visualize performance behavior
 */
const PerformanceChart = ({ planData, execData }: { planData: number[], execData: number[] }) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const maxVal = Math.max(...planData, ...execData, 1) * 1.2;
  const height = 200;
  const width = 800;
  const padding = 40;

  const getX = (i: number) => padding + (i * (width - padding * 2) / (months.length - 1));
  const getY = (v: number) => height - padding - (v / maxVal * (height - padding * 2));

  const planPath = planData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');
  const execPath = execData.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`).join(' ');

  return (
    <div className="w-full overflow-x-auto bg-srv-navy/40 p-6 rounded-[40px] border border-srv-purple/30 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8 px-4">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Activity className="text-srv-cyan w-6 h-6" /> Comportamiento Plan vs Entrega
        </h3>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-srv-purple border border-srv-purple/50"></div>
            <span className="opacity-60 text-srv-light">Planificado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-srv-cyan shadow-lg shadow-srv-cyan/30"></div>
            <span className="text-srv-cyan">Entregado</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]">
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line 
            key={i} 
            x1={padding} y1={getY(maxVal * p / 1.2)} 
            x2={width - padding} y2={getY(maxVal * p / 1.2)} 
            stroke="#4B3F8F" strokeOpacity="0.1" 
          />
        ))}
        {/* Plan Path */}
        <path d={planPath} fill="none" stroke="#4B3F8F" strokeWidth="2" strokeDasharray="4 4" />
        {/* Exec Path */}
        <path d={execPath} fill="none" stroke="#19E3CF" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(25,227,207,0.4)]" />
        {/* Points and Labels */}
        {months.map((m, i) => (
          <g key={m}>
            <text x={getX(i)} y={height - 10} textAnchor="middle" fill="#E6E6F0" opacity="0.4" fontSize="10" fontWeight="bold">{m}</text>
            <circle cx={getX(i)} cy={getY(planData[i])} r="3" fill="#4B3F8F" />
            <circle cx={getX(i)} cy={getY(execData[i])} r="4" fill="#19E3CF" />
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

  // Load data based on context
  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      const objectives = INITIAL_MOCK[selectedArea] || [];
      setSummary({ objectives: JSON.parse(JSON.stringify(objectives)) });
    } catch (e) {
      console.error(e);
      setSummary({ objectives: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          const sumPlan = type === 'plan' ? newData.reduce((s,v) => s+v, 0) : o.plan.reduce((s,v) => s+v, 0);
          const sumExec = type === 'exec' ? newData.reduce((s,v) => s+v, 0) : o.exec.reduce((s,v) => s+v, 0);
          const compliance = sumPlan > 0 ? (sumExec / sumPlan) * 100 : 0;
          let status: 'red' | 'yellow' | 'green' = 'red';
          if (compliance >= 100) status = 'green';
          else if (compliance >= 80) status = 'yellow';
          return { ...o, [type]: newData, compliance, status };
        }
        return o;
      })
    });
  };

  const handleAddObjective = () => {
    if (!summary) return;
    const newObj: SummaryObjective = {
      id: `new-${Date.now()}`,
      name: 'Nuevo Objetivo Estratégico',
      annual_weight: 0,
      plan: Array(12).fill(0),
      exec: Array(12).fill(0),
      compliance: 0,
      status: 'red'
    };
    setSummary({ ...summary, objectives: [...summary.objectives, newObj] });
  };

  const handleDeleteObjective = (id: string) => {
    if (!summary) return;
    setSummary({ ...summary, objectives: summary.objectives.filter(o => o.id !== id) });
  };

  const handleSaveAll = async () => {
    if (!summary) return;
    const totalWeight = summary.objectives.reduce((sum, o) => sum + o.annual_weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      setErrorMsg(`Error de Validación: La suma de los pesos es ${totalWeight.toFixed(1)}%. Debe ser exactamente 100.0%.`);
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1000));
      alert("Gestión guardada exitosamente en el sistema SRV.");
    } catch (e: any) {
      setErrorMsg(e.message || "Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  // Aggregated Monthly Totals for Chart
  const aggregatedData = useMemo(() => {
    if (!summary) return { plan: Array(12).fill(0), exec: Array(12).fill(0) };
    const plan = Array(12).fill(0);
    const exec = Array(12).fill(0);
    summary.objectives.forEach(obj => {
      obj.plan.forEach((v, i) => plan[i] += v);
      obj.exec.forEach((v, i) => exec[i] += v);
    });
    return { plan, exec };
  }, [summary]);

  const totalWeight = summary?.objectives.reduce((s,o) => s + o.annual_weight, 0) || 0;
  
  const globalAnualCumplido = useMemo(() => {
    if (!summary) return 0;
    return summary.objectives.reduce((acc, obj) => acc + (obj.compliance * (obj.annual_weight / 100)), 0);
  }, [summary]);

  return (
    <div className="relative z-10 px-6 py-12 md:px-[8%] md:py-24 max-w-[1600px] mx-auto space-y-16">
      
      {/* Hero Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-12">
        <div className="max-w-[800px] space-y-4">
          <div className="flex items-center gap-3 text-srv-cyan font-black tracking-[0.2em] text-sm uppercase">
            <Layers className="w-5 h-5" />
            Planner SRV v2.5
          </div>
          <h1 className="hero-title text-5xl md:text-7xl font-semibold leading-[1.1] tracking-tight">
            Gestión de <span>Métricas TI</span>
          </h1>
          <p className="text-xl text-srv-light opacity-80 leading-relaxed font-light">
            Planificación dinámica de objetivos para el área de {EXAMPLE_AREAS.find(a => a.id === selectedArea)?.name}.
          </p>
        </div>
        <div className="bg-srv-purple/10 p-6 rounded-[32px] border border-srv-purple/30 backdrop-blur-md shadow-2xl flex items-center gap-6">
          <div className="p-4 bg-srv-cyan/10 rounded-2xl">
            <TrendingUp className="text-srv-cyan w-10 h-10" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-srv-cyan tracking-[0.2em] mb-1">Status Sistema</p>
            <p className="text-2xl font-black">Conectado</p>
          </div>
        </div>
      </header>

      {/* A) Context Selector */}
      <div className="bg-srv-purple/5 border border-srv-purple/20 p-10 rounded-[40px] backdrop-blur-2xl shadow-2xl flex flex-wrap items-end gap-10">
        <div className="flex-1 min-w-[280px] space-y-3">
          <label className="text-[10px] font-black uppercase text-srv-cyan tracking-[0.3em]">Área Organizacional</label>
          <select 
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full p-4 bg-srv-navy/80 border border-srv-purple/40 rounded-2xl text-srv-light outline-none focus:ring-2 focus:ring-srv-cyan transition-all font-bold appearance-none cursor-pointer"
          >
            {EXAMPLE_AREAS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-3">
          <label className="text-[10px] font-black uppercase text-srv-cyan tracking-[0.3em]">Ejercicio Fiscal</label>
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full p-4 bg-srv-navy/80 border border-srv-purple/40 rounded-2xl text-srv-light outline-none focus:ring-2 focus:ring-srv-cyan transition-all font-bold appearance-none cursor-pointer"
          >
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="h-[60px] px-12 bg-srv-cyan text-srv-navy font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-srv-cyan/30 uppercase tracking-[0.2em] text-xs flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sincronizar'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-srv-orange/10 border border-srv-orange/30 p-6 rounded-3xl flex items-center gap-4 text-srv-orange animate-pulse">
          <AlertCircle className="w-8 h-8 flex-shrink-0" />
          <p className="font-bold">{errorMsg}</p>
        </div>
      )}

      {summary && (
        <>
          {/* B) Objectives Configuration */}
          <section className="bg-srv-navy/60 border border-srv-purple/30 rounded-[40px] overflow-hidden backdrop-blur-xl shadow-2xl">
            <div className="p-8 bg-srv-purple/20 border-b border-srv-purple/20 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-4">
                <BarChart3 className="text-srv-cyan w-8 h-8" /> Configuración de Objetivos
              </h2>
              <div className="flex gap-4">
                <button 
                  onClick={handleAddObjective}
                  className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-6 py-3 bg-srv-purple/40 hover:bg-srv-purple/60 rounded-xl transition-all border border-srv-purple/40 text-srv-light"
                >
                  <PlusCircle className="w-4 h-4 text-srv-cyan" /> Agregar Objetivo
                </button>
                <button 
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 px-6 py-3 bg-srv-cyan text-srv-navy rounded-xl transition-all shadow-lg shadow-srv-cyan/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                  Guardar Cambios
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="table-registros">
                <thead>
                  <tr>
                    <th className="text-left min-w-[300px]">Nombre del Objetivo</th>
                    <th className="text-right w-32">% Peso Anual</th>
                    <th className="text-right w-44">% Logrado a la fecha</th>
                    <th className="text-right w-44">% Anual Cumplido</th>
                    <th className="w-24">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.objectives.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 opacity-40 italic text-center">No hay objetivos registrados.</td>
                    </tr>
                  )}
                  {summary.objectives.map((obj) => (
                    <tr key={obj.id}>
                      <td className="text-left">
                        <input 
                          type="text" 
                          value={obj.name}
                          onChange={(e) => handleUpdateName(obj.id, e.target.value)}
                          className="w-full bg-transparent border-none outline-none font-bold text-srv-light focus:text-srv-cyan transition-colors"
                        />
                      </td>
                      <td className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <input 
                            type="number"
                            step="0.1"
                            value={obj.annual_weight}
                            onChange={(e) => handleUpdateWeight(obj.id, parseFloat(e.target.value) || 0)}
                            className="w-20 p-2 bg-srv-navy/40 border border-srv-purple/30 rounded-xl text-right font-black focus:ring-1 focus:ring-srv-cyan outline-none text-srv-light"
                          />
                        </div>
                      </td>
                      <td className="text-right font-bold text-srv-yellow">
                        {formatValue(obj.compliance)}%
                      </td>
                      <td className="text-right font-black text-srv-cyan">
                        {formatValue((obj.annual_weight * obj.compliance) / 100)}%
                      </td>
                      <td>
                        <button 
                          onClick={() => handleDeleteObjective(obj.id)}
                          className="p-2 text-srv-orange hover:bg-srv-orange/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Totals Section */}
                  <tr className={Math.abs(totalWeight - 100) < 0.01 ? 'bg-srv-cyan' : 'bg-srv-orange text-white'}>
                    <td className="text-right font-black uppercase tracking-widest text-[10px] border-none bg-inherit text-srv-navy">Total Ponderación Global</td>
                    <td className="text-right font-black border-none text-lg bg-inherit text-srv-navy">
                      {formatValue(totalWeight)}%
                    </td>
                    <td className="border-none bg-inherit" colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* C & D) Detailed Plan/Exec Table Section */}
          <div className="space-y-12">
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-srv-cyan border-l-4 border-srv-cyan pl-6">Panel de Ejecución Mensual</h2>
            {summary.objectives.map((obj) => (
              <div key={obj.id} className="bg-srv-navy/80 border border-srv-purple/20 rounded-[40px] overflow-hidden shadow-2xl transition-all hover:border-srv-purple/50 group">
                <div className="p-8 bg-srv-purple/10 border-b border-srv-purple/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-srv-light group-hover:text-srv-cyan transition-colors">{obj.name}</h3>
                    <div className="flex gap-4 mt-2">
                      <p className="text-[10px] font-black text-srv-cyan uppercase tracking-[0.3em] italic">Impacto: {formatValue(obj.annual_weight)}%</p>
                      <p className="text-[10px] font-black text-srv-yellow uppercase tracking-[0.3em] italic">Logro: {formatValue(obj.compliance)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <StatusBadge status={obj.status} compliance={obj.compliance} />
                    <button 
                      onClick={handleSaveAll}
                      className="p-4 bg-srv-light/5 hover:bg-srv-light/10 rounded-2xl transition-all border border-srv-purple/30 group-hover:border-srv-cyan/30"
                    >
                      <Save className="w-6 h-6 text-srv-cyan" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="table-registros">
                    <thead>
                      <tr>
                        <th className="text-left w-32">Data</th>
                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(m => (
                          <th key={m} className="min-w-[90px]">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left"><span className="text-[9px] font-black text-srv-light/60 border border-srv-light/20 px-2 py-1 rounded">PLAN</span></td>
                        {obj.plan.map((val, idx) => (
                          <td key={idx}><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'plan')} /></td>
                        ))}
                      </tr>
                      <tr>
                        <td className="text-left"><span className="text-[9px] font-black text-srv-navy bg-srv-cyan px-2 py-1 rounded uppercase">Ejec</span></td>
                        {obj.exec.map((val, idx) => (
                          <td key={idx}><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'exec')} /></td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* PERFORMANCE CHART - Behavior Visualization */}
          <section className="space-y-8">
            <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-srv-cyan border-l-4 border-srv-cyan pl-6">Visualización de Rendimiento</h2>
            <PerformanceChart planData={aggregatedData.plan} execData={aggregatedData.exec} />
          </section>

          {/* E) Results Summary Footer */}
          <section className="bg-srv-cyan text-srv-navy p-16 rounded-[50px] shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-srv-navy/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-20">
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Score Global Área</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-8xl font-black">
                    {formatValue(globalAnualCumplido)}
                  </p>
                  <p className="text-3xl font-bold">%</p>
                </div>
                <div className="w-full bg-srv-navy/10 h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-srv-navy h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, globalAnualCumplido)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Hitos de Gestión</p>
                <div className="flex items-center gap-8">
                  <div className="p-6 bg-srv-navy text-srv-cyan rounded-[32px] shadow-xl">
                    <CheckCircle2 className="w-16 h-16" />
                  </div>
                  <div>
                    <p className="text-6xl font-black">{summary.objectives.filter(o => o.status === 'green').length}</p>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] opacity-60">Meta Alcanzada</p>
                  </div>
                </div>
                <p className="text-xs font-bold italic opacity-40">Métricas en tiempo real.</p>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Contexto Operativo</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-srv-navy/5 p-5 rounded-2xl border border-srv-navy/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Área</span>
                    <span className="text-lg font-black">{EXAMPLE_AREAS.find(a => a.id === selectedArea)?.name}</span>
                  </div>
                  <div className="flex justify-between items-center bg-srv-navy/5 p-5 rounded-2xl border border-srv-navy/10">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Carga</span>
                    <span className="flex items-center gap-3 text-lg font-black">
                      <span className="w-3 h-3 rounded-full bg-srv-navy animate-pulse shadow-lg shadow-srv-navy/40"></span>
                      Directo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const App = () => <Dashboard />;

export default App;
