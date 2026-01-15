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
  Sigma // Usado para representar Fórmula
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
  getDocs 
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

// Helper para App ID
const getAppId = () => {
  return typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
};

// Helper para caminhos do Firestore
const getCollectionRef = (collectionName) => {
  const appId = getAppId();
  // Estrutura de dados: artifacts/{appId}/public/data/{collectionName}
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
  if (percent >= 120) return 'bg-indigo-600'; // Roxo mais sóbrio
  if (percent >= 100) return 'bg-emerald-600'; // Verde mais fechado
  if (percent >= 60) return 'bg-amber-500'; // Amarelo queimado
  return 'bg-red-600';
};

/**
 * COMPONENTS
 */

// --- FIX: UPDATED TOOLTIP COMPONENT ---
// Mudanças:
// 1. Uso de 'group/tooltip' para isolar o hover do card pai.
// 2. Cores alteradas para Branco/Cinza para design mais clean.
// 3. Adicionado z-index alto e pointer-events-none para evitar glitchs.
const SimpleTooltip = ({ text, children }) => (
  <div className="group/tooltip relative flex items-center w-fit h-fit">
    {children}
    <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block flex-col items-center w-max max-w-[280px] z-[100] left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-200">
      {/* Corpo da Tooltip */}
      <div className="bg-white text-gray-700 text-[11px] rounded-lg px-4 py-3 shadow-xl text-center leading-relaxed border border-gray-200 break-words font-medium">
        {text}
      </div>
      {/* Seta da Tooltip */}
      <div className="w-2.5 h-2.5 bg-white rotate-45 -mt-1.5 border-r border-b border-gray-200 relative z-[101]"></div>
    </div>
  </div>
);

const StatusDialog = ({ status, onClose }) => {
  if (status.type === 'idle') return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full text-center animate-scale-in border border-gray-100">
        {status.type === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-gray-800 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Processando...</h3>
            <p className="text-gray-500 text-sm mt-2">{status.message}</p>
          </div>
        )}
        {status.type === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Sucesso</h3>
            <p className="text-gray-500 text-sm mt-2">{status.message}</p>
            <button onClick={onClose} className="mt-6 bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-black transition w-full shadow-sm">
              Fechar
            </button>
          </div>
        )}
        {status.type === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Atenção</h3>
            <p className="text-gray-500 text-sm mt-2">{status.message}</p>
            <button onClick={onClose} className="mt-6 bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition w-full">
              Tentar Novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Ruler = ({ value }) => {
  // AJUSTE: Limitar a exibição visual a 120%
  const MAX_VAL = 120;
  const safeValue = Number(value) || 0;
  const displayValue = Math.min(Math.max(safeValue, 0), MAX_VAL);
   
  return (
    <div className="mt-4 mb-2 w-full">
      <div className="relative h-1.5 bg-gray-200 rounded-full w-full">
        {/* Barra de Progresso */}
        <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${getProgressColor(value)}`} 
            style={{ width: `${(displayValue / MAX_VAL) * 100}%` }}
        >
          {/* Tooltip com Valor */}
          <div className="absolute -right-3 -top-7 bg-gray-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded shadow-sm cursor-default whitespace-nowrap z-10">
            {value}%
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-1 h-1 bg-gray-900"></div>
          </div>
        </div>
        
        {/* Marcadores: 0, 60, 100 (Removido o 120 para evitar sobreposição) */}
        {[0, 60, 100].map((mark) => {
          // Lógica para ocultar o marcador se o balãozinho estiver em cima (overlap)
          const isOverlapping = Math.abs(safeValue - mark) < 5;
          return (
            <div key={mark} className="absolute top-0 h-full w-px bg-gray-400 z-0" style={{ left: `${(mark / MAX_VAL) * 100}%` }}>
              {!isOverlapping && (
                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] font-medium text-gray-400">{mark}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GoalCard = ({ goal, history }) => {
  const [showHistory, setShowHistory] = useState(false);
  const isWorldCup = goal.kpi && String(goal.kpi).toLowerCase().includes('copa do mundo de clubes');
  const mainTitle = (goal.kr && goal.kr !== '-') ? goal.kr : goal.kpi;
  const subTitle = (goal.kpi && goal.kpi !== '-' && goal.kpi !== mainTitle) ? goal.kpi : null;
  const isConcluida = goal.status === 'Concluída';

  return (
    <div className={`bg-white border relative rounded-xl p-5 transition-all duration-300 hover:shadow-lg flex flex-col justify-between h-full group ${isWorldCup ? 'border-amber-200 bg-amber-50/10' : isConcluida ? 'border-emerald-100' : 'border-gray-200'}`}>
      
      {/* Upper Content Wrapper for Alignment */}
      <div className="flex-1 flex flex-col">
        {/* Header Badges */}
        <div className="flex justify-between items-start mb-3 h-6">
            <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                {goal.tipo || 'Organizacional'}
                </span>
                {isWorldCup && (
                <SimpleTooltip text="Meta extraordinária (+20%)">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 gap-1 cursor-help whitespace-nowrap">
                    <Trophy className="w-3 h-3" /> Extra
                    </span>
                </SimpleTooltip>
                )}
                {isConcluida && !isWorldCup && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" /> OK
                </span>
                )}
            </div>
            <SimpleTooltip text="Peso desta meta no cálculo final">
                <span className="text-[10px] text-gray-400 font-medium cursor-default whitespace-nowrap ml-2">Peso: {goal.peso}%</span>
            </SimpleTooltip>
        </div>

        {/* Title Section - Fixed Min Height for Alignment */}
        <div className="mb-4 flex-grow min-h-[5rem]">
            <h3 className="text-base font-bold text-gray-900 leading-snug tracking-tight break-words line-clamp-3" title={mainTitle}>{mainTitle}</h3>
            <p className="text-xs text-gray-500 mt-2 font-light leading-relaxed break-words line-clamp-3" title={goal.objetivo}>{goal.objetivo}</p>
            {subTitle && <p className="text-[10px] text-gray-400 mt-2 italic flex items-center gap-1 break-words"><Target className="w-3 h-3 flex-shrink-0" /> {subTitle}</p>}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-center h-20">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1">Acumulado</span>
                <span className="text-lg font-bold text-gray-900 break-words leading-tight" title={formatSmart(goal.resultado_anual, goal.unidade)}>
                    {formatSmart(goal.resultado_anual, goal.unidade)}
                </span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-center h-20">
                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider mb-1">Mês Atual</span>
                <div className="flex flex-col">
                    <span className="text-base font-semibold text-gray-700 break-words leading-tight" title={formatSmart(goal.resultado_mensal, goal.unidade)}>
                        {formatSmart(goal.resultado_mensal, goal.unidade)}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-0.5 whitespace-nowrap">{safeDateDisplay(goal.data_referencia)}</span>
                </div>
            </div>
        </div>

        {/* Progress Ruler */}
        <div className="mb-6">
            <div className="mb-1 flex justify-between items-end">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Atingimento</span>
                <span className={`text-lg font-bold ${goal.atingimento >= 100 ? 'text-emerald-600' : goal.atingimento >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {goal.atingimento}%
                </span>
            </div>
            <Ruler value={goal.atingimento} />
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="mt-2 pt-3 border-t border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
            {/* FORMULA TOOLTIP */}
            {goal.formula && (
                <SimpleTooltip text={`Fórmula: ${goal.formula}`}>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-900 cursor-help transition-colors bg-gray-50 px-2 py-1 rounded">
                        <Sigma className="w-3 h-3" />
                        <span className="font-medium">Fórmula</span>
                    </div>
                </SimpleTooltip>
            )}
            
            {goal.explicacao && (
                <SimpleTooltip text={goal.explicacao}>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 cursor-help transition-colors bg-amber-50 px-2 py-1 rounded">
                        <Info className="w-3 h-3" />
                        <span className="font-medium">Análise</span>
                    </div>
                </SimpleTooltip>
            )}
        </div>

        <div className="text-right">
            <span className="text-[10px] text-gray-400 break-words font-medium">{goal.prazo} • {goal.unidade}</span>
        </div>
      </div>

        {/* History Dropdown */}
        {history && history.length > 1 && (
            <div className="mt-3">
                <button 
                    onClick={() => setShowHistory(!showHistory)} 
                    className="w-full py-1.5 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                >
                    {showHistory ? 'Fechar' : 'Histórico'} 
                    {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                
                {showHistory && (
                    <div className="mt-2 overflow-hidden rounded border border-gray-100 animate-fade-in bg-gray-50/50">
                        <table className="w-full text-[10px] text-left">
                            <thead className="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-2 py-1">Ref.</th>
                                <th className="px-2 py-1">Mensal</th>
                                <th className="px-2 py-1">YTD</th>
                                <th className="px-2 py-1 text-right">Ating.</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {history.map((h, idx) => (
                                <tr key={idx} className="hover:bg-white transition-colors">
                                <td className="px-2 py-1 text-gray-500 font-mono">{safeDateDisplay(h.data_referencia)}</td>
                                <td className="px-2 py-1 text-gray-700">{formatSmart(h.resultado_mensal, h.unidade)}</td>
                                <td className="px-2 py-1 text-gray-700">{formatSmart(h.resultado_anual, h.unidade)}</td>
                                <td className="px-2 py-1 text-right font-bold">{h.atingimento}%</td>
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

const AreaScoreTable = ({ goals, finalScore }) => {
  const sortedGoals = [...goals].sort((a, b) => (b.peso || 0) - (a.peso || 0));
  const totalWeight = sortedGoals.reduce((sum, g) => sum + (g.peso || 0), 0);
   
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Detalhamento de Performance
        </h3>
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 uppercase tracking-wide">
            YTD Consolidado
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-gray-400 uppercase font-semibold bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-2">Meta / KPI</th>
              <th className="px-6 py-2 text-center">Status</th>
              <th className="px-6 py-2 text-right">Resultado</th>
              <th className="px-6 py-2 text-center">Atingimento</th>
              <th className="px-6 py-2 text-center">Peso</th>
              <th className="px-6 py-2 text-right">Contribuição</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedGoals.map((goal) => { 
              const contribution = totalWeight > 0 ? (goal.atingimento * goal.peso) / totalWeight : 0; 
              return (
                <tr key={goal.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-2 font-medium text-gray-700 group-hover:text-black transition-colors break-words">
                    {goal.kr || goal.kpi}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${goal.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {goal.status || 'Em andamento'}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-right font-mono text-gray-500 whitespace-nowrap">
                    {formatSmart(goal.resultado_anual, goal.unidade)}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${goal.atingimento >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : goal.atingimento >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {goal.atingimento}%
                    </span>
                  </td>
                  <td className="px-6 py-2 text-center text-gray-400">{goal.peso}%</td>
                  <td className="px-6 py-2 text-right font-bold text-gray-900">{contribution.toFixed(1)}%</td>
                </tr>
              ); 
            })}
            <tr className="bg-gray-50/50 border-t border-gray-100">
              <td className="px-6 py-2 font-bold text-gray-900 uppercase text-[10px] tracking-widest" colSpan={5}>Resultado Final Ponderado</td>
              <td className="px-6 py-2 text-right">
                <span className="text-xl font-bold text-gray-900">{finalScore}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2 text-sm uppercase tracking-wide">
            <Calculator className="w-4 h-4 text-gray-300" /> Simulador de Bônus (PLR 2025)
        </h3>
        <SimpleTooltip text="Cálculos baseados na Lei 10.101/2000">
            <HelpCircle className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-help" />
        </SimpleTooltip>
      </div>
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-xs text-blue-900 leading-relaxed flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
                <strong className="block mb-1 text-blue-700">Base de Cálculo</strong>
                Utilize a média salarial do ano de 2025. Se houve alteração salarial, faça a média ponderada.
            </div>
          </div>
            
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Salário Base (R$)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                    <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full pl-9 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition font-medium text-gray-800" placeholder="0.00" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Data de Admissão</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition text-gray-800 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Nível Hierárquico</label>
            <select value={targetMultiples} onChange={(e) => setTargetMultiples(Number(e.target.value))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none text-sm text-gray-800">
                <option value={1.5}>Operacional (Target: 1.5 salários)</option>
                <option value={3}>Analista / Tático (Target: 3 salários)</option>
                <option value={4}>Liderança / Especialista (Target: 4 salários)</option>
                <option value={5}>Diretoria (Target: 5 salários)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avaliação Individual</label>
                <span className="text-xs font-bold text-gray-900">{individualScore}%</span>
            </div>
            <input type="range" min="0" max="150" value={individualScore} onChange={(e) => setIndividualScore(Number(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Empresa (40%)</span>
                <span className="font-bold text-gray-900">{companyResult}%</span>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Área (30%)</span>
                <span className="font-bold text-gray-900">{areaResult}%</span>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                <span className="block text-[10px] text-gray-400 uppercase font-bold">Individual (30%)</span>
                <span className="font-bold text-gray-900">{individualScore}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 flex flex-col justify-between relative overflow-hidden border border-gray-100">
            {!result.isEligible && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
                    <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                    <h3 className="text-base font-bold text-gray-900">Não Elegível</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px]">{result.eligibilityReason}</p>
                </div>
            )}
            <div>
                <div className="text-center pb-8 border-b border-gray-200">
                    <span className="text-gray-400 text-xs uppercase tracking-widest font-semibold">Bônus Bruto Estimado</span>
                    <div className="text-4xl font-black text-gray-900 mt-2 tracking-tight">{formatCurrency(result.gross)}</div>
                </div>
                <div className="space-y-4 py-6">
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Proporcionalidade</span>
                        <span className="font-mono font-medium text-gray-900">{result.timeFactor}%</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-gray-500 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Score Ponderado</span>
                        <span className="font-mono font-medium text-blue-600">{result.weightedScore}%</span>
                    </div>
                    <div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-gray-200">
                        <span className="text-gray-500">Imposto de Renda (IRRF)</span>
                        <span className="text-red-500 font-mono font-medium">- {formatCurrency(result.tax)}</span>
                    </div>
                </div>
            </div>
            <div className="bg-emerald-50/50 -mx-8 -mb-8 p-6 border-t border-emerald-100/50">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-emerald-900 font-bold text-sm block">Líquido a Receber</span>
                        <span className="text-[10px] text-emerald-700 opacity-70">Estimativa aproximada</span>
                    </div>
                    <span className="text-3xl font-black text-emerald-700 tracking-tight">{formatCurrency(result.net)}</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

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
    if (found) {
        onLogin(found);
    } else {
        setError('Acesso negado. Verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-sm w-full transition-all">
        <div className="text-center mb-10">
            <div className="bg-gray-900 text-white w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 text-2xl font-bold shadow-lg shadow-gray-200">B</div>
            <h1 className="text-xl font-bold text-gray-900">Portal de Performance</h1>
            <p className="text-sm text-gray-400 mt-1">SAF Botafogo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Usuário</label>
            <div className="relative">
                <Users className="absolute left-3.5 top-3 h-5 w-5 text-gray-300" />
                <input type="text" className="pl-11 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition text-sm font-medium text-gray-900 placeholder-gray-400" placeholder="ID Corporativo" value={user} onChange={(e) => setUser(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Senha</label>
            <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-5 w-5 text-gray-300" />
                <input type="password" className="pl-11 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition text-sm font-medium text-gray-900 placeholder-gray-400" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="flex items-center text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100"><AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />{error}</div>}
          <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-bold hover:bg-black transition-all shadow-md text-sm uppercase tracking-wide mt-2">Entrar na Plataforma</button>
        </form>
        {users.length === 0 && (
          <div className="mt-6 text-center text-[10px] text-amber-600 bg-amber-50 p-3 rounded border border-amber-100">
            <strong>Configuração Inicial</strong><br/>Login: <code>admin</code> / Senha: <code>admin</code>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = ({ 
  goals,
  users, 
  budgets,
  setStatus 
}) => {
  const [tab, setTab] = useState('metas');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalForm, setGoalForm] = useState({});

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
       setGoalForm({ tipo: 'Organizacional', diretoria: '', area: '', objetivo: '', kr: '', kpi: '', atingimento: 0, peso: 0, regua_0: '', regua_60: '', regua_100: '', regua_120: '', unidade: '', prazo: '', formula: '', resultado_mensal: 0, resultado_anual: 0, data_referencia: '', status: 'Em andamento' }); 
       setIsEditingGoal(true); 
  };
   
  const handleSaveGoal = async (e) => { 
    e.preventDefault(); 
    setStatus({type:'loading', message:'Salvando meta...'});
    try {
      const finalData = { 
        ...goalForm, 
        atingimento: cleanNumber(goalForm.atingimento), 
        peso: cleanNumber(goalForm.peso), 
        resultado_mensal: cleanNumber(goalForm.resultado_mensal), 
        resultado_anual: cleanNumber(goalForm.resultado_anual) 
      };
       
      if (goalForm.id) {
        const docRef = getDocRef('goals', goalForm.id);
        await setDoc(docRef, finalData, { merge: true });
      } else {
        const newRef = doc(getCollectionRef('goals')); 
        await setDoc(newRef, { ...finalData, id: newRef.id });
      }
      setStatus({type:'success', message:'Dados atualizados com sucesso.'});
      setIsEditingGoal(false);
    } catch (err) {
      console.error(err);
      setStatus({type:'error', message:'Não foi possível salvar os dados.'});
    }
  };
   
  const handleGoalChange = (e) => { setGoalForm({ ...goalForm, [e.target.name]: e.target.value }); };

  const handleDeleteGoal = async (id) => {
    if(!window.confirm('Confirma a exclusão deste item?')) return;
    setStatus({type:'loading', message:'Processando exclusão...'});
    try {
      await deleteDoc(getDocRef('goals', id));
      setStatus({type:'success', message:'Item removido.'});
    } catch(err) {
      setStatus({type:'error', message:'Erro na exclusão.'});
    }
  }

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
  }

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
       try { await deleteDoc(getDocRef('users', id)); setStatus({type:'success', message:'Acesso removido.'}); } catch(err) { setStatus({type:'error', message:'Erro ao remover.'}); }
    }
  };

  const handleBudgetChange = async (area, val) => {
    const numVal = cleanNumber(val);
    try { await setDoc(getDocRef('budgets', area), { id: area, value: numVal }); } catch(err) { console.error("Erro budget", err); }
  };

  const uniqueAreas = useMemo(() => {
    const areas = new Set();
    goals.forEach(g => { if(g.area) areas.add(g.area) });
    users.forEach(u => { if(u.area && u.area !== 'Todas') areas.add(u.area) });
    return Array.from(areas).sort();
  }, [goals, users]);

  if (isEditingGoal) {
      return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
            <h2 className="text-xl font-bold flex items-center gap-3 text-gray-900">
                <div className="p-2 bg-gray-100 rounded-lg"><Edit className="w-5 h-5 text-gray-600" /></div>
                {goalForm.id ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <button onClick={() => setIsEditingGoal(false)} className="text-gray-400 hover:text-gray-900 transition"><X className="w-6 h-6" /></button>
          </div>
          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo</label><select name="tipo" value={goalForm.tipo} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm">{GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}<option value="Outro">Outro</option></select></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Diretoria</label><input type="text" name="diretoria" value={goalForm.diretoria} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" required /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Área</label><input type="text" name="area" value={goalForm.area} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">KPI</label><input type="text" name="kpi" value={goalForm.kpi} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" required /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data Ref.</label><input type="date" name="data_referencia" value={goalForm.data_referencia} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label><select name="status" value={goalForm.status} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm"><option value="Em andamento">Em andamento</option><option value="Concluída">Concluída</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Objetivo</label><input type="text" name="objetivo" value={goalForm.objetivo} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">KR (Key Result)</label><input type="text" name="kr" value={goalForm.kr} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Peso (%)</label><input type="text" name="peso" value={goalForm.peso} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Atingimento (%)</label><input type="text" name="atingimento" value={goalForm.atingimento} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Result. Mensal</label><input type="text" name="resultado_mensal" value={goalForm.resultado_mensal} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Result. Anual</label><input type="text" name="resultado_anual" value={goalForm.resultado_anual} onChange={handleGoalChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditingGoal(false)} className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black shadow-md transition-all flex items-center gap-2"><Save className="w-4 h-4" /> Salvar Alterações</button>
            </div>
          </form>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in">
       {/* ADMIN HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm gap-6">
         <div className="flex items-center gap-4">
           <div><h2 className="text-2xl font-bold text-gray-900 tracking-tight">Painel Administrativo</h2><p className="text-gray-500 text-sm mt-1">Gestão centralizada de indicadores e acessos.</p></div>
         </div>
         <div className="flex bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            {['metas', 'usuarios', 'financeiro'].map(t => (
                <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>{t}</button>
            ))}
         </div>
       </div>

       {/* DEBUG INFO */}
       <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col gap-1 text-xs">
         <div className="flex items-center gap-2 font-bold text-gray-700 uppercase tracking-wider"><Search className="w-3 h-3" /> Status do Banco de Dados</div>
         <code className="text-gray-500 font-mono mt-1">Path: artifacts/{getAppId()}/public/data</code>
       </div>

       {/* TAB: METAS */}
       {tab === 'metas' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
             <div className="flex items-center gap-2 text-gray-600 font-medium text-sm"><Database className="w-4 h-4" /> {goals.length} registros encontrados</div>
             <div className="flex gap-3">
                <button onClick={handleDeleteAllGoals} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wide px-4 py-2 border border-red-100 rounded-lg hover:bg-red-50 transition">Limpar Base</button>
                <button onClick={handleNewGoal} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-black transition shadow-sm flex items-center gap-2"><Plus className="w-3 h-3" /> Nova Meta</button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[10px]">
               <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase tracking-wider">
                 <tr>
                   <th className="px-6 py-2">Tipo / Área</th>
                   <th className="px-6 py-2 w-1/4">Indicador (KPI/KR)</th>
                   <th className="px-6 py-2">Referência</th>
                   <th className="px-6 py-2 text-center">Status</th>
                   <th className="px-6 py-2 text-center">Peso</th>
                   <th className="px-6 py-2 text-center">Atingimento</th>
                   <th className="px-6 py-2 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 text-xs">
                 {goals.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                     <td className="px-6 py-2">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{item.area}</span>
                            <span className="text-[9px] text-gray-400 uppercase">{item.tipo}</span>
                        </div>
                     </td>
                     <td className="px-6 py-2 font-medium text-gray-700 break-words whitespace-normal min-w-[200px]">
                        {item.kr || item.kpi}
                     </td>
                     <td className="px-6 py-2 text-[10px] text-gray-500 font-mono">{safeDateDisplay(item.data_referencia)}</td>
                     <td className="px-6 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${item.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {item.status || 'Em andamento'}
                        </span>
                     </td>
                     <td className="px-6 py-2 text-center text-gray-500">{item.peso}%</td>
                     <td className="px-6 py-2 text-center font-bold text-gray-900">{item.atingimento}%</td>
                     <td className="px-6 py-2 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleEditGoal(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"><Edit className="w-3 h-3" /></button>
                           <button onClick={() => handleDeleteGoal(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 className="w-3 h-3" /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {/* TAB: USUÁRIOS */}
       {tab === 'usuarios' && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
             <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-gray-400" /> Gerenciar Acesso</h3>
             <form onSubmit={handleSaveUser} className="space-y-5">
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Login</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm transition" value={userForm.user} onChange={e => setUserForm({...userForm, user: e.target.value})} required /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Senha</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm transition" value={userForm.pass} onChange={e => setUserForm({...userForm, pass: e.target.value})} required /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nome de Exibição</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm transition" value={userForm.label} onChange={e => setUserForm({...userForm, label: e.target.value})} required placeholder="Ex: Diretoria Financeira" /></div>
               <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Perfil</label><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm transition" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}><option value="AREA">Área (Padrão)</option><option value="CEO">Executivo (CEO)</option><option value="ADMIN">Administrador</option></select></div>
               {userForm.role === 'AREA' && (
                 <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Área Vinculada</label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 text-sm transition" value={userForm.area} onChange={e => setUserForm({...userForm, area: e.target.value})} placeholder="Nome exato da área" /></div>
               )}
               <div className="pt-4 flex gap-3">
                 <button type="submit" className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-black transition shadow-md">Salvar</button>
                 {editingUser && <button type="button" onClick={() => { setEditingUser(null); setUserForm({ user: '', pass: '', role: 'AREA', label: '', area: '' }) }} className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm font-medium hover:bg-gray-50 transition">Cancelar</button>}
               </div>
             </form>
           </div>
           <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase text-[10px] tracking-wider"><tr><th className="px-6 py-4">Usuário</th><th className="px-6 py-4">Credenciais</th><th className="px-6 py-4">Perfil</th><th className="px-6 py-4 text-right">Ações</th></tr></thead>
               <tbody className="divide-y divide-gray-100">
                 {users.map(u => (
                   <tr key={u.id} className="hover:bg-gray-50/50 transition">
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{u.label}</span>
                            <span className="text-xs text-gray-400">{u.area}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {u.user} <span className="mx-2 text-gray-300">|</span> ••••••
                     </td>
                     <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : u.role === 'CEO' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>{u.role}</span></td>
                     <td className="px-6 py-4 text-right">
                       <button onClick={() => { setEditingUser(u); setUserForm(u); }} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase mr-4">Editar</button>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase">Excluir</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       )}

       {/* TAB: FINANCEIRO */}
       {tab === 'financeiro' && (
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><Wallet className="w-5 h-5 text-gray-400" /> Orçamento por Área (Target)</h3>
              <p className="text-xs text-gray-500 mt-1">Definição de budget para cálculo de bônus.</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueAreas.map(area => (
                  <div key={area} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition group">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-3 tracking-wide group-hover:text-gray-800 transition-colors">{area}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none font-mono font-bold text-gray-900 text-lg transition bg-gray-50 focus:bg-white"
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

export default function App() {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [firebaseUser, setFirebaseUser] = useState(null);
   
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('saf_user_session');
    return saved ? JSON.parse(saved) : null;
  });
   
  const [activeTab, setActiveTab] = useState('company'); 
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
   
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
      
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const unsubGoals = onSnapshot(getCollectionRef('goals'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setGoals(data);
    });
    const unsubUsers = onSnapshot(getCollectionRef('users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(data);
    });
    const unsubBudgets = onSnapshot(getCollectionRef('budgets'), (snapshot) => {
      const budgetObj = {};
      snapshot.docs.forEach(doc => { budgetObj[doc.id] = doc.data().value; });
      setBudgets(budgetObj);
    });
    return () => { unsubGoals(); unsubUsers(); unsubBudgets(); };
  }, [firebaseUser]);

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
    // ORDENAR DO MAIOR PARA O MENOR ATINGIMENTO
    return groupData(raw).sort((a, b) => b.atingimento - a.atingimento);
  }, [goals]);

  const companyResult = useMemo(() => {
    const standardGoals = companyGoals.filter(g => !String(g.kpi).toLowerCase().includes('copa do mundo de clubes'));
    const extraGoal = companyGoals.find(g => String(g.kpi).toLowerCase().includes('copa do mundo de clubes'));
    const totalWeight = standardGoals.reduce((acc, curr) => acc + (curr.peso || 0), 0);
    const weightedSum = standardGoals.reduce((acc, curr) => acc + (curr.atingimento * (curr.peso || 0)), 0);
    let baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
    if (extraGoal) { const extraPoints = (Math.min(extraGoal.atingimento, 100) / 100) * 20; baseScore += extraPoints; }
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
    // ORDENAR DO MAIOR PARA O MENOR ATINGIMENTO
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
    });
  }, [goals, budgets]);

  const totalBonusProjection = useMemo(() => allAreasSummary.reduce((acc, curr) => acc + curr.projectedPayment, 0), [allAreasSummary]);

  const handleExport = () => { if (goals.length === 0) return; const headers = Object.keys(goals[0]).filter(k => k !== 'history'); const csvContent = headers.join(",") + "\n" + goals.map(row => headers.map(fieldName => { let cell = row[fieldName]; if (cell === null || cell === undefined) cell = ''; const cellStr = String(cell).replace(/"/g, '""'); return `"${cellStr}"`; }).join(",")).join("\n"); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `metas_saf_botafogo_${new Date().toISOString().slice(0,10)}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
   
  const handleImportClick = () => { fileInputRef.current?.click(); };
   
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setStatus({ type: 'loading', message: 'Processando arquivo...' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result; let text = ''; try { const decoder = new TextDecoder('utf-8', { fatal: true }); text = decoder.decode(buffer); } catch (err) { const decoder = new TextDecoder('windows-1252'); text = decoder.decode(buffer); }
        const firstLineEnd = text.indexOf('\n'); const firstLine = text.substring(0, firstLineEnd > -1 ? firstLineEnd : text.length); const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
        const rows = []; let currentRow = []; let currentField = ''; let inQuotes = false;
        const validRows = rows.filter(row => row.length > 1 && row.some(cell => cell.trim().length > 0)); 
        for (let i = 0; i < text.length; i++) { const char = text[i]; const nextChar = text[i + 1]; if (char === '"') { if (inQuotes && nextChar === '"') { currentField += '"'; i++; } else { inQuotes = !inQuotes; } } else if (char === delimiter && !inQuotes) { currentRow.push(currentField); currentField = ''; } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ''; if (char === '\r') i++; } else { if (char !== '\r') currentField += char; } }
        if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
        const rowsToProcess = rows.filter(row => row.length > 1 && row.some(cell => cell.trim().length > 0));
        if (rowsToProcess.length < 2) { setStatus({ type: 'error', message: 'Arquivo inválido ou vazio.' }); return; }
        const headers = rowsToProcess[0].map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '')); const dataRows = rowsToProcess.slice(1);
        const chunks = []; const chunkSize = 450;
        for (let i = 0; i < dataRows.length; i += chunkSize) { chunks.push(dataRows.slice(i, i + chunkSize)); }
        let totalProcessed = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((values) => {
                  const obj = {}; 
                  headers.forEach((header, index) => { 
                     let value = values[index] || ''; let key = (header || '').toLowerCase().trim(); 
                     if(key.includes('kpi') || key.includes('indicador')) key = 'kpi'; else if(key.includes('peso')) key = 'peso'; else if(key.includes('atingimento')) key = 'atingimento'; else if(key.includes('diretoria')) key = 'diretoria'; else if(key.includes('tipo')) key = 'tipo'; else if(key.includes('área') || key.includes('area')) key = 'area'; else if(key.includes('mensal') || key.includes('realizado_mes') || key === 'mes') key = 'resultado_mensal'; else if(key.includes('anual') || key.includes('ytd') || key.includes('acumulado') || key.includes('realizado_ano')) key = 'resultado_anual'; else if(key.includes('data') || key.includes('ref')) key = 'data_referencia'; else if(key.includes('kr') || key.includes('key result') || key.includes('resultado chave')) key = 'kr'; else key = header; 
                     if (['id', 'atingimento', 'peso', 'resultado_mensal', 'resultado_anual'].includes(key)) { const num = cleanNumber(value); if (['atingimento', 'peso'].includes(key) && !String(value).includes('%') && num <= 2.0 && num !== 0) { obj[key] = num * 100; } else { obj[key] = num; } } else if (key === 'data_referencia') { if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) { const [day, month, year] = value.split('/'); obj[key] = `${year}-${month}-${day}`; } else { obj[key] = value; } } else { obj[key] = value || ''; } 
                  });
                  if (obj.atingimento !== undefined) { const val = Number(obj.atingimento); if (!isNaN(val)) { obj.status = val >= 100 ? 'Concluída' : 'Em andamento'; } else { obj.status = 'Em andamento'; } } else { obj.status = 'Em andamento'; }
                  const ref = doc(getCollectionRef('goals')); batch.set(ref, { ...obj, id: ref.id }); totalProcessed++;
            });
            await batch.commit();
        }
        setStatus({ type: 'success', message: `${totalProcessed} registros processados.` });
      } catch (error) { console.error(error); setStatus({ type: 'error', message: 'Erro no processamento.' }); }
    }; reader.onerror = () => setStatus({ type: 'error', message: 'Falha na leitura.' }); reader.readAsArrayBuffer(file);
    event.target.value = ''; 
  };
   
  const closeStatus = () => setStatus({ type: 'idle', message: '' });

  if (!firebaseUser) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" /><span className="text-gray-400 text-xs font-medium uppercase tracking-widest">Carregando sistema...</span></div></div>;

  if (!user) return <LoginScreen onLogin={handleLogin} users={users} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 selection:bg-gray-200 selection:text-black">
      <StatusDialog status={status} onClose={closeStatus} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      
      {/* EXECUTIVE HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-[95%] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="bg-gray-900 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-gray-200">B</div>
            <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none tracking-tight">Portal de Performance</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <p className="text-xs text-gray-500 font-medium">{user.label}</p>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SimpleTooltip text="Exportar base completa (CSV)">
                <button onClick={handleExport} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"><Download className="w-5 h-5" /></button>
            </SimpleTooltip>
            <SimpleTooltip text="Importar nova planilha">
                <button onClick={handleImportClick} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"><Upload className="w-5 h-5" /></button>
            </SimpleTooltip>
            <div className="h-8 w-px bg-gray-100 mx-1"></div>
            <button onClick={handleLogout} className="flex items-center text-xs font-bold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-100 px-4 py-2 rounded-lg transition-all uppercase tracking-wide gap-2">
                <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[95%] w-full mx-auto px-6 py-10">
        {/* NAVIGATION TABS */}
        <div className="flex p-1 bg-white border border-gray-200 rounded-xl w-fit mb-10 shadow-sm mx-auto sm:mx-0">
          {user.role === 'ADMIN' && (
            <button onClick={() => setActiveTab('admin')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'admin' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                <Settings className="w-4 h-4" /> Administração
            </button>
          )}
          <button onClick={() => setActiveTab('company')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'company' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
            Visão Global
          </button>
          {user.role === 'CEO' && (
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                Painel CEO
            </button>
          )}
          {(user.role !== 'CEO' && user.role !== 'ADMIN') && (
            <button onClick={() => setActiveTab('area')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'area' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
                Minha Área
            </button>
          )}
        </div>

        {activeTab === 'admin' && user.role === 'ADMIN' && (<AdminPanel goals={goals} users={users} budgets={budgets} setStatus={setStatus} />)}

        {activeTab === 'company' && (
          <div className="animate-fade-in space-y-10">
            <div className="bg-gray-900 rounded-2xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-2">Resultado Corporativo</h2>
                        <p className="text-gray-400 font-light text-sm max-w-md">Performance consolidada de todos os indicadores organizacionais globais.</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className={`text-6xl font-black tracking-tighter ${companyResult >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{companyResult}%</div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-2 bg-black/30 px-3 py-1 rounded-full border border-white/10">Média Ponderada</span>
                    </div>
                </div>
            </div>
             
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                    <Target className="w-5 h-5 text-gray-400" /> Metas Globais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {companyGoals.map(goal => (<GoalCard key={goal.id} goal={goal} history={goal.history} />))}
                </div>
            </div>
          </div>
        )}

        {activeTab === 'area' && user.role === 'AREA' && (
          <div className="animate-fade-in space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors group">
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{user.area}</h2>
                    <p className="text-2xl font-bold text-gray-900">Performance da Área</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-4xl font-black text-gray-900 tracking-tighter group-hover:scale-105 transition-transform">{areaResult}%</span>
                    </div>
                    <PieChart className={`w-12 h-12 stroke-1 ${areaResult >= 100 ? 'text-emerald-500' : 'text-amber-500'}`} />
                </div>
              </div>
              
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors group">
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Empresa</h2>
                    <p className="text-2xl font-bold text-gray-900">Gatilho Global</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="block text-4xl font-black text-gray-900 tracking-tighter group-hover:scale-105 transition-transform">{companyResult}%</span>
                    </div>
                    <BarChart3 className="w-12 h-12 text-blue-500 stroke-1" />
                </div>
              </div>
            </div>

            <AreaScoreTable goals={areaGoals} finalScore={areaResult} />
            
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-200 pb-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-400" /> Metas Específicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {areaGoals.length > 0 ? (areaGoals.map(goal => (<GoalCard key={goal.id} goal={goal} history={goal.history} />))) : (<div className="col-span-2 text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 font-medium">Nenhuma meta cadastrada para esta área.</div>)}
                </div>
            </div>
            
            <div id="calculator-section" className="mt-12 pt-8 border-t border-gray-200">
                <BonusCalculator companyResult={companyResult} areaResult={areaResult} />
            </div>
          </div>
        )}

        {activeTab === 'overview' && user.role === 'CEO' && (
          <div className="animate-fade-in space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Média Global</h3>
                        <div className="p-2 bg-emerald-50 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 tracking-tight">{companyResult}%</div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Consolidado Corporativo</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Áreas Monitoradas</h3>
                        <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 tracking-tight">{allAreasSummary.length}</div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Diretorias ativas</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Budget Bônus (Target)</h3>
                        <div className="p-2 bg-amber-50 rounded-lg"><DollarSign className="w-5 h-5 text-amber-600" /></div>
                    </div>
                    <div className="text-4xl font-black text-gray-900 tracking-tight">{formatCurrency(totalBonusProjection)}</div>
                    <p className="text-xs text-gray-400 mt-2 font-medium">Projeção atual de desembolso</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Dashboard de Performance por Área</h3>
                    <button className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase transition">Ver Detalhes</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100 uppercase text-[10px] tracking-wider">
                            <tr>
                                <th className="px-8 py-4 font-bold">Diretoria</th>
                                <th className="px-8 py-4 font-bold text-right">Target (R$)</th>
                                <th className="px-8 py-4 font-bold">Progresso</th>
                                <th className="px-8 py-4 font-bold">Status</th>
                                <th className="px-8 py-4 font-bold text-right">Projeção (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allAreasSummary.map((area, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-4 font-bold text-gray-800">{area.name}</td>
                                    <td className="px-8 py-4 text-right text-gray-400 font-mono text-xs">{formatCurrency(area.budget)}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${getProgressColor(area.score)}`} style={{ width: `${Math.min(area.score, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-700">{area.score}%</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        {area.score >= 100 ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Superou</span>
                                        ) : area.score >= 80 ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">Na média</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">Abaixo</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-right font-mono font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{formatCurrency(area.projectedPayment)}</td>
                                </tr>
                            ))}
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