import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Calculator, 
  Lock, 
  LogOut, 
  Download, 
  Upload, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  PieChart, 
  DollarSign, 
  CalendarDays, 
  Info, 
  Settings, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Loader2, 
  History, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  Database, 
  Target, 
  Trophy, 
  Wallet,
  Plus,
  Search,
  Calendar,
  HelpCircle,
  Sigma,
  ListTodo,
  CheckSquare,
  FileSpreadsheet,
  Copy,
  Hash,
  Zap,
  ArrowUpRight,
  Sparkles,
  Activity,
  LayoutGrid,
  Eye
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  updateDoc
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken 
} from "firebase/auth";

// --- CONFIGURAÇÃO FIREBASE ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') {
    return JSON.parse(__firebase_config);
  }
  return {
    apiKey: "AIzaSyBB2rwPfLZThzgwEMARy52BXWZkF5wfq88",
    authDomain: "metas-safbfr.firebaseapp.com",
    projectId: "metas-safbfr",
    storageBucket: "metas-safbfr.firebasestorage.app",
    messagingSenderId: "267915684228",
    appId: "1:267915684228:web:e64c1c40dc80fd09ed15d1"
  };
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);

const getAppId = () => {
  return typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
};

const getCollectionRef = (collectionName) => {
  const appId = getAppId();
  return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
};

const getDocRef = (collectionName, id) => {
  const appId = getAppId();
  return doc(db, 'artifacts', appId, 'public', 'data', collectionName, String(id));
};

/**
 * UTILS & CONSTANTS
 */
const GOAL_TYPES = [ "Global", "Organizacional", "Financeiro", "KPI / Processo", "Projetos" ];
const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/c/cb/Botafogo_de_Futebol_e_Regatas_logo.svg";

const normalizeText = (text) => String(text || '').trim().toLowerCase();

const cleanNumber = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  let str = String(val).trim();
  str = str.replace(/[^0-9.,-]/g, '');
  if (str.includes(',')) {
    str = str.replace(/\./g, '');
    str = str.replace(',', '.');
  } else {
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
       str = str.replace(/\./g, '');
    }
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return `${num.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
};

const formatNumber = (value) => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR').format(num);
};

const formatSmart = (value, unit) => {
  if (value === undefined || value === null || value === '') return '-';
  if (value === 0 || value === '0' || value === 0.0) return '-';
  const unitLower = (unit || '').toLowerCase();
  if (unitLower.includes('r$') || unitLower.includes('brl')) return formatCurrency(value);
  if (unitLower.includes('%')) return formatPercent(value);
  if (unitLower.includes('dia') || unitLower.includes('un')) return formatNumber(value);
  return formatNumber(value); 
};

const safeDateDisplay = (dateString) => {
  if (!dateString) return '-';
  try {
    if (typeof dateString === 'string' && dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateString.substring(0, 5); 
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString); 
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    return adjustedDate.toLocaleDateString('pt-BR', {month:'short', year:'2-digit'});
  } catch (e) { return String(dateString); }
};

const calculatePLRNet = (grossValue) => {
  let tax = 0;
  if (grossValue <= 7640.80) tax = 0;
  else if (grossValue <= 9922.28) tax = (grossValue * 0.075) - 573.06;
  else if (grossValue <= 13167.00) tax = (grossValue * 0.15) - 1317.23;
  else if (grossValue <= 16380.38) tax = (grossValue * 0.225) - 2304.76;
  else tax = (grossValue * 0.275) - 3123.78;
  return { gross: grossValue, tax: Math.max(0, tax), net: grossValue - Math.max(0, tax) };
};

const getProgressColor = (percent) => {
  if (percent >= 120) return { bar: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', glow: 'shadow-violet-200/50' };
  if (percent >= 100) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', glow: 'shadow-emerald-200/50' };
  if (percent >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', glow: 'shadow-amber-200/50' };
  return { bar: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', glow: 'shadow-rose-200/50' };
};

const getProgressBarClass = (percent) => {
  if (percent >= 120) return 'bg-violet-500'; 
  if (percent >= 100) return 'bg-emerald-500'; 
  if (percent >= 60) return 'bg-amber-500'; 
  return 'bg-rose-500';
};

const excelDateToJSDate = (serial) => {
   if (!serial) return '';
   if (typeof serial === 'string') {
      if (serial.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
         const [d, m, y] = serial.split('/');
         return `${y}-${m}-${d}`;
      }
      return serial;
   }
   const utc_days  = Math.floor(serial - 25569);
   const utc_value = utc_days * 86400;                                        
   const date_info = new Date(utc_value * 1000);
   const fractional_day = serial - Math.floor(serial) + 0.0000001;
   let total_seconds = Math.floor(86400 * fractional_day);
   const seconds = total_seconds % 60;
   total_seconds -= seconds;
   const hours = Math.floor(total_seconds / (60 * 60));
   const minutes = Math.floor(total_seconds / 60) % 60;
   return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds).toISOString().split('T')[0];
};

/* =========================================
   GLOBAL STYLES (injected once)
   ========================================= */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    :root {
      --font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, monospace;
      --color-surface: #FAFBFC;
      --color-card: #FFFFFF;
      --color-border: #E8ECF0;
      --color-border-hover: #D0D5DD;
      --color-text-primary: #0F1419;
      --color-text-secondary: #536471;
      --color-text-muted: #8899A6;
      --color-accent: #1D9BF0;
      --color-success: #00BA7C;
      --color-warning: #FFB800;
      --color-danger: #F4212E;
      --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    }

    * {
      font-family: var(--font-sans);
    }

    body {
      background: var(--color-surface);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .font-mono {
      font-family: var(--font-mono) !important;
    }

    /* Custom scrollbar */
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #D0D5DD; border-radius: 999px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #98A2B3; }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideDown {
      from { opacity: 0; max-height: 0; }
      to { opacity: 1; max-height: 500px; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(0.9); opacity: 1; }
      100% { transform: scale(1.3); opacity: 0; }
    }
    @keyframes progressFill {
      from { width: 0%; }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .animate-fade-up { animation: fadeUp 0.5s var(--ease-smooth) both; }
    .animate-fade-in { animation: fadeIn 0.3s var(--ease-smooth) both; }
    .animate-scale-in { animation: scaleIn 0.3s var(--ease-spring) both; }
    .animate-slide-down { animation: slideDown 0.4s var(--ease-smooth) both; overflow: hidden; }
    .animate-count-up { animation: countUp 0.6s var(--ease-spring) both; }

    .stagger-1 { animation-delay: 0.05s; }
    .stagger-2 { animation-delay: 0.1s; }
    .stagger-3 { animation-delay: 0.15s; }
    .stagger-4 { animation-delay: 0.2s; }
    .stagger-5 { animation-delay: 0.25s; }
    .stagger-6 { animation-delay: 0.3s; }

    .progress-animate {
      animation: progressFill 1.2s var(--ease-smooth) both;
      animation-delay: 0.3s;
    }

    /* Glassmorphism card hover */
    .glass-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      transition: all 0.3s var(--ease-smooth);
    }
    .glass-card:hover {
      background: rgba(255,255,255,0.95);
      box-shadow: 0 8px 32px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
      transform: translateY(-2px);
    }

    /* Input focus ring */
    input:focus, select:focus, textarea:focus {
      box-shadow: 0 0 0 3px rgba(29, 155, 240, 0.15);
    }

    /* Badge pulse */
    .badge-pulse::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      animation: pulse-ring 2s ease-out infinite;
    }

    /* Smooth number transitions */
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }

    /* Line clamp */
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .line-clamp-3 {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `}</style>
);

/* =========================================
   REUSABLE COMPONENTS
   ========================================= */

const SimpleTooltip = ({ text, children }) => (
  <div className="group/tooltip relative flex items-center w-fit h-fit">
    {children}
    <div className="absolute bottom-full mb-2.5 hidden group-hover/tooltip:flex flex-col items-center w-max max-w-[280px] z-[100] left-1/2 -translate-x-1/2 pointer-events-none">
      <div className="bg-[#0F1419] text-white text-[11px] rounded-lg px-3.5 py-2.5 shadow-2xl text-center leading-relaxed break-words font-medium tracking-wide">
        {text}
      </div>
      <div className="w-2 h-2 bg-[#0F1419] rotate-45 -mt-1 relative z-[101]"></div>
    </div>
  </div>
);

const AnimatedNumber = ({ value, suffix = '' }) => {
  return (
    <span className="animate-count-up inline-block tabular-nums">
      {value}{suffix}
    </span>
  );
};

const StatusDialog = ({ status, onClose }) => {
  if (status.type === 'idle') return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-sm w-full text-center animate-scale-in border border-gray-100">
        {status.type === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-[#1D9BF0] animate-spin" />
              <div className="absolute inset-0 bg-[#1D9BF0]/10 rounded-full blur-xl"></div>
            </div>
            <h3 className="text-lg font-bold text-[#0F1419] mt-6">Processando</h3>
            <p className="text-[#536471] text-sm mt-2 leading-relaxed">{status.message}</p>
          </div>
        )}
        {status.type === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1419] mt-6">Concluído</h3>
            <p className="text-[#536471] text-sm mt-2 leading-relaxed">{status.message}</p>
            <button onClick={onClose} className="mt-8 bg-[#0F1419] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all w-full shadow-lg shadow-gray-200/50 active:scale-[0.98]">
              Fechar
            </button>
          </div>
        )}
        {status.type === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0F1419] mt-6">Atenção</h3>
            <p className="text-[#536471] text-sm mt-2 leading-relaxed">{status.message}</p>
            <button onClick={onClose} className="mt-8 bg-white border-2 border-gray-200 text-[#0F1419] px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all w-full active:scale-[0.98]">
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================
   PROJECT DIALOG
   ========================================= */
const ProjectDialog = ({ goal, milestones, onClose, onToggleMilestone }) => {
  const projectMilestones = milestones.filter(m => {
     const mGoalId = String(m.goal_id).trim();
     if (goal.custom_id && mGoalId === String(goal.custom_id).trim()) return true;
     if (mGoalId === String(goal.id).trim()) return true;
     const matchName = m.projeto && goal.kpi && normalizeText(m.projeto) === normalizeText(goal.kpi);
     return matchName;
  }).sort((a,b) => {
     if(a.prazo && b.prazo) return new Date(a.prazo) - new Date(b.prazo);
     return 0;
  });

  const completedWeight = projectMilestones
    .filter(m => m.status === 'done')
    .reduce((acc, curr) => acc + (curr.peso || 0), 0);
  
  const totalWeight = projectMilestones.reduce((acc, curr) => acc + (curr.peso || 0), 0);
  const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[#0F1419] to-[#1a2634] px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                 <ListTodo className="w-4 h-4 text-emerald-400" />
               </div>
               {goal.kpi || 'Projeto'}
            </h3>
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-2 ml-11">
               {goal.objetivo}
               {goal.custom_id && <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded-md font-mono text-[10px]">ID: {goal.custom_id}</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-2 rounded-xl hover:bg-white/10">
             <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 shrink-0">
           <div className="flex justify-between items-end mb-3">
              <span className="text-[10px] font-bold text-[#536471] uppercase tracking-[0.15em]">Progresso do Projeto</span>
              <span className="text-2xl font-black text-[#0F1419] tabular-nums">{progress.toFixed(1)}%</span>
           </div>
           <div className="h-3 bg-gray-200 rounded-full w-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 progress-animate ${getProgressBarClass(progress)}`} 
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
           </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
           {projectMilestones.length === 0 ? (
             <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
                <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-[#536471] font-semibold text-sm">Nenhuma etapa encontrada</p>
                <p className="text-xs text-[#8899A6] mt-1">Vinculada ao ID <strong className="font-mono">{goal.custom_id || goal.id}</strong></p>
             </div>
           ) : (
             <div className="space-y-3">
               {projectMilestones.map((step, idx) => {
                 const isDone = step.status === 'done';
                 return (
                   <div 
                      key={step.id} 
                      onClick={() => onToggleMilestone(step, projectMilestones, goal)}
                      className={`animate-fade-up stagger-${Math.min(idx + 1, 6)} relative flex items-start gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer group active:scale-[0.99] ${isDone ? 'bg-emerald-50/60 border-emerald-100' : 'bg-white border-gray-100 hover:border-[#1D9BF0]/30 hover:shadow-lg hover:shadow-blue-50'}`}
                   >
                      <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200' : 'bg-white border-gray-300 group-hover:border-[#1D9BF0]'}`}>
                         {isDone && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start gap-3">
                           <h4 className={`text-sm font-semibold break-words leading-snug ${isDone ? 'text-gray-400 line-through decoration-gray-300' : 'text-[#0F1419]'}`}>
                              {step.etapa}
                           </h4>
                           <span className="text-[10px] font-bold px-2.5 py-1 bg-gray-100 text-[#536471] rounded-lg ml-2 whitespace-nowrap border border-gray-200">
                              {step.peso}%
                           </span>
                         </div>
                         <div className="mt-2 flex items-center gap-3">
                            {step.prazo && (
                               <span className={`text-[11px] flex items-center gap-1.5 font-medium ${isDone ? 'text-gray-400' : 'text-amber-600'}`}>
                                  <CalendarDays className="w-3.5 h-3.5" /> {safeDateDisplay(step.prazo)}
                               </span>
                            )}
                            {step.projeto && <span className="text-[10px] text-[#8899A6] hidden sm:inline-block">• {step.projeto}</span>}
                         </div>
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

/* =========================================
   PROGRESS RULER (thicker, more visual)
   ========================================= */
const Ruler = ({ value }) => {
  const MAX_VAL = 120;
  const safeValue = Number(value) || 0;
  const displayValue = Math.min(Math.max(safeValue, 0), MAX_VAL);
  const colors = getProgressColor(value);
  const marks = [0, 60, 100];
   
  return (
    <div className="mt-5 mb-3 w-full">
      <div className="relative h-3 bg-gray-100 rounded-full w-full overflow-visible">
        {/* Track background with subtle gradient */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100"></div>
        
        {/* Filled bar */}
        <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 progress-animate ${colors.bar} shadow-sm`} 
            style={{ width: `${(displayValue / MAX_VAL) * 100}%` }}
        >
          {/* Sheen effect on bar */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          {/* Floating indicator */}
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 z-20">
            <div className={`relative w-5 h-5 rounded-full ${colors.bar} border-[3px] border-white shadow-lg ${colors.glow} shadow-md`}>
              <div className="absolute -top-9 left-1/2 -translate-x-1/2">
                <div className="bg-[#0F1419] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-lg whitespace-nowrap tabular-nums">
                  {value}%
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-1.5 h-1.5 bg-[#0F1419]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scale marks */}
        {marks.map((mark) => {
          const isOverlapping = Math.abs(safeValue - mark) < 6;
          return (
            <div key={mark} className="absolute top-0 h-full flex items-center z-10" style={{ left: `${(mark / MAX_VAL) * 100}%` }}>
              <div className="w-0.5 h-full bg-gray-300/60"></div>
              {!isOverlapping && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-[#8899A6] tabular-nums">{mark}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* =========================================
   GOAL CARD (redesigned)
   ========================================= */
const GoalCard = ({ goal, history, onOpenProject, index = 0 }) => {
  const [showHistory, setShowHistory] = useState(false);
  const isWorldCup = goal.kpi && String(goal.kpi).toLowerCase().includes('copa do mundo de clubes');
  const mainTitle = (goal.kr && goal.kr !== '-') ? goal.kr : goal.kpi;
  const subTitle = (goal.kpi && goal.kpi !== '-' && goal.kpi !== mainTitle) ? goal.kpi : null;
  const isConcluida = goal.status === 'Concluída';
  const isProject = normalizeText(goal.tipo) === 'projetos';
  const colors = getProgressColor(goal.atingimento);

  return (
    <div className={`animate-fade-up stagger-${Math.min(index + 1, 6)} glass-card relative rounded-2xl p-6 flex flex-col justify-between h-full border-2 group ${isWorldCup ? 'border-amber-200 bg-gradient-to-br from-amber-50/30 to-white' : isConcluida ? 'border-emerald-100' : 'border-gray-100'}`}>
      {/* Top badges row */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
            <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] border ${isProject ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-gray-50 text-[#536471] border-gray-200'}`}>
                  {isProject && <ListTodo className="w-3 h-3 mr-1" />}
                  {goal.tipo || 'Organizacional'}
                </span>
                {isWorldCup && (
                <SimpleTooltip text="Meta extraordinária (+20%)">
                    <span className="relative inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 border border-amber-200 gap-1.5 cursor-help">
                    <Trophy className="w-3 h-3" /> Extra
                    </span>
                </SimpleTooltip>
                )}
                {isConcluida && !isWorldCup && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Concluída
                </span>
                )}
            </div>
            <div className="flex flex-col items-end gap-1">
                <SimpleTooltip text="Peso desta meta no cálculo final">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-default ${colors.bg} ${colors.text} border ${colors.border}`}>
                      Peso: {goal.peso}%
                    </span>
                </SimpleTooltip>
                {goal.custom_id && (
                    <SimpleTooltip text={`ID Meta: ${goal.custom_id}`}>
                        <span className="text-[9px] text-[#8899A6] font-mono flex items-center gap-1"><Hash className="w-2.5 h-2.5" /> {goal.custom_id}</span>
                    </SimpleTooltip>
                )}
            </div>
        </div>

        {/* Title section */}
        <div className="mb-5 flex-grow min-h-[5rem]">
            <h3 className="text-[15px] font-bold text-[#0F1419] leading-snug tracking-tight break-words line-clamp-3 group-hover:text-[#1D9BF0] transition-colors" title={mainTitle}>{mainTitle}</h3>
            <p className="text-xs text-[#536471] mt-2 leading-relaxed break-words line-clamp-2" title={goal.objetivo}>{goal.objetivo}</p>
            {subTitle && <p className="text-[10px] text-[#8899A6] mt-2 flex items-center gap-1.5 break-words"><Target className="w-3 h-3 flex-shrink-0" /> {subTitle}</p>}
        </div>

        {/* Metrics or Project button */}
        {isProject ? (
           <div className="mb-5 mt-auto">
              <button 
                onClick={() => onOpenProject(goal)}
                className="w-full py-3.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border-2 border-violet-100 hover:border-violet-200 rounded-xl flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] group/btn"
              >
                 <ListTodo className="w-4 h-4 group-hover/btn:rotate-6 transition-transform" />
                 <span className="text-xs font-bold uppercase tracking-[0.1em]">Ver Etapas</span>
              </button>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col justify-center group/metric hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                  <span className="text-[9px] uppercase font-bold text-[#8899A6] tracking-[0.15em] mb-1.5">Acumulado</span>
                  <span className="text-lg font-bold text-[#0F1419] break-words leading-tight tabular-nums" title={formatSmart(goal.resultado_anual, goal.unidade)}>
                      {formatSmart(goal.resultado_anual, goal.unidade)}
                  </span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-100 flex flex-col justify-center group/metric hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                  <span className="text-[9px] uppercase font-bold text-[#8899A6] tracking-[0.15em] mb-1.5">Mês Atual</span>
                  <div className="flex flex-col">
                      <span className="text-base font-semibold text-[#536471] break-words leading-tight tabular-nums" title={formatSmart(goal.resultado_mensal, goal.unidade)}>
                          {formatSmart(goal.resultado_mensal, goal.unidade)}
                      </span>
                      <span className="text-[9px] text-[#8899A6] mt-1 font-medium">{safeDateDisplay(goal.data_referencia)}</span>
                  </div>
              </div>
          </div>
        )}

        {/* Progress ruler */}
        <div className="mb-2">
            <div className="mb-1 flex justify-between items-end">
                <span className="text-[9px] font-bold text-[#8899A6] uppercase tracking-[0.15em]">Atingimento</span>
            </div>
            <Ruler value={goal.atingimento} />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            {goal.formula && (
                <SimpleTooltip text={`Fórmula: ${goal.formula}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#536471] hover:text-[#0F1419] cursor-help transition-colors bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-100">
                        <Sigma className="w-3 h-3" />
                        <span className="font-semibold">Fórmula</span>
                    </div>
                </SimpleTooltip>
            )}
            {goal.explicacao && (
                <SimpleTooltip text={goal.explicacao}>
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-600 hover:text-amber-800 cursor-help transition-colors bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg border border-amber-100">
                        <Info className="w-3 h-3" />
                        <span className="font-semibold">Análise</span>
                    </div>
                </SimpleTooltip>
            )}
        </div>
        <span className="text-[10px] text-[#8899A6] font-medium">{goal.prazo} • {goal.unidade}</span>
      </div>

      {/* History section */}
      {!isProject && history && history.length > 1 && (
        <div className="mt-3">
            <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="w-full py-2 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8899A6] hover:text-[#0F1419] hover:bg-gray-50 rounded-xl transition-all active:scale-[0.98]"
            >
                <History className="w-3 h-3" />
                {showHistory ? 'Fechar Histórico' : 'Ver Histórico'} 
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showHistory && (
                <div className="mt-2 overflow-hidden rounded-xl border border-gray-100 animate-slide-down bg-gray-50/50">
                    <table className="w-full text-[10px] text-left">
                        <thead className="bg-gray-100/80 text-[#8899A6] font-bold border-b border-gray-200 uppercase tracking-wider">
                        <tr>
                            <th className="px-3 py-2">Ref.</th>
                            <th className="px-3 py-2">Mensal</th>
                            <th className="px-3 py-2">YTD</th>
                            <th className="px-3 py-2 text-right">Ating.</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {history.map((h, idx) => (
                            <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="px-3 py-2 text-[#8899A6] font-mono text-[9px]">{safeDateDisplay(h.data_referencia)}</td>
                            <td className="px-3 py-2 text-[#536471] tabular-nums">{formatSmart(h.resultado_mensal, h.unidade)}</td>
                            <td className="px-3 py-2 text-[#536471] tabular-nums">{formatSmart(h.resultado_anual, h.unidade)}</td>
                            <td className="px-3 py-2 text-right font-bold text-[#0F1419] tabular-nums">{h.atingimento}%</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

/* =========================================
   AREA SCORE TABLE
   ========================================= */
const AreaScoreTable = ({ goals, finalScore }) => {
  const sortedGoals = [...goals].sort((a, b) => (b.peso || 0) - (a.peso || 0));
  const totalWeight = sortedGoals.reduce((sum, g) => sum + (g.peso || 0), 0);
   
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden animate-fade-up">
      <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50/80 to-white">
        <h3 className="font-bold text-[#0F1419] text-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#536471]" />
            </div>
            Detalhamento de Performance
        </h3>
        <span className="text-[10px] font-bold text-[#536471] bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 uppercase tracking-[0.1em]">
            YTD Consolidado
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-[#8899A6] uppercase font-bold bg-gray-50/50 border-b border-gray-100 tracking-wider">
            <tr>
              <th className="px-8 py-3">Meta / KPI</th>
              <th className="px-6 py-3 text-center">Status</th>
              <th className="px-6 py-3 text-right">Resultado</th>
              <th className="px-6 py-3 text-center">Atingimento</th>
              <th className="px-6 py-3 text-center">Peso</th>
              <th className="px-8 py-3 text-right">Contribuição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedGoals.map((goal) => { 
              const contribution = totalWeight > 0 ? (goal.atingimento * goal.peso) / totalWeight : 0; 
              const colors = getProgressColor(goal.atingimento);
              return (
                <tr key={goal.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-3.5 font-semibold text-[#536471] group-hover:text-[#0F1419] transition-colors break-words">
                    {goal.kr || goal.kpi}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${goal.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {goal.status || 'Em andamento'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-[#536471] whitespace-nowrap tabular-nums text-[11px]">
                    {normalizeText(goal.tipo) === 'projetos' ? 'Gestão' : formatSmart(goal.resultado_anual, goal.unidade)}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border tabular-nums ${colors.bg} ${colors.text} ${colors.border}`}>
                      {goal.atingimento}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center text-[#8899A6] font-medium">{goal.peso}%</td>
                  <td className="px-8 py-3.5 text-right font-bold text-[#0F1419] tabular-nums">{contribution.toFixed(1)}%</td>
                </tr>
              ); 
            })}
            <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-t-2 border-gray-200">
              <td className="px-8 py-4 font-bold text-[#0F1419] uppercase text-[10px] tracking-[0.15em]" colSpan={5}>Resultado Final Ponderado</td>
              <td className="px-8 py-4 text-right">
                <span className="text-2xl font-black text-[#0F1419] tabular-nums">{finalScore}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* =========================================
   BONUS CALCULATOR
   ========================================= */
const BonusCalculator = ({ companyResult, areaResult }) => {
  const [salary, setSalary] = useState('');
  const [individualScore, setIndividualScore] = useState(100);
  const [targetMultiples, setTargetMultiples] = useState(1.5);
  const [startDate, setStartDate] = useState('');
  const W_COMPANY = 0.4; const W_AREA = 0.3; const W_INDIVIDUAL = 0.3;
   
  const result = useMemo(() => {
    const numericSalary = parseFloat(salary) || 0;
    let timeFactor = 1; let isEligible = true; let eligibilityReason = '';
    if (startDate) { const start = new Date(startDate); const cutoffDate = new Date('2025-09-01'); const referenceYear = 2025; const endOfYear = new Date(`${referenceYear}-12-31`); if (start >= cutoffDate) { isEligible = false; eligibilityReason = 'Admissão após a data de corte (01/09).'; timeFactor = 0; } else if (start.getFullYear() === referenceYear) { const diffTime = Math.abs(endOfYear - start); const daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; timeFactor = daysWorked / 365; } }
    const weightedScore = ((companyResult * W_COMPANY) + (areaResult * W_AREA) + (individualScore * W_INDIVIDUAL)) / 100;
    const grossBonus = isEligible ? (numericSalary * targetMultiples * weightedScore * timeFactor) : 0;
    const taxData = calculatePLRNet(grossBonus);
    return { weightedScore: (weightedScore * 100).toFixed(1), timeFactor: (timeFactor * 100).toFixed(1), isEligible, eligibilityReason, ...taxData };
  }, [salary, individualScore, targetMultiples, companyResult, areaResult, startDate]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden animate-fade-up">
      <div className="bg-gradient-to-r from-[#0F1419] to-[#1a2634] px-8 py-5 flex items-center justify-between">
        <h3 className="text-white font-bold flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-gray-300" />
            </div>
            <div>
              <span className="uppercase tracking-[0.1em]">Simulador de Bônus</span>
              <span className="block text-[10px] text-gray-400 font-normal mt-0.5">PLR 2025 • Lei 10.101/2000</span>
            </div>
        </h3>
        <SimpleTooltip text="Cálculos baseados na Lei 10.101/2000">
            <HelpCircle className="w-5 h-5 text-gray-500 hover:text-white transition-colors cursor-help" />
        </SimpleTooltip>
      </div>
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 text-xs text-blue-900 leading-relaxed flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
                <strong className="block mb-1 text-blue-700 font-bold">Base de Cálculo</strong>
                Utilize a média salarial do ano de 2025. Se houve alteração salarial, faça a média ponderada.
            </div>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label className="block text-[10px] font-bold text-[#8899A6] mb-2 uppercase tracking-[0.15em]">Salário Base (R$)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8899A6] text-sm font-bold">R$</span>
                    <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full pl-11 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none transition-all font-semibold text-[#0F1419] placeholder-gray-300" placeholder="0.00" />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-[#8899A6] mb-2 uppercase tracking-[0.15em]">Data de Admissão</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none transition-all text-[#0F1419] text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#8899A6] mb-2 uppercase tracking-[0.15em]">Nível Hierárquico</label>
            <select value={targetMultiples} onChange={(e) => setTargetMultiples(Number(e.target.value))} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none text-sm text-[#0F1419] font-medium">
                <option value={1.5}>Operacional (Target: 1.5 salários)</option>
                <option value={3}>Analista / Tático (Target: 3 salários)</option>
                <option value={4}>Liderança / Especialista (Target: 4 salários)</option>
                <option value={5}>Diretoria (Target: 5 salários)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-3">
                <label className="text-[10px] font-bold text-[#8899A6] uppercase tracking-[0.15em]">Avaliação Individual</label>
                <span className="text-sm font-black text-[#0F1419] tabular-nums">{individualScore}%</span>
            </div>
            <input type="range" min="0" max="150" value={individualScore} onChange={(e) => setIndividualScore(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0F1419]" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { label: 'Empresa', pct: '40%', value: companyResult },
              { label: 'Área', pct: '30%', value: areaResult },
              { label: 'Individual', pct: '30%', value: individualScore },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                <span className="block text-[9px] text-[#8899A6] uppercase font-bold tracking-wider">{item.label} ({item.pct})</span>
                <span className="font-black text-[#0F1419] text-lg tabular-nums">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden border border-gray-100">
            {!result.isEligible && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-10 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 mb-4">
                      <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0F1419]">Não Elegível</h3>
                    <p className="text-xs text-[#536471] mt-2 max-w-[220px] leading-relaxed">{result.eligibilityReason}</p>
                </div>
            )}
            <div>
                <div className="text-center pb-8 border-b border-gray-200/70">
                    <span className="text-[#8899A6] text-[10px] uppercase tracking-[0.2em] font-bold">Bônus Bruto Estimado</span>
                    <div className="text-5xl font-black text-[#0F1419] mt-3 tracking-tight tabular-nums">{formatCurrency(result.gross)}</div>
                </div>
                <div className="space-y-5 py-8">
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-[#536471] flex items-center gap-2.5 font-medium"><CalendarDays className="w-4 h-4 text-[#8899A6]" /> Proporcionalidade</span>
                        <span className="font-mono font-bold text-[#0F1419] tabular-nums">{result.timeFactor}%</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-[#536471] flex items-center gap-2.5 font-medium"><TrendingUp className="w-4 h-4 text-[#1D9BF0]" /> Score Ponderado</span>
                        <span className="font-mono font-bold text-[#1D9BF0] tabular-nums">{result.weightedScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm items-center pt-3 border-t border-dashed border-gray-200/70">
                        <span className="text-[#536471] font-medium">Imposto de Renda (IRRF)</span>
                        <span className="text-rose-500 font-mono font-bold tabular-nums">- {formatCurrency(result.tax)}</span>
                    </div>
                </div>
            </div>
            <div className="bg-emerald-50 -mx-8 -mb-8 p-8 border-t border-emerald-100 rounded-b-2xl">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-emerald-900 font-bold text-sm block">Líquido a Receber</span>
                        <span className="text-[10px] text-emerald-600 font-medium">Estimativa aproximada</span>
                    </div>
                    <span className="text-4xl font-black text-emerald-700 tracking-tight tabular-nums">{formatCurrency(result.net)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================
   LOGIN SCREEN
   ========================================= */
const LoginScreen = ({ onLogin, users }) => {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
   
  const handleSubmit = (e) => {
    e.preventDefault();
    if (users.length === 0 && user === 'admin' && password === 'admin') {
      const adminUser = { id: 'temp-admin', user: 'admin', role: 'ADMIN', label: 'Admin Temporário', area: 'Todas' };
      onLogin(adminUser);
      return;
    }
    const found = users.find(u => u.user === user && u.pass === password);
    if (found) { onLogin(found); } 
    else { setError('Acesso negado. Verifique suas credenciais.'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-40"></div>
      </div>
      
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-12 max-w-[380px] w-full relative animate-scale-in">
        <div className="text-center mb-10">
            <div className="flex justify-center mb-8">
                <div className="relative">
                  <img src={LOGO_URL} alt="Logo SAF Botafogo" className="h-20 w-auto object-contain drop-shadow-xl" />
                  <div className="absolute inset-0 bg-black/5 rounded-full blur-2xl scale-150"></div>
                </div>
            </div>
            <h1 className="text-xl font-black text-[#0F1419] tracking-tight">Portal de Performance</h1>
            <p className="text-sm text-[#8899A6] mt-1 font-medium">SAF Botafogo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#8899A6] mb-2 uppercase tracking-[0.15em]">Usuário</label>
            <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8899A6]" />
                <input type="text" className="pl-12 w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none transition-all text-sm font-semibold text-[#0F1419] placeholder-gray-300" placeholder="ID Corporativo" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#8899A6] mb-2 uppercase tracking-[0.15em]">Senha</label>
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8899A6]" />
                <input type="password" className="pl-12 w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none transition-all text-sm font-semibold text-[#0F1419] placeholder-gray-300" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {error && (
            <div className="flex items-center text-rose-600 text-xs bg-rose-50 p-4 rounded-xl border border-rose-100 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 mr-2.5 flex-shrink-0" />{error}
            </div>
          )}
          <button type="submit" className="w-full bg-[#0F1419] text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-300/30 text-sm uppercase tracking-[0.1em] mt-2 active:scale-[0.98]">
            Entrar na Plataforma
          </button>
        </form>
        {users.length === 0 && (
          <div className="mt-6 text-center text-[10px] text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-100 font-medium">
            <strong className="block mb-1">Configuração Inicial</strong>
            Login: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin</code> / Senha: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">admin</code>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================
   ADMIN PANEL
   ========================================= */
const AdminPanel = ({ goals, users, budgets, milestones, setStatus }) => {
  const [tab, setTab] = useState('metas');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({});
  const milestoneInputRef = useRef(null);

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); };

  const handleEditGoal = (item) => { 
      let formattedDate = item.data_referencia || '';
      if (formattedDate && formattedDate.includes('/')) {
          const [day, month, year] = formattedDate.split('/');
          formattedDate = `${year}-${month}-${day}`;
      }
      setGoalForm({ ...item, data_referencia: formattedDate, status: item.status || 'Em andamento' }); 
      setIsEditingGoal(true); 
  };

  const handleNewGoal = () => { 
       setGoalForm({ tipo: 'Organizacional', diretoria: '', area: '', objetivo: '', kr: '', kpi: '', atingimento: 0, peso: 0, regua_0: '', regua_60: '', regua_100: '', regua_120: '', unidade: '', prazo: '', formula: '', resultado_mensal: 0, resultado_anual: 0, data_referencia: '', status: 'Em andamento', custom_id: '' }); 
       setIsEditingGoal(true); 
  };
   
  const handleSaveGoal = async (e) => { 
    e.preventDefault(); 
    setStatus({type:'loading', message:'Salvando meta...'});
    try {
      const finalData = { ...goalForm, atingimento: cleanNumber(goalForm.atingimento), peso: cleanNumber(goalForm.peso), resultado_mensal: cleanNumber(goalForm.resultado_mensal), resultado_anual: cleanNumber(goalForm.resultado_anual) };
      if (goalForm.id) {
        const docRef = getDocRef('goals', goalForm.id);
        await setDoc(docRef, finalData, { merge: true });
      } else {
        const newRef = doc(getCollectionRef('goals')); 
        await setDoc(newRef, { ...finalData, id: newRef.id });
      }
      setStatus({type:'success', message:'Dados atualizados com sucesso.'});
      setIsEditingGoal(false);
    } catch (err) { console.error(err); setStatus({type:'error', message:'Não foi possível salvar os dados.'}); }
  };
   
  const handleGoalChange = (e) => { setGoalForm({ ...goalForm, [e.target.name]: e.target.value }); };

  const handleDeleteGoal = async (id) => {
    if(!window.confirm('Confirma a exclusão deste item?')) return;
    setStatus({type:'loading', message:'Processando exclusão...'});
    try { await deleteDoc(getDocRef('goals', id)); setStatus({type:'success', message:'Item removido.'}); }
    catch(err) { setStatus({type:'error', message:'Erro na exclusão.'}); }
  };

  const handleDeleteAllGoals = async () => {
    if(!window.confirm('ATENÇÃO: Ação irreversível. Confirma limpeza total?')) return;
    setStatus({type:'loading', message:'Limpando base de dados...'});
    try {
      const colRef = getCollectionRef('goals');
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) { setStatus({type:'success', message:'Base já estava vazia.'}); return; }
      const docsToDelete = snapshot.docs;
      const chunkSize = 400; const chunks = [];
      for (let i = 0; i < docsToDelete.length; i += chunkSize) { chunks.push(docsToDelete.slice(i, i + chunkSize)); }
      let deletedCount = 0;
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(docSnapshot => { batch.delete(docSnapshot.ref); });
        await batch.commit();
        deletedCount += chunk.length;
      }
      setStatus({type:'success', message: `${deletedCount} registros removidos.`});
    } catch(err) { setStatus({type:'error', message:'Falha na operação: ' + err.message}); }
  };

  const [userForm, setUserForm] = useState({ user: '', pass: '', role: 'AREA', label: '', area: '' });
  const [editingUser, setEditingUser] = useState(null);
   
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setStatus({type:'loading', message:'Salvando perfil...'});
    try {
      if (editingUser) {
        await setDoc(getDocRef('users', editingUser.id), { ...userForm, id: editingUser.id });
        setEditingUser(null);
      } else {
        const newRef = doc(getCollectionRef('users'));
        await setDoc(newRef, { ...userForm, id: newRef.id });
      }
      setUserForm({ user: '', pass: '', role: 'AREA', label: '', area: '' });
      setStatus({type:'success', message:'Perfil salvo.'});
    } catch(err) { setStatus({type:'error', message:'Erro ao salvar.'}); }
  };
   
  const handleDeleteUser = async (id) => { 
    if(window.confirm('Remover acesso?')) {
       try { await deleteDoc(getDocRef('users', id)); setStatus({type:'success', message:'Acesso removido.'}); } 
       catch(err) { setStatus({type:'error', message:'Erro ao remover.'}); }
    }
  };

  const handleBudgetChange = async (area, val) => {
    const numVal = cleanNumber(val);
    try { await setDoc(getDocRef('budgets', area), { id: area, value: numVal }); } catch(err) { console.error("Erro budget", err); }
  };

  const handleMilestoneImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.XLSX) { setStatus({ type: 'error', message: 'Biblioteca XLSX não carregada.' }); return; }
    setStatus({ type: 'loading', message: 'Lendo arquivo Excel...' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) { setStatus({ type: 'error', message: 'Arquivo vazio ou sem cabeçalho.' }); return; }
        const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
        const rows = jsonData.slice(1);
        const batch = writeBatch(db);
        let count = 0;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0 || row.every(cell => !cell)) continue;
          const obj = {};
          headers.forEach((header, index) => {
             let val = row[index];
             if (val === undefined || val === null) val = '';
             val = String(val).replace(/"/g, '').trim();
             if (header.includes('id') && header.includes('meta')) obj.goal_id = val;
             else if (header.includes('projeto') || header.includes('nome')) obj.projeto = val;
             else if (header.includes('etapa')) obj.etapa = val;
             else if (header.includes('peso') || header.includes('%')) obj.peso = cleanNumber(val);
             else if (header.includes('prazo')) {
                if (!isNaN(Number(row[index])) && Number(row[index]) > 20000) { obj.prazo = excelDateToJSDate(Number(row[index])); }
                else if (val.match(/^\d{2}\/\d{2}\/\d{4}$/)) { const [day, month, year] = val.split('/'); obj.prazo = `${year}-${month}-${day}`; }
                else { obj.prazo = val; }
             }
          });
          if (obj.goal_id && obj.etapa) {
             const ref = doc(getCollectionRef('milestones'));
             batch.set(ref, { ...obj, status: 'pending', id: ref.id });
             count++;
          }
        }
        await batch.commit();
        setStatus({ type: 'success', message: `${count} etapas importadas (XLSX).` });
      } catch (err) { console.error(err); setStatus({ type: 'error', message: 'Erro ao processar planilha.' }); }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const handleMilestoneClick = () => milestoneInputRef.current?.click();
  
  const handleExportMilestones = () => {
      if (!window.XLSX) { setStatus({ type: 'error', message: 'Biblioteca XLSX não carregada.' }); return; }
      if (milestones.length === 0) { setStatus({ type: 'error', message: 'Sem dados de etapas para exportar.' }); return; }
      setStatus({ type: 'loading', message: 'Gerando planilha...' });
      try {
        const exportData = milestones.map(m => ({ 'ID Meta': m.goal_id, 'Projeto': m.projeto, 'Etapa': m.etapa, 'Peso (%)': m.peso, 'Prazo': m.prazo ? m.prazo.split('-').reverse().join('/') : '', 'Status': m.status === 'done' ? 'Concluída' : 'Pendente' }));
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Etapas");
        window.XLSX.writeFile(wb, `etapas_saf_botafogo_${new Date().toISOString().slice(0,10)}.xlsx`);
        setStatus({ type: 'success', message: 'Download iniciado.' });
      } catch (e) { console.error(e); setStatus({ type: 'error', message: 'Falha na exportação.' }); }
  };

  const uniqueAreas = useMemo(() => {
    const areas = new Set();
    goals.forEach(g => { if(g.area) areas.add(g.area) });
    users.forEach(u => { if(u.area && u.area !== 'Todas') areas.add(u.area) });
    return Array.from(areas).sort();
  }, [goals, users]);

  // Goal editing form
  if (isEditingGoal) {
      const inputClass = "w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#1D9BF0] text-sm font-medium text-[#0F1419] transition-all";
      return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 max-w-4xl mx-auto animate-scale-in">
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
            <h2 className="text-xl font-black flex items-center gap-3 text-[#0F1419]">
                <div className="p-2.5 bg-gray-100 rounded-xl"><Edit className="w-5 h-5 text-[#536471]" /></div>
                {goalForm.id ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <button onClick={() => setIsEditingGoal(false)} className="text-[#8899A6] hover:text-[#0F1419] transition p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div className="bg-blue-50/60 p-5 rounded-xl border border-blue-100 mb-6">
               <label className="block text-[10px] font-bold text-blue-700 uppercase mb-2 tracking-[0.15em]">ID Meta (Customizado)</label>
               <input type="text" name="custom_id" value={goalForm.custom_id || ''} onChange={handleGoalChange} className="w-full p-3 bg-white border-2 border-blue-100 rounded-xl outline-none focus:border-blue-400 text-sm font-mono font-semibold text-[#0F1419]" placeholder="Ex: 25-ACP-01" />
               <p className="text-[10px] text-blue-600 mt-2 font-medium">Este ID será usado para vincular com a planilha de etapas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Tipo</label><select name="tipo" value={goalForm.tipo} onChange={handleGoalChange} className={inputClass}>{GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}<option value="Outro">Outro</option></select></div>
              <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Diretoria</label><input type="text" name="diretoria" value={goalForm.diretoria} onChange={handleGoalChange} className={inputClass} required /></div>
              <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Área</label><input type="text" name="area" value={goalForm.area} onChange={handleGoalChange} className={inputClass} required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">KPI</label><input type="text" name="kpi" value={goalForm.kpi} onChange={handleGoalChange} className={inputClass} required /></div>
                <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Data Ref.</label><input type="date" name="data_referencia" value={goalForm.data_referencia} onChange={handleGoalChange} className={inputClass} /></div>
                <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Status</label><select name="status" value={goalForm.status} onChange={handleGoalChange} className={inputClass}><option value="Em andamento">Em andamento</option><option value="Concluída">Concluída</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Objetivo</label><input type="text" name="objetivo" value={goalForm.objetivo} onChange={handleGoalChange} className={inputClass} /></div>
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">KR (Key Result)</label><input type="text" name="kr" value={goalForm.kr} onChange={handleGoalChange} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Peso (%)</label><input type="text" name="peso" value={goalForm.peso} onChange={handleGoalChange} className={inputClass} /></div>
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Atingimento (%)</label><input type="text" name="atingimento" value={goalForm.atingimento} onChange={handleGoalChange} className={inputClass} /></div>
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Result. Mensal</label><input type="text" name="resultado_mensal" value={goalForm.resultado_mensal} onChange={handleGoalChange} className={inputClass} /></div>
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Result. Anual</label><input type="text" name="resultado_anual" value={goalForm.resultado_anual} onChange={handleGoalChange} className={inputClass} /></div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditingGoal(false)} className="px-6 py-3 text-sm font-semibold text-[#536471] hover:text-[#0F1419] hover:bg-gray-50 rounded-xl transition-all">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-[#0F1419] text-white rounded-xl text-sm font-bold hover:bg-black shadow-lg shadow-gray-200/50 transition-all flex items-center gap-2 active:scale-[0.98]"><Save className="w-4 h-4" /> Salvar Alterações</button>
            </div>
          </form>
        </div>
      );
  }

  const adminTabBtnClass = (t) => `px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-[0.1em] transition-all ${tab === t ? 'bg-[#0F1419] text-white shadow-md' : 'text-[#536471] hover:text-[#0F1419] hover:bg-gray-50'}`;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm gap-6">
         <div>
           <h2 className="text-2xl font-black text-[#0F1419] tracking-tight">Painel Administrativo</h2>
           <p className="text-[#536471] text-sm mt-1 font-medium">Gestão centralizada de indicadores e acessos.</p>
         </div>
         <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            {['metas', 'usuarios', 'financeiro'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={adminTabBtnClass(t)}>{t}</button>
            ))}
         </div>
       </div>

       <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-1 text-xs">
         <div className="flex items-center gap-2 font-bold text-[#536471] uppercase tracking-wider text-[10px]"><Database className="w-3.5 h-3.5" /> Status do Banco de Dados</div>
         <code className="text-[#8899A6] font-mono text-[11px] mt-1">Path: artifacts/{getAppId()}/public/data</code>
       </div>

       {tab === 'metas' && (
         <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center bg-gray-50/50 gap-3">
             <div className="flex items-center gap-2 text-[#536471] font-semibold text-sm"><Database className="w-4 h-4" /> {goals.length} registros</div>
             <div className="flex gap-3 flex-wrap">
                <input type="file" ref={milestoneInputRef} onChange={handleMilestoneImport} className="hidden" accept=".xlsx, .xls" />
                <SimpleTooltip text="Exportar etapas (XLSX)"><button onClick={handleExportMilestones} className="bg-white text-[#536471] border-2 border-gray-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Exportar Etapas</button></SimpleTooltip>
                <SimpleTooltip text="XLSX: id_meta, projeto, etapa, peso, prazo"><button onClick={handleMilestoneClick} className="bg-white text-[#536471] border-2 border-gray-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-gray-50 hover:border-gray-200 transition-all shadow-sm flex items-center gap-2"><ListTodo className="w-3.5 h-3.5" /> Importar Etapas</button></SimpleTooltip>
                <button onClick={handleDeleteAllGoals} className="text-rose-600 hover:text-rose-800 text-xs font-bold uppercase tracking-wide px-4 py-2 border-2 border-rose-100 rounded-xl hover:bg-rose-50 transition-all">Limpar Base</button>
                <button onClick={handleNewGoal} className="bg-[#0F1419] text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-black transition-all shadow-lg shadow-gray-200/50 flex items-center gap-2 active:scale-[0.98]"><Plus className="w-3.5 h-3.5" /> Nova Meta</button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[11px]">
               <thead className="bg-gray-50 text-[#8899A6] font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                 <tr>
                   <th className="px-6 py-3">ID Meta</th>
                   <th className="px-6 py-3">Tipo / Área</th>
                   <th className="px-6 py-3 w-1/4">Indicador (KPI/KR)</th>
                   <th className="px-6 py-3">Referência</th>
                   <th className="px-6 py-3 text-center">Status</th>
                   <th className="px-6 py-3 text-center">Peso</th>
                   <th className="px-6 py-3 text-center">Atingimento</th>
                   <th className="px-6 py-3 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {goals.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                     <td className="px-6 py-3 font-mono text-[#536471] group-hover:text-[#0F1419] font-bold">
                        <div className="flex items-center gap-2">
                            {item.custom_id ? (
                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100 text-[10px] font-bold">{item.custom_id}</span>
                            ) : (
                                <span className="text-gray-300 italic">-</span>
                            )}
                            {item.custom_id && (
                                <SimpleTooltip text="Copiar ID"><button onClick={() => copyToClipboard(item.custom_id)} className="p-1 hover:bg-gray-200 rounded-lg text-[#8899A6] hover:text-blue-600 transition"><Copy className="w-3 h-3" /></button></SimpleTooltip>
                            )}
                        </div>
                     </td>
                     <td className="px-6 py-3">
                        <div className="flex flex-col">
                            <span className="font-bold text-[#0F1419]">{item.area}</span>
                            <span className="text-[9px] text-[#8899A6] uppercase font-semibold">{item.tipo}</span>
                        </div>
                     </td>
                     <td className="px-6 py-3 font-medium text-[#536471] break-words whitespace-normal min-w-[200px]">{item.kr || item.kpi}</td>
                     <td className="px-6 py-3 text-[10px] text-[#8899A6] font-mono">{safeDateDisplay(item.data_referencia)}</td>
                     <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${item.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {item.status || 'Em andamento'}
                        </span>
                     </td>
                     <td className="px-6 py-3 text-center text-[#8899A6] font-semibold">{item.peso}%</td>
                     <td className="px-6 py-3 text-center font-bold text-[#0F1419] tabular-nums">{item.atingimento}%</td>
                     <td className="px-6 py-3 text-right">
                       <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEditGoal(item)} className="p-2 text-[#536471] hover:text-[#1D9BF0] hover:bg-blue-50 rounded-lg transition"><Edit className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleDeleteGoal(item.id)} className="p-2 text-[#536471] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {tab === 'usuarios' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-gray-100 h-fit">
             <h3 className="font-bold text-[#0F1419] mb-6 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Users className="w-4 h-4 text-[#536471]" /></div> Gerenciar Acesso</h3>
             <form onSubmit={handleSaveUser} className="space-y-5">
               {[
                 { label: 'Login', value: userForm.user, key: 'user' },
                 { label: 'Senha', value: userForm.pass, key: 'pass' },
                 { label: 'Nome de Exibição', value: userForm.label, key: 'label', placeholder: 'Ex: Diretoria Financeira' },
               ].map(f => (
                 <div key={f.key}><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">{f.label}</label><input type="text" className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#1D9BF0] text-sm transition-all font-medium" value={f.value} onChange={e => setUserForm({...userForm, [f.key]: e.target.value})} required placeholder={f.placeholder || ''} /></div>
               ))}
               <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Perfil</label><select className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#1D9BF0] text-sm transition-all font-medium" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}><option value="AREA">Área (Padrão)</option><option value="CEO">Executivo (CEO)</option><option value="ADMIN">Administrador</option></select></div>
               {userForm.role === 'AREA' && (
                 <div><label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-2 tracking-[0.15em]">Área Vinculada</label><input type="text" className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-[#1D9BF0] text-sm transition-all font-medium" value={userForm.area} onChange={e => setUserForm({...userForm, area: e.target.value})} placeholder="Nome exato da área" /></div>
               )}
               <div className="pt-4 flex gap-3">
                 <button type="submit" className="flex-1 bg-[#0F1419] text-white py-3 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-black transition-all shadow-lg shadow-gray-200/50 active:scale-[0.98]">Salvar</button>
                 {editingUser && <button type="button" onClick={() => { setEditingUser(null); setUserForm({ user: '', pass: '', role: 'AREA', label: '', area: '' }) }} className="px-5 py-3 border-2 border-gray-200 rounded-xl text-[#536471] text-sm font-semibold hover:bg-gray-50 transition">Cancelar</button>}
               </div>
             </form>
           </div>
           <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-[#8899A6] border-b border-gray-200 uppercase text-[10px] tracking-wider font-bold"><tr><th className="px-6 py-4">Usuário</th><th className="px-6 py-4">Credenciais</th><th className="px-6 py-4">Perfil</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
               <tbody className="divide-y divide-gray-50">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-gray-50/50 transition">
                     <td className="px-6 py-4"><div className="flex flex-col"><span className="font-bold text-[#0F1419]">{u.label}</span><span className="text-xs text-[#8899A6]">{u.area}</span></div></td>
                     <td className="px-6 py-4 font-mono text-xs text-[#8899A6]">{u.user} <span className="mx-2 text-gray-200">|</span> ••••••</td>
                     <td className="px-6 py-4"><span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border ${u.role === 'ADMIN' ? 'bg-violet-50 text-violet-700 border-violet-100' : u.role === 'CEO' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-[#536471] border-gray-200'}`}>{u.role}</span></td>
                     <td className="px-6 py-4 text-right">
                       <button onClick={() => { setEditingUser(u); setUserForm(u); }} className="text-[#1D9BF0] hover:text-blue-800 text-xs font-bold uppercase mr-4">Editar</button>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-rose-500 hover:text-rose-800 text-xs font-bold uppercase">Excluir</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {tab === 'financeiro' && (
         <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-bold text-[#0F1419] flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><Wallet className="w-4 h-4 text-[#536471]" /></div> Orçamento por Área (Target)</h3>
              <p className="text-xs text-[#536471] mt-1 ml-11 font-medium">Definição de budget para cálculo de bônus.</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueAreas.map(area => (
                  <div key={area} className="bg-white p-5 rounded-xl border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group">
                    <label className="block text-[10px] font-bold text-[#8899A6] uppercase mb-3 tracking-[0.15em] group-hover:text-[#0F1419] transition-colors">{area}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8899A6] font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#1D9BF0] outline-none font-mono font-bold text-[#0F1419] text-lg transition-all bg-gray-50 focus:bg-white"
                        value={budgets[area] || ''}
                        onChange={(e) => handleBudgetChange(area, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
         </div>
       )}
    </div>
  );
};

/* =========================================
   MAIN APP
   ========================================= */
export default function App() {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [milestones, setMilestones] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
   
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('saf_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
   
  const [activeTab, setActiveTab] = useState('company'); 
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);
   
  const handleLogin = (u) => {
    localStorage.setItem('saf_user_session', JSON.stringify(u));
    setUser(u);
    if(u.role === 'ADMIN') setActiveTab('admin'); 
    else if(u.role === 'CEO') setActiveTab('overview'); 
    else setActiveTab('company');
  };

  const handleLogout = () => {
    localStorage.removeItem('saf_user_session');
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => { setFirebaseUser(u); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubGoals = onSnapshot(getCollectionRef('goals'), (snapshot) => { setGoals(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))); });
    const unsubUsers = onSnapshot(getCollectionRef('users'), (snapshot) => { setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))); });
    const unsubBudgets = onSnapshot(getCollectionRef('budgets'), (snapshot) => { const obj = {}; snapshot.docs.forEach(doc => { obj[doc.id] = doc.data().value; }); setBudgets(obj); });
    const unsubMilestones = onSnapshot(getCollectionRef('milestones'), (snapshot) => { setMilestones(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))); });
    return () => { unsubGoals(); unsubUsers(); unsubBudgets(); unsubMilestones(); };
  }, [firebaseUser]);

  const toggleMilestone = async (milestone, allMilestones, goal) => {
     try {
         const newStatus = milestone.status === 'done' ? 'pending' : 'done';
         await updateDoc(getDocRef('milestones', milestone.id), { status: newStatus });
         const updatedMilestones = allMilestones.map(m => m.id === milestone.id ? { ...m, status: newStatus } : m);
         const completedWeight = updatedMilestones.filter(m => m.status === 'done').reduce((acc, curr) => acc + (curr.peso || 0), 0);
         const totalWeight = updatedMilestones.reduce((acc, curr) => acc + (curr.peso || 0), 0);
         const newProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
         const finalAtingimento = Math.round(newProgress * 10) / 10;
         await updateDoc(getDocRef('goals', goal.id), { atingimento: finalAtingimento, status: finalAtingimento >= 100 ? 'Concluída' : 'Em andamento' });
     } catch (err) { console.error("Erro ao atualizar etapa", err); setStatus({ type: 'error', message: 'Erro ao sincronizar etapa.' }); }
  };

  const groupData = (rawData) => {
    const cleanData = Array.isArray(rawData) ? rawData.filter(item => item && item.area && (item.kpi || item.kr)) : [];
    const groups = {};
    cleanData.forEach(item => {
      const identifier = `${item.kpi || ''}-${item.kr || ''}`;
      const key = `${normalizeText(item.area)}-${normalizeText(identifier)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.values(groups).map(group => {
      const sorted = group.sort((a, b) => {
        const dateA = a.data_referencia ? new Date(a.data_referencia) : new Date(0);
        const dateB = b.data_referencia ? new Date(b.data_referencia) : new Date(0);
        return dateB - dateA;
      });
      const filledItem = sorted.find(item => 
        (item.resultado_mensal !== undefined && item.resultado_mensal !== '' && item.resultado_mensal !== null && item.resultado_mensal !== 0) ||
        (item.resultado_anual !== undefined && item.resultado_anual !== '' && item.resultado_anual !== null && item.resultado_anual !== 0)
      );
      const filledAtingimento = sorted.find(item => item.atingimento !== undefined && item.atingimento !== '' && item.atingimento !== null);
      const head = filledItem || filledAtingimento || sorted[0];
      return { ...head, history: sorted };
    });
  };

  const companyGoals = useMemo(() => {
    const raw = goals.filter(d => normalizeText(d.tipo) === 'global');
    return groupData(raw).sort((a, b) => b.atingimento - a.atingimento);
  }, [goals]);

  const companyResult = useMemo(() => {
    const standardGoals = companyGoals.filter(g => !String(g.kpi).toLowerCase().includes('copa do mundo de clubes'));
    const extraGoal = companyGoals.find(g => String(g.kpi).toLowerCase().includes('copa do mundo de clubes'));
    const totalWeight = standardGoals.reduce((acc, curr) => acc + (curr.peso || 0), 0);
    const weightedSum = standardGoals.reduce((acc, curr) => acc + (curr.atingimento * (curr.peso || 0)), 0);
    let baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    if (extraGoal) { baseScore += (Math.min(extraGoal.atingimento, 100) / 100) * 20; }
    return Math.round(baseScore);
  }, [companyGoals]);

  const areaGoals = useMemo(() => {
    if (!user || (user.role === 'CEO' || user.role === 'ADMIN')) return [];
    const raw = goals.filter(d => {
       const isGlobal = normalizeText(d.tipo) === 'global';
       const matchArea = normalizeText(d.area) === normalizeText(user.area);
       const matchDiretoria = normalizeText(d.diretoria) === normalizeText(user.area);
       return !isGlobal && (matchArea || matchDiretoria);
    });
    return groupData(raw).sort((a, b) => b.atingimento - a.atingimento);
  }, [goals, user]);

  const areaResult = useMemo(() => {
    if (areaGoals.length === 0) return 0;
    const totalWeight = areaGoals.reduce((acc, curr) => acc + (curr.peso || 0), 0);
    const weightedSum = areaGoals.reduce((acc, curr) => acc + (curr.atingimento * (curr.peso || 0)), 0);
    if (totalWeight === 0) return Math.round(areaGoals.reduce((acc, curr) => acc + curr.atingimento, 0) / areaGoals.length);
    return Math.round(weightedSum / totalWeight);
  }, [areaGoals]);

  const allAreasSummary = useMemo(() => {
    const groupedAll = groupData(goals.filter(d => normalizeText(d.tipo) !== 'global'));
    const areas = [...new Set(groupedAll.map(d => d.area))];
    return areas.map(areaName => {
      const areaSpecificGoals = groupedAll.filter(d => d.area === areaName);
      const totalWeight = areaSpecificGoals.reduce((acc, curr) => acc + (curr.peso || 0), 0);
      const weightedSum = areaSpecificGoals.reduce((acc, curr) => acc + (curr.atingimento * (curr.peso || 0)), 0);
      const avg = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : (areaSpecificGoals.length ? Math.round(areaSpecificGoals.reduce((acc, c) => acc + c.atingimento, 0) / areaSpecificGoals.length) : 0);
      const budget = budgets[areaName] || 0;
      const projectedPayment = budget * (avg / 100);
      return { name: areaName, score: avg, projectedPayment, budget };
    }).sort((a,b) => b.score - a.score);
  }, [goals, budgets]);

  const totalBonusProjection = useMemo(() => allAreasSummary.reduce((acc, curr) => acc + curr.projectedPayment, 0), [allAreasSummary]);

  const handleExport = () => { 
    if (!window.XLSX) { setStatus({ type: 'error', message: 'Biblioteca XLSX não carregada.' }); return; }
    if (goals.length === 0) { setStatus({ type: 'error', message: 'Sem dados para exportar.' }); return; }
    setStatus({ type: 'loading', message: 'Gerando planilha...' });
    try {
        const exportData = goals.map(g => ({ 'ID Meta': g.custom_id || '', 'Tipo': g.tipo, 'Diretoria': g.diretoria, 'Área': g.area, 'KPI': g.kpi, 'KR': g.kr, 'Objetivo': g.objetivo, 'Data Ref': g.data_referencia, 'Status': g.status, 'Peso (%)': g.peso, 'Atingimento (%)': g.atingimento, 'Resultado Mensal': g.resultado_mensal, 'Resultado Anual': g.resultado_anual, 'Unidade': g.unidade, 'Prazo': g.prazo, 'Fórmula': g.formula, 'Explicação': g.explicacao }));
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "Metas");
        window.XLSX.writeFile(wb, `metas_saf_botafogo_${new Date().toISOString().slice(0,10)}.xlsx`);
        setStatus({ type: 'success', message: 'Download iniciado.' });
    } catch (e) { console.error(e); setStatus({ type: 'error', message: 'Falha na exportação.' }); }
  };
   
  const handleImportClick = () => { fileInputRef.current?.click(); };
   
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!window.XLSX) { setStatus({ type: 'error', message: 'Biblioteca XLSX não carregada.' }); return; }
    setStatus({ type: 'loading', message: 'Lendo arquivo Excel...' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 2) { setStatus({ type: 'error', message: 'Planilha vazia ou sem cabeçalho.' }); return; }
        const headers = jsonData[0].map(h => String(h).trim().toLowerCase().replace(/"/g, ''));
        const rows = jsonData.slice(1);
        let totalProcessed = 0;
        const chunks = []; const chunkSize = 450;
        for (let i = 0; i < rows.length; i += chunkSize) { chunks.push(rows.slice(i, i + chunkSize)); }
        for (const chunk of chunks) {
            const innerBatch = writeBatch(db); 
            chunk.forEach((row) => {
                  if (row.length === 0 || row.every(cell => !cell)) return;
                  const obj = {}; 
                  headers.forEach((header, index) => { 
                     let value = row[index]; if(value === undefined || value === null) value = ''; value = String(value).trim();
                     let key = header; 
                     if(key.includes('id') && key.includes('meta')) key = 'custom_id';
                     else if(key.includes('kpi') || key.includes('indicador')) key = 'kpi'; 
                     else if(key.includes('peso')) key = 'peso'; 
                     else if(key.includes('atingimento')) key = 'atingimento'; 
                     else if(key.includes('diretoria')) key = 'diretoria'; 
                     else if(key.includes('tipo')) key = 'tipo'; 
                     else if(key.includes('área') || key.includes('area')) key = 'area'; 
                     else if(key.includes('mensal') || key.includes('realizado_mes') || key === 'mes') key = 'resultado_mensal'; 
                     else if(key.includes('anual') || key.includes('ytd') || key.includes('acumulado') || key.includes('realizado_ano')) key = 'resultado_anual'; 
                     else if(key.includes('data') || key.includes('ref')) key = 'data_referencia'; 
                     else if(key.includes('kr') || key.includes('key result') || key.includes('resultado chave')) key = 'kr';
                     if (['atingimento', 'peso', 'resultado_mensal', 'resultado_anual'].includes(key)) { 
                         const num = cleanNumber(value); 
                         if (['atingimento', 'peso'].includes(key) && !String(value).includes('%') && num <= 2.0 && num !== 0) { obj[key] = num * 100; } 
                         else { obj[key] = num; } 
                     } else if (key === 'data_referencia') { 
                         if (!isNaN(Number(row[index])) && Number(row[index]) > 20000) { obj[key] = excelDateToJSDate(Number(row[index])); }
                         else if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) { const [day, month, year] = value.split('/'); obj[key] = `${year}-${month}-${day}`; } 
                         else { obj[key] = value; } 
                     } else { obj[key] = value || ''; } 
                  });
                  if (obj.atingimento !== undefined) { const val = Number(obj.atingimento); obj.status = (!isNaN(val) && val >= 100) ? 'Concluída' : 'Em andamento'; } else { obj.status = 'Em andamento'; }
                  let ref;
                  if (obj.id) { ref = getDocRef('goals', obj.id); } else { ref = doc(getCollectionRef('goals')); }
                  innerBatch.set(ref, { ...obj, id: ref.id }); 
                  totalProcessed++;
            });
            await innerBatch.commit();
        }
        setStatus({ type: 'success', message: `${totalProcessed} registros processados.` });
      } catch (error) { console.error(error); setStatus({ type: 'error', message: 'Erro no processamento.' }); }
    }; 
    reader.onerror = () => setStatus({ type: 'error', message: 'Falha na leitura.' }); 
    reader.readAsArrayBuffer(file);
    event.target.value = ''; 
  };
   
  const closeStatus = () => setStatus({ type: 'idle', message: '' });

  // LOADING STATE
  if (!firebaseUser) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <GlobalStyles />
      <div className="flex flex-col items-center animate-fade-in">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-[#1D9BF0]" />
          <div className="absolute inset-0 bg-[#1D9BF0]/10 rounded-full blur-xl"></div>
        </div>
        <span className="text-[#8899A6] text-[10px] font-bold uppercase tracking-[0.2em] mt-4">Inicializando sistema</span>
      </div>
    </div>
  );

  // LOGIN
  if (!user) return <><GlobalStyles /><LoginScreen onLogin={handleLogin} users={users} /></>;

  const navTabClass = (t) => `px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] ${activeTab === t ? 'bg-[#0F1419] text-white shadow-lg shadow-gray-300/30' : 'text-[#536471] hover:text-[#0F1419] hover:bg-gray-50'}`;

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col text-[#0F1419] selection:bg-blue-100 selection:text-blue-900">
      <GlobalStyles />
      <StatusDialog status={status} onClose={closeStatus} />
      {selectedProject && <ProjectDialog goal={selectedProject} milestones={milestones} onClose={() => setSelectedProject(null)} onToggleMilestone={toggleMilestone} />}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
      
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[95%] mx-auto px-6 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-11 h-11 rounded-xl bg-[#0F1419] flex items-center justify-center shadow-lg shadow-gray-300/30">
                <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
                <h1 className="text-base font-black text-[#0F1419] leading-none tracking-tight">Portal de Performance</h1>
                <div className="flex items-center gap-2 mt-1.5">
                    <div className="relative">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full block"></span>
                      <span className="w-2 h-2 bg-emerald-400 rounded-full block absolute inset-0 animate-ping opacity-40"></span>
                    </div>
                    <p className="text-xs text-[#536471] font-semibold">{user.label}</p>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SimpleTooltip text="Exportar base completa (XLSX)">
                <button onClick={handleExport} className="p-2.5 text-[#8899A6] hover:text-[#0F1419] hover:bg-gray-100 rounded-xl transition-all"><Download className="w-5 h-5" /></button>
            </SimpleTooltip>
            <SimpleTooltip text="Importar planilha (XLSX)">
                <button onClick={handleImportClick} className="p-2.5 text-[#8899A6] hover:text-[#0F1419] hover:bg-gray-100 rounded-xl transition-all"><Upload className="w-5 h-5" /></button>
            </SimpleTooltip>
            <div className="h-8 w-px bg-gray-200 mx-2"></div>
            <button onClick={handleLogout} className="flex items-center text-xs font-bold text-[#536471] hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border-2 border-gray-100 hover:border-rose-100 px-4 py-2.5 rounded-xl transition-all uppercase tracking-[0.1em] gap-2 active:scale-[0.97]">
                <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-[95%] w-full mx-auto px-6 py-10">
        {/* NAVIGATION */}
        <div className="flex p-1.5 bg-white border-2 border-gray-100 rounded-2xl w-fit mb-10 shadow-sm mx-auto sm:mx-0">
          {user.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('admin')} className={navTabClass('admin')}>
                <span className="flex items-center gap-2"><Settings className="w-4 h-4" /> Administração</span>
            </button>
          )}
          <button onClick={() => setActiveTab('company')} className={navTabClass('company')}>Visão Global</button>
          {user.role === 'CEO' && (
            <button onClick={() => setActiveTab('overview')} className={navTabClass('overview')}>Painel CEO</button>
          )}
          {(user.role !== 'CEO' && user.role !== 'ADMIN') && (
            <button onClick={() => setActiveTab('area')} className={navTabClass('area')}>Minha Área</button>
          )}
        </div>

        {/* ADMIN TAB */}
        {activeTab === 'admin' && user.role === 'ADMIN' && (
          <AdminPanel goals={goals} users={users} budgets={budgets} milestones={milestones} setStatus={setStatus} />
        )}

        {/* COMPANY TAB */}
        {activeTab === 'company' && (
          <div className="animate-fade-in space-y-10">
            {/* Hero Card */}
            <div className="bg-gradient-to-br from-[#0F1419] via-[#1a2634] to-[#0F1419] rounded-3xl p-10 text-white shadow-2xl shadow-gray-400/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#1D9BF0]/[0.06] rounded-full -ml-10 -mb-10 blur-3xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-[#1D9BF0]" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Dashboard Corporativo</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Resultado Corporativo</h2>
                        <p className="text-gray-400 text-sm max-w-md leading-relaxed">Performance consolidada de todos os indicadores organizacionais globais.</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className={`text-7xl font-black tracking-tighter tabular-nums animate-count-up ${companyResult >= 100 ? 'text-emerald-400' : companyResult >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                          {companyResult}%
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mt-3 bg-white/[0.06] px-4 py-1.5 rounded-lg border border-white/10">Média Ponderada</span>
                    </div>
                </div>
            </div>
             
            <div>
                <h3 className="text-lg font-black text-[#0F1419] mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Target className="w-4 h-4 text-[#536471]" />
                    </div>
                    Metas Globais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companyGoals.map((goal, idx) => (<GoalCard key={goal.id} goal={goal} history={goal.history} onOpenProject={setSelectedProject} index={idx} />))}
                </div>
            </div>
          </div>
        )}

        {/* AREA TAB */}
        {activeTab === 'area' && user.role === 'AREA' && (
          <div className="animate-fade-in space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-8 rounded-2xl border-2 border-gray-100 flex items-center justify-between group">
                <div>
                    <h2 className="text-[10px] font-bold text-[#8899A6] uppercase tracking-[0.2em] mb-1">{user.area}</h2>
                    <p className="text-xl font-black text-[#0F1419]">Performance da Área</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-[#0F1419] tracking-tighter group-hover:scale-105 transition-transform tabular-nums">{areaResult}%</span>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${areaResult >= 100 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                      <PieChart className={`w-7 h-7 stroke-[1.5] ${areaResult >= 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    </div>
                </div>
              </div>
              
              <div className="glass-card p-8 rounded-2xl border-2 border-gray-100 flex items-center justify-between group">
                <div>
                    <h2 className="text-[10px] font-bold text-[#8899A6] uppercase tracking-[0.2em] mb-1">Empresa</h2>
                    <p className="text-xl font-black text-[#0F1419]">Gatilho Global</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-5xl font-black text-[#0F1419] tracking-tighter group-hover:scale-105 transition-transform tabular-nums">{companyResult}%</span>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-[#1D9BF0] stroke-[1.5]" />
                    </div>
                </div>
              </div>
            </div>

            <AreaScoreTable goals={areaGoals} finalScore={areaResult} />
            
            <div>
                <h3 className="text-lg font-black text-[#0F1419] mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-[#536471]" />
                    </div>
                    Metas Específicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areaGoals.length > 0 ? (areaGoals.map((goal, idx) => (<GoalCard key={goal.id} goal={goal} history={goal.history} onOpenProject={setSelectedProject} index={idx} />))) : (
                      <div className="col-span-full text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <LayoutGrid className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                        <p className="text-[#536471] font-semibold">Nenhuma meta cadastrada para esta área.</p>
                      </div>
                    )}
                </div>
            </div>
            
            <div id="calculator-section" className="mt-12 pt-8 border-t border-gray-200">
                <BonusCalculator companyResult={companyResult} areaResult={areaResult} />
            </div>
          </div>
        )}

        {/* CEO TAB */}
        {activeTab === 'overview' && user.role === 'CEO' && (
          <div className="animate-fade-in space-y-10">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Média Global', value: `${companyResult}%`, sub: 'Consolidado Corporativo', icon: TrendingUp, iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-500' },
                  { label: 'Áreas Monitoradas', value: allAreasSummary.length, sub: 'Diretorias ativas', icon: Users, iconBg: 'bg-blue-50 border-blue-100', iconColor: 'text-[#1D9BF0]' },
                  { label: 'Budget Bônus (Target)', value: formatCurrency(totalBonusProjection), sub: 'Projeção de desembolso', icon: DollarSign, iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-500' },
                ].map((card, idx) => (
                  <div key={card.label} className={`animate-fade-up stagger-${idx + 1} glass-card p-7 rounded-2xl border-2 border-gray-100 group`}>
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[#8899A6] text-[10px] font-bold uppercase tracking-[0.15em]">{card.label}</h3>
                        <div className={`p-2.5 rounded-xl border ${card.iconBg} group-hover:scale-110 transition-transform`}>
                          <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                        </div>
                    </div>
                    <div className="text-3xl font-black text-[#0F1419] tracking-tight tabular-nums">{card.value}</div>
                    <p className="text-xs text-[#8899A6] mt-2 font-medium">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Areas Table */}
              <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden animate-fade-up stagger-4">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50/80 to-white">
                    <h3 className="font-black text-[#0F1419] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-[#536471]" /></div>
                      Dashboard de Performance por Área
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-[#8899A6] font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-8 py-4">Área / Diretoria</th>
                                <th className="px-8 py-4 text-center">Performance</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Projeção Budget</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allAreasSummary.map((area, idx) => {
                                const colors = getProgressColor(area.score);
                                return (
                                    <tr key={area.name} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-8 rounded-full ${colors.bar}`}></div>
                                                <span className="font-bold text-[#0F1419] group-hover:text-[#1D9BF0] transition-colors">{area.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${Math.min(area.score, 120) / 1.2}%` }}></div>
                                                </div>
                                                <span className={`font-black text-sm tabular-nums ${colors.text}`}>{area.score}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {area.score >= 100 ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1"><Zap className="w-3 h-3" /> Superou</span>
                                            ) : area.score >= 60 ? (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Na média</span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">Abaixo</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right font-mono font-bold text-[#0F1419] group-hover:text-[#1D9BF0] transition-colors tabular-nums">{formatCurrency(area.projectedPayment)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}