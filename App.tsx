
import React, { useState, useEffect, useCallback } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { Area, SRVSummary, SummaryObjective, Profile } from './types';

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
    { id: 'obj-2', name: 'Resolución de Incidencias P1 < 4h', annual_weight: 30.0, plan: Array(12).fill(100.0), exec: Array(12).fill(90.0), compliance: 90, status: 'yellow' },
    { id: 'obj-3', name: 'Eficiencia Presupuestaria CAPEX', annual_weight: 30.0, plan: Array(12).fill(50.0), exec: Array(12).fill(35.0), compliance: 70, status: 'red' }
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
      // In a real app: call edge function srv-summary
      // const { data } = await supabase.functions.invoke('srv-summary', { queryParams: { area_id: selectedArea, year: selectedYear } });
      
      // Simulation:
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
    
    // Validation: Weight Sum
    const totalWeight = summary.objectives.reduce((sum, o) => sum + o.annual_weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      setErrorMsg(`Error de Validación: La suma de los pesos es ${totalWeight.toFixed(1)}%. Debe ser exactamente 100.0%.`);
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      // Simulation of Edge Function Calls
      await new Promise(r => setTimeout(r, 1000));
      // await supabase.functions.invoke('srv-upsert-objectives', { body: { area_id: selectedArea, year: selectedYear, objectives: summary.objectives } });
      alert("Gestión guardada exitosamente en el sistema SRV.");
    } catch (e: any) {
      setErrorMsg(e.message || "Error al conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = summary?.objectives.reduce((s,o) => s + o.annual_weight, 0) || 0;

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
          {/* B) Objectives List */}
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
                    <th className="text-left">Nombre del Objetivo</th>
                    <th className="text-right w-64">% Peso Anual</th>
                    <th className="w-24">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.objectives.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 opacity-40 italic">No hay objetivos registrados para esta área/año. Comience agregando uno nuevo.</td>
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
                        <div className="inline-flex items-center gap-3">
                          <input 
                            type="number"
                            step="0.1"
                            value={obj.annual_weight}
                            onChange={(e) => handleUpdateWeight(obj.id, parseFloat(e.target.value) || 0)}
                            className="w-28 p-2.5 bg-srv-navy/40 border border-srv-purple/30 rounded-xl text-right font-black focus:ring-1 focus:ring-srv-cyan outline-none text-srv-light"
                          />
                          <span className="text-srv-light opacity-30 text-xs">%</span>
                        </div>
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
                  <tr className={Math.abs(totalWeight - 100) < 0.01 ? 'bg-srv-cyan' : 'bg-srv-orange text-white'}>
                    <td className="text-right font-black uppercase tracking-widest text-[10px] border-none bg-inherit text-srv-navy">Total Ponderación Global</td>
                    <td className="text-right font-black border-none text-lg bg-inherit text-srv-navy">
                      {formatValue(totalWeight)}%
                    </td>
                    <td className="border-none bg-inherit"></td>
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
                    <p className="text-[10px] font-black text-srv-cyan uppercase tracking-[0.3em] mt-2 italic">Impacto Anual: {formatValue(obj.annual_weight)}%</p>
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
                        <th className="text-right w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left"><span className="text-[9px] font-black text-srv-light/60 border border-srv-light/20 px-2 py-1 rounded">PLAN</span></td>
                        {obj.plan.map((val, idx) => (
                          <td key={idx}><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'plan')} /></td>
                        ))}
                        <td className="text-right font-black text-srv-cyan">{formatValue(obj.plan.reduce((s,v)=>s+v, 0))}</td>
                      </tr>
                      <tr>
                        <td className="text-left"><span className="text-[9px] font-black text-srv-navy bg-srv-cyan px-2 py-1 rounded uppercase">Ejec</span></td>
                        {obj.exec.map((val, idx) => (
                          <td key={idx}><MonthInput value={val} onChange={(v) => handleUpdateMonthly(obj.id, idx, v, 'exec')} /></td>
                        ))}
                        <td className="text-right font-black text-srv-cyan">{formatValue(obj.exec.reduce((s,v)=>s+v, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* E) Results Summary Footer */}
          <section className="bg-srv-cyan text-srv-navy p-16 rounded-[50px] shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-srv-navy/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-125"></div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-20">
              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Score Global Área</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-8xl font-black">
                    {formatValue(summary.objectives.reduce((acc, obj) => acc + (obj.compliance * (obj.annual_weight / 100)), 0))}
                  </p>
                  <p className="text-3xl font-bold">%</p>
                </div>
                <div className="w-full bg-srv-navy/10 h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-srv-navy h-full transition-all duration-1000" 
                    style={{ width: `${Math.min(100, summary.objectives.reduce((acc, obj) => acc + (obj.compliance * (obj.annual_weight / 100)), 0))}%` }}
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
                <p className="text-xs font-bold italic opacity-40">Métricas actualizadas hoy.</p>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Dashboard Operativo</p>
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
