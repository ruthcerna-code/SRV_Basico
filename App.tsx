
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
    { id: 'obj-2', name: 'Resolución de Incidencias P1 < 4h', annual_weight: 30.0, plan: Array(12).fill(100.0), exec: [100, 95, 88, 92, 90, 85, 80, 82, 88, 90, 0, 0], compliance: 0, status: 'red' },
    { id: 'obj-3', name: 'Eficiencia Presupuestaria CAPEX', annual_weight: 30.0, plan: [50, 50, 85, 50, 50, 95, 50, 50, 85, 50, 70, 90], exec: [45, 48, 82, 40, 35, 88, 30, 42, 81, 45, 0, 0], compliance: 0, status: 'red' }
  ]
};

const formatValue = (val: number) => val.toFixed(1);

/**
 * REGLA DE NEGOCIO ACTUALIZADA: 
 * "Logrado a la fecha" debe determinarse por el último mes ingresado.
 * Implementamos cálculo YTD (acumulado hasta el último mes con ejecución > 0).
 */
const calculateComplianceToDate = (plan: number[], exec: number[]): number => {
  let lastMonthIndex = -1;
  // Buscamos el último mes que tenga un valor de ejecución superior a 0
  for (let i = 11; i >= 0; i--) {
    if (exec[i] > 0) {
      lastMonthIndex = i;
      break;
    }
  }

  // Si no hay datos, el cumplimiento es 0
  if (lastMonthIndex === -1) return 0;

  // Realizamos la sumatoria acumulada hasta ese mes (YTD)
  const slicePlan = plan.slice(0, lastMonthIndex + 1);
  const sliceExec = exec.slice(0, lastMonthIndex + 1);
  
  const sumPlan = slicePlan.reduce((acc, val) => acc + val, 0);
  const sumExec = sliceExec.reduce((acc, val) => acc + val, 0);

  return sumPlan > 0 ? (sumExec / sumPlan) * 100 : 0;
};

const getStatusByCompliance = (compliance: number): 'red' | 'yellow' | 'green' => {
  if (compliance >= 100) return 'green';
  if (compliance >= 80) return 'yellow';
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
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={padding} y1={getY(maxVal * p / 1.2)} x2={width - padding} y2={getY(maxVal * p / 1.2)} stroke="#4B3F8F" strokeOpacity="0.1" />
        ))}
        <path d={planPath} fill="none" stroke="#4B3F8F" strokeWidth="2" strokeDasharray="4 4" />
        <path d={execPath} fill="none" stroke="#19E3CF" strokeWidth="3" className="drop-shadow-[0_0_8px_rgba(25,227,207,0.4)]" />
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await new Promise(r => setTimeout(r, 600));
      const objectives = INITIAL_MOCK[selectedArea] || [];
      
      // Aplicar recálculo YTD al cargar los datos
      const processedObjectives = objectives.map(obj => {
        // Fix: Added missing logic to complete the mapping and calculate compliance
        const compliance = calculateComplianceToDate(obj.plan, obj.exec);
        const status = getStatusByCompliance(compliance);
        return { ...obj, compliance, status };
      });
      setSummary({ objectives: processedObjectives });
    } catch (err) {
      setErrorMsg('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-srv-navy text-srv-light flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-srv-cyan animate-spin" />
        <p className="text-srv-cyan/60 font-medium animate-pulse">Cargando Tablero SRV...</p>
      </div>
    );
  }

  // Fix: Added missing return statement and closed Dashboard component
  return (
    <div className="min-h-screen bg-srv-navy text-srv-light p-8 font-sans">
      <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="text-srv-cyan" /> SRV <span className="text-srv-cyan">Dashboard</span>
          </h1>
          <p className="text-srv-light/40 font-medium">Sistema de Seguimiento de Objetivos Estratégicos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-srv-navy/40 p-1 rounded-xl border border-srv-purple/30 flex gap-1">
            {EXAMPLE_AREAS.map(area => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedArea === area.id 
                    ? 'bg-srv-cyan text-srv-navy shadow-lg shadow-srv-cyan/20' 
                    : 'text-srv-light/40 hover:text-srv-light'
                }`}
              >
                {area.name}
              </button>
            ))}
          </div>
          
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-srv-navy/60 border border-srv-purple/40 rounded-xl px-4 py-2 text-xs font-bold text-srv-light focus:outline-none focus:ring-2 focus:ring-srv-cyan/50"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </header>

      {errorMsg && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {summary && (
        <div className="grid gap-12">
          {summary.objectives.map((obj) => (
            <div key={obj.id} className="bg-srv-navy/20 rounded-[40px] border border-srv-purple/20 p-8 hover:border-srv-purple/40 transition-all">
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{obj.name}</h2>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-srv-light/40">
                      <span className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Peso Anual: {obj.annual_weight}%
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={obj.status} compliance={obj.compliance} />
                </div>

                <PerformanceChart planData={obj.plan} execData={obj.exec} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Fix: Exported Dashboard as default to fix the "no default export" error in index.tsx
export default Dashboard;
