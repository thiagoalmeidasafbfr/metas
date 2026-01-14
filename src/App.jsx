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
  Calendar
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
  if (percent >= 120) return 'bg-purple-600';
  if (percent >= 100) return 'bg-green-500';
  if (percent >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * COMPONENTS
 */

const StatusDialog = ({ status, onClose }) => {
  if (status.type === 'idle') return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center animate-scale-in">
        {status.type === 'loading' && <div className="flex flex-col items-center"><Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" /><h3 className="text-lg font-bold text-gray-900">Processando...</h3><p className="text-gray-500 mt-2">{status.message}</p></div>}
        {status.type === 'success' && <div className="flex flex-col items-center"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8 text-green-600" /></div><h3 className="text-lg font-bold text-gray-900">Concluído!</h3><p className="text-gray-500 mt-2">{status.message}</p><button onClick={onClose} className="mt-6 bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition w-full">Fechar</button></div>}
        {status.type === 'error' && <div className="flex flex-col items-center"><div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-red-600" /></div><h3 className="text-lg font-bold text-gray-900">Erro</h3><p className="text-gray-500 mt-2">{status.message}</p><button onClick={onClose} className="mt-6 bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition w-full">Tentar Novamente</button></div>}
      </div>
    </div>
  );
};

const Ruler = ({ value }) => {
  const displayValue = Math.min(Math.max(Number(value) || 0, 0), 130);
  return (
    <div className="mt-6 mb-2">
      <div className="relative h-4 bg-gray-200 rounded-full w-full">
        <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${getProgressColor(value)}`} style={{ width: `${(displayValue / 130) * 100}%` }}>
          <div className="absolute -right-3 -top-9 bg-black text-white text-xs font-bold py-1 px-2 rounded transform">{value}%<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black"></div></div>
        </div>
        {[0, 60, 100, 120].map((mark) => (
          <div key={mark} className="absolute top-0 h-full w-px bg-gray-400" style={{ left: `${(mark / 130) * 100}%` }}>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-gray-500">{mark}%</div>
          </div>
        ))}
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
    <div className={`bg-white border ${isWorldCup ? 'border-yellow-400 ring-2 ring-yellow-100' : isConcluida ? 'border-green-200 ring-1 ring-green-50' : 'border-gray-100'} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
      <div className="relative z-10">
        {isWorldCup && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20 flex items-center gap-1"><Trophy className="w-3 h-3" /> META EXTRA (+20%)</div>}
        {isConcluida && !isWorldCup && <div className="absolute top-0 right-0 bg-green-100 text-green-800 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm z-20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> CONCLUÍDA</div>}
        
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 ${normalizeText(goal.tipo) === 'global' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{goal.tipo || 'Organizacional'}</span>
            <span className="text-xs text-gray-400 font-medium">Peso: {goal.peso}%</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 leading-tight">{mainTitle}</h3>
          <p className="text-sm text-gray-500 mt-1">{goal.objetivo}</p>
          {subTitle && <p className="text-xs text-gray-400 mt-1 italic">KPI: {subTitle}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition duration-300"><span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Resultado Anual (YTD)</span><span className="text-xl sm:text-2xl font-black text-gray-900 break-words w-full px-1" title={formatSmart(goal.resultado_anual, goal.unidade)}>{formatSmart(goal.resultado_anual, goal.unidade)}</span></div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition duration-300"><span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Último Mês</span><div className="flex flex-col w-full"><span className="text-lg sm:text-xl font-bold text-gray-700 break-words w-full px-1" title={formatSmart(goal.resultado_mensal, goal.unidade)}>{formatSmart(goal.resultado_mensal, goal.unidade)}</span><span className="text-[10px] text-gray-400 mt-0.5">{safeDateDisplay(goal.data_referencia)}</span></div></div>
        </div>
        <div className="mb-2 flex justify-between items-end"><span className="text-xs font-bold text-gray-500 uppercase">Atingimento da Meta</span><span className={`text-2xl font-bold ${goal.atingimento >= 100 ? 'text-green-600' : goal.atingimento >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{goal.atingimento}%</span></div>
        <Ruler value={goal.atingimento} />
        {(goal.regua_0 || goal.regua_60 || goal.regua_100 || goal.regua_120) && (
          <div className="mt-6">
            <h4 className="text-[10px] uppercase font-bold text-gray-400 mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Regras de Atingimento</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-red-50 p-2 rounded border border-red-100"><span className="block font-bold text-red-700 mb-1">0%</span><span className="text-gray-600 text-[10px] leading-tight block break-words">{goal.regua_0 || '-'}</span></div>
              <div className="bg-yellow-50 p-2 rounded border border-yellow-100"><span className="block font-bold text-yellow-700 mb-1">60%</span><span className="text-gray-600 text-[10px] leading-tight block break-words">{goal.regua_60 || '-'}</span></div>
              <div className="bg-green-50 p-2 rounded border border-green-100"><span className="block font-bold text-green-700 mb-1">100%</span><span className="text-gray-600 text-[10px] leading-tight block break-words">{goal.regua_100 || '-'}</span></div>
              <div className="bg-purple-50 p-2 rounded border border-purple-100"><span className="block font-bold text-purple-700 mb-1">120%</span><span className="text-gray-600 text-[10px] leading-tight block break-words">{goal.regua_120 || '-'}</span></div>
            </div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-500 bg-white pt-4 border-t border-gray-50"><div><span className="block font-bold mb-0.5">Fórmula:</span><span>{goal.formula || '-'}</span></div><div className="text-right"><span className="block font-bold mb-0.5">Prazo / Unidade:</span><span>{goal.prazo} • {goal.unidade}</span></div></div>
        {goal.explicacao && <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-800 border border-yellow-100 flex items-start gap-2"><Info className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><span className="font-bold block mb-0.5">Análise:</span>{goal.explicacao}</div></div>}
        {history && history.length > 1 && (
          <div className="mt-4">
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center text-xs font-bold text-gray-400 hover:text-black transition w-full justify-center py-2 bg-gray-50 rounded-lg hover:bg-gray-100"><span className="flex items-center gap-1"><History className="w-3 h-3" /> {showHistory ? 'Ocultar Histórico' : `Ver Histórico Completo (${history.length})`}</span>{showHistory ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}</button>
            {showHistory && (<div className="mt-2 overflow-x-auto rounded-lg border border-gray-100 animate-fade-in"><table className="w-full text-xs text-left"><thead className="text-gray-500 bg-gray-50 font-semibold border-b border-gray-100"><tr><th className="px-3 py-2">Data</th><th className="px-3 py-2">Mensal</th><th className="px-3 py-2">YTD</th><th className="px-3 py-2 text-right">Ating.</th></tr></thead><tbody className="divide-y divide-gray-50 bg-white">{history.map((h, idx) => (<tr key={idx} className="hover:bg-gray-50"><td className="px-3 py-2 text-gray-500">{safeDateDisplay(h.data_referencia)}</td><td className="px-3 py-2 text-gray-900 font-medium">{formatSmart(h.resultado_mensal, h.unidade)}</td><td className="px-3 py-2 text-gray-900 font-medium">{formatSmart(h.resultado_anual, h.unidade)}</td><td className="px-3 py-2 text-right font-bold">{h.atingimento}%</td></tr>))}</tbody></table></div>)}
          </div>
        )}
      </div>
    </div>
  );
};

const AreaScoreTable = ({ goals, finalScore }) => {
  const sortedGoals = [...goals].sort((a, b) => (b.peso || 0) - (a.peso || 0));
  const totalWeight = sortedGoals.reduce((sum, g) => sum + (g.peso || 0), 0);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-sm">Detalhamento de Atingimento</h3><span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Consolidado YTD</span></div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 font-bold">Meta / KPI</th>
              <th className="px-4 py-2 text-right">Resultado</th>
              <th className="px-4 py-2 text-center">Atingimento</th>
              <th className="px-4 py-2 text-center">Peso</th>
              <th className="px-4 py-2 text-right">Contribuição (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedGoals.map((goal) => { 
              const contribution = totalWeight > 0 ? (goal.atingimento * goal.peso) / totalWeight : 0; 
              return (
                <tr key={goal.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-1.5 font-medium text-gray-900">{goal.kr || goal.kpi}</td>
                  <td className="px-4 py-1.5 text-right font-mono text-gray-600">{formatSmart(goal.resultado_anual, goal.unidade)}</td>
                  <td className="px-4 py-1.5 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${goal.atingimento >= 100 ? 'bg-green-100 text-green-700' : goal.atingimento >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {goal.atingimento}%
                    </span>
                  </td>
                  <td className="px-4 py-1.5 text-center text-gray-500">{goal.peso}%</td>
                  <td className="px-4 py-1.5 text-right font-bold text-blue-600">{contribution.toFixed(1)}%</td>
                </tr>
              ); 
            })}
            <tr className="bg-gray-50 border-t-2 border-gray-200">
              <td className="px-4 py-2 font-bold text-gray-900" colSpan={4}>RESULTADO FINAL DA ÁREA (PONDERADO)</td>
              <td className="px-4 py-2 text-right"><span className="text-lg font-black text-blue-800">{finalScore}%</span></td>
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
    if (startDate) { const start = new Date(startDate); const cutoffDate = new Date('2025-09-01'); const referenceYear = 2025; const endOfYear = new Date(`${referenceYear}-12-31`); if (start >= cutoffDate) { isEligible = false; eligibilityReason = 'Data de admissão a partir de 01/09/2025 torna o colaborador inelegível.'; timeFactor = 0; } else if (start.getFullYear() === referenceYear) { const diffTime = Math.abs(endOfYear - start); const daysWorked = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; timeFactor = daysWorked / 365; } }
    const weightedScore = ((companyResult * W_COMPANY) + (areaResult * W_AREA) + (individualScore * W_INDIVIDUAL)) / 100;
    const grossBonus = isEligible ? (numericSalary * targetMultiples * weightedScore * timeFactor) : 0;
    const taxData = calculatePLRNet(grossBonus);
    return { weightedScore: (weightedScore * 100).toFixed(1), timeFactor: (timeFactor * 100).toFixed(1), isEligible, eligibilityReason, ...taxData };
  }, [salary, individualScore, targetMultiples, companyResult, areaResult, startDate]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-900 p-4 flex items-center justify-between"><h3 className="text-white font-bold flex items-center gap-2"><Calculator className="w-5 h-5" /> Simulador de Bônus (PLR 2025)</h3><span className="text-gray-400 text-xs">Lei 10.101/2000</span></div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2"><Info className="w-4 h-4 mt-0.5 flex-shrink-0" /><div><p className="font-bold">Atenção ao Salário:</p><p>O salário considerado deve ser a <strong>média salarial do ano de 2025</strong>. Caso tenha recebido aumento, calcule a média ponderada.</p></div></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Salário Médio (R$)</label><input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" placeholder="Ex: 8500.00" /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none" /><span className="text-[10px] text-gray-400">Para cálculo proporcional</span></div></div>
           <div><label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Faixa Salarial</label><select value={targetMultiples} onChange={(e) => setTargetMultiples(Number(e.target.value))} className="w-full p-2 border border-gray-300 rounded-lg"><option value={1.5}>Operacional (1.5 Salários)</option><option value={3}>Analista, Supervisor, Assistente, Fisio (3 Salários)</option><option value={4}>Liderança, Especialistas (4 Salários)</option><option value={5}>Diretoria (5 Salários)</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Avaliação Individual (%)</label><input type="range" min="0" max="150" value={individualScore} onChange={(e) => setIndividualScore(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" /><div className="flex justify-between text-xs text-gray-500 mt-1"><span>0%</span><span className="font-bold text-black">{individualScore}%</span><span>150%</span></div></div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="bg-gray-100 p-2 rounded border border-gray-200"><span className="block text-gray-500">Empresa (40%)</span><span className="font-bold text-lg">{companyResult}%</span></div><div className="bg-gray-100 p-2 rounded border border-gray-200"><span className="block text-gray-500">Área (30%)</span><span className="font-bold text-lg">{areaResult}%</span></div><div className="bg-gray-100 p-2 rounded border border-gray-200"><span className="block text-gray-500">Individual (30%)</span><span className="font-bold text-lg">{individualScore}%</span></div></div>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-between relative overflow-hidden">
            {!result.isEligible && (<div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6"><AlertCircle className="w-12 h-12 text-red-500 mb-2" /><h3 className="text-lg font-bold text-red-600">Inelegível</h3><p className="text-sm text-gray-600">{result.eligibilityReason}</p></div>)}
            <div><div className="text-center pb-6 border-b border-gray-200"><span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">Bônus Bruto</span><div className="text-4xl font-extrabold text-gray-900 mt-2">{formatCurrency(result.gross)}</div></div><div className="space-y-3 py-6"><div className="flex justify-between text-sm items-center"><span className="text-gray-600 flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Fator Tempo (2025):</span><span className="font-mono font-medium text-gray-900">{result.timeFactor}%</span></div><div className="flex justify-between text-sm items-center"><span className="text-gray-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Score Global Ponderado:</span><span className="font-mono font-medium text-blue-600">{result.weightedScore}%</span></div><div className="flex justify-between text-sm items-center pt-2 border-t border-dashed border-gray-200"><span className="text-gray-600">IRRF (Tabela PLR):</span><span className="text-red-500 font-mono">- {formatCurrency(result.tax)}</span></div></div></div>
            <div className="bg-green-50 -mx-6 -mb-6 p-6 border-t border-green-100"><div className="flex justify-between items-end"><div><span className="text-green-800 font-bold block">Valor Líquido Estimado</span><span className="text-[10px] text-green-600 opacity-80">*Isento de INSS/FGTS conforme lei</span></div><span className="text-3xl font-bold text-green-700">{formatCurrency(result.net)}</span></div></div>
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
    
    // Login de emergência caso o banco esteja vazio
    if (users.length === 0 && user === 'admin' && password === 'admin') {
      onLogin({ id: 'temp-admin', user: 'admin', role: 'ADMIN', label: 'Admin Temporário', area: 'Todas' });
      return;
    }

    const found = users.find(u => u.user === user && u.pass === password);
    if (found) onLogin(found);
    else setError('Credenciais inválidas.');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8"><div className="bg-black text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">B</div><h1 className="text-2xl font-bold text-gray-800">Portal de Metas</h1><p className="text-gray-500">SAF Botafogo</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label><div className="relative"><Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input type="text" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition" placeholder="Seu usuário" value={user} onChange={(e) => setUser(e.target.value)} /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Senha</label><div className="relative"><Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" /><input type="password" className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} /></div></div>
          {error && <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg"><AlertCircle className="w-4 h-4 mr-2" />{error}</div>}
          <button type="submit" className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg">Acessar Painel</button>
        </form>
        {users.length === 0 && (
          <div className="mt-4 text-center text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-100">
            <strong>Banco de dados vazio!</strong><br/>Use <code>admin</code> / <code>admin</code> para entrar e carregar dados.
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

  // --- GOAL LOGIC (FIRESTORE) ---
  const handleEditGoal = (item) => { 
     // Converte para yyyy-MM-dd para o input date funcionar corretamente
     let formattedDate = item.data_referencia || '';
     if (formattedDate && formattedDate.includes('/')) {
         const [day, month, year] = formattedDate.split('/');
         formattedDate = `${year}-${month}-${day}`;
     }
     setGoalForm({ 
        ...item, 
        data_referencia: formattedDate,
        status: item.status || 'Em andamento'
     }); 
     setIsEditingGoal(true); 
  };

  const handleNewGoal = () => { 
      setGoalForm({ 
          tipo: 'Organizacional', 
          diretoria: '', 
          area: '', 
          objetivo: '', 
          kr: '', 
          kpi: '', 
          atingimento: 0, 
          peso: 0, 
          regua_0: '', 
          regua_60: '', 
          regua_100: '', 
          regua_120: '', 
          unidade: '', 
          prazo: '', 
          formula: '', 
          resultado_mensal: 0, 
          resultado_anual: 0, 
          data_referencia: '',
          status: 'Em andamento'
      }); 
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
      setStatus({type:'success', message:'Meta salva com sucesso!'});
      setIsEditingGoal(false);
    } catch (err) {
      console.error(err);
      setStatus({type:'error', message:'Erro ao salvar meta.'});
    }
  };
  
  const handleGoalChange = (e) => { setGoalForm({ ...goalForm, [e.target.name]: e.target.value }); };

  const handleDeleteGoal = async (id) => {
    if(!window.confirm('Tem certeza?')) return;
    setStatus({type:'loading', message:'Excluindo...'});
    try {
      await deleteDoc(getDocRef('goals', id));
      setStatus({type:'success', message:'Meta excluída.'});
    } catch(err) {
      setStatus({type:'error', message:'Erro ao excluir.'});
    }
  }

  // --- DELETE ALL GOALS (CLEAN DATABASE) ---
  const handleDeleteAllGoals = async () => {
    if(!window.confirm('ATENÇÃO: Isso apagará TODAS as metas do banco de dados. Esta ação não pode ser desfeita. Continuar?')) return;
    setStatus({type:'loading', message:'Limpando banco de dados...'});
    try {
      const colRef = getCollectionRef('goals');
      const snapshot = await getDocs(colRef);
      
      if (snapshot.empty) {
        setStatus({type:'success', message:'O banco já está vazio.'});
        return;
      }

      const docsToDelete = snapshot.docs;
      const chunkSize = 400; 
      const chunks = [];

      for (let i = 0; i < docsToDelete.length; i += chunkSize) {
        chunks.push(docsToDelete.slice(i, i + chunkSize));
      }

      let deletedCount = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(docSnapshot => {
          batch.delete(docSnapshot.ref);
        });
        await batch.commit();
        deletedCount += chunk.length;
      }

      setStatus({type:'success', message: `${deletedCount} metas excluídas com sucesso.`});
    } catch(err) {
      console.error("Erro ao limpar:", err);
      setStatus({type:'error', message:'Erro ao limpar dados: ' + err.message});
    }
  }

  // --- USER LOGIC (FIRESTORE) ---
  const [userForm, setUserForm] = useState({ user: '', pass: '', role: 'AREA', label: '', area: '' });
  const [editingUser, setEditingUser] = useState(null);
   
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setStatus({type:'loading', message:'Salvando usuário...'});
    try {
      if (editingUser) {
        await setDoc(getDocRef('users', editingUser.id), { ...userForm, id: editingUser.id });
        setEditingUser(null);
      } else {
        const newRef = doc(getCollectionRef('users'));
        await setDoc(newRef, { ...userForm, id: newRef.id });
      }
      setUserForm({ user: '', pass: '', role: 'AREA', label: '', area: '' });
      setStatus({type:'success', message:'Usuário salvo.'});
    } catch(err) {
      setStatus({type:'error', message:'Erro ao salvar usuário.'});
    }
  };
   
  const handleDeleteUser = async (id) => { 
    if(window.confirm('Excluir usuário?')) {
       try {
         await deleteDoc(getDocRef('users', id));
         setStatus({type:'success', message:'Usuário removido.'});
       } catch(err) { setStatus({type:'error', message:'Erro ao remover usuário.'}); }
    }
  };

  // --- BUDGET LOGIC (FIRESTORE) ---
  const handleBudgetChange = async (area, val) => {
    const numVal = cleanNumber(val);
    try {
      await setDoc(getDocRef('budgets', area), { id: area, value: numVal });
    } catch(err) {
      console.error("Erro salvando budget", err);
    }
  };

  const uniqueAreas = useMemo(() => {
    const areas = new Set();
    goals.forEach(g => { if(g.area) areas.add(g.area) });
    users.forEach(u => { if(u.area && u.area !== 'Todas') areas.add(u.area) });
    return Array.from(areas).sort();
  }, [goals, users]);

  if (isEditingGoal) {
      return (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold flex items-center gap-2"><Edit className="w-5 h-5" />{goalForm.id ? 'Editar Meta' : 'Nova Meta'}</h2><button onClick={() => setIsEditingGoal(false)} className="text-gray-500 hover:text-black"><X className="w-6 h-6" /></button></div>
          <form onSubmit={handleSaveGoal} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo</label>
                <select name="tipo" value={goalForm.tipo} onChange={handleGoalChange} className="w-full p-2 border rounded">
                  {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="Outro">Outro (Digitar)</option>
                </select>
              </div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Diretoria</label><input type="text" name="diretoria" value={goalForm.diretoria} onChange={handleGoalChange} className="w-full p-2 border rounded" required /></div>
              <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Área</label><input type="text" name="area" value={goalForm.area} onChange={handleGoalChange} className="w-full p-2 border rounded" required /></div>
            </div>
            
            {/* NOVO: DATA DE REFERÊNCIA E STATUS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">KPI</label><input type="text" name="kpi" value={goalForm.kpi} onChange={handleGoalChange} className="w-full p-2 border rounded" required /></div>
                <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Referência</label><input type="date" name="data_referencia" value={goalForm.data_referencia} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                  <select name="status" value={goalForm.status} onChange={handleGoalChange} className="w-full p-2 border rounded">
                      <option value="Em andamento">Em andamento</option>
                      <option value="Concluída">Concluída</option>
                  </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Objetivo</label><input type="text" name="objetivo" value={goalForm.objetivo} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">KR (Key Result)</label><input type="text" name="kr" value={goalForm.kr} onChange={handleGoalChange} className="w-full p-2 border rounded" placeholder="Descrição do resultado chave" /></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Peso</label><input type="text" name="peso" value={goalForm.peso} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Atingimento</label><input type="text" name="atingimento" value={goalForm.atingimento} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Res. Mensal</label><input type="text" name="resultado_mensal" value={goalForm.resultado_mensal} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
               <div><label className="block text-xs font-bold text-gray-700 uppercase mb-1">Res. Anual</label><input type="text" name="resultado_anual" value={goalForm.resultado_anual} onChange={handleGoalChange} className="w-full p-2 border rounded" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setIsEditingGoal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button><button type="submit" className="px-6 py-2 bg-black text-white rounded font-bold hover:bg-gray-800 flex items-center gap-2"><Save className="w-4 h-4" /> Salvar</button></div>
          </form>
        </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
       {/* ADMIN HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
         <div className="flex items-center gap-4">
           <div><h2 className="text-2xl font-bold text-gray-900">Painel Administrativo</h2><p className="text-gray-500 text-sm">Gestão via Firestore.</p></div>
         </div>
         <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => setTab('metas')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'metas' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Metas</button>
            <button onClick={() => setTab('usuarios')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'usuarios' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Usuários</button>
            <button onClick={() => setTab('financeiro')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'financeiro' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Orçamento</button>
         </div>
       </div>

       {/* DEBUG INFO BOX */}
       <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 flex flex-col gap-2 text-xs">
         <div className="flex items-center gap-2 font-bold text-gray-700">
           <Search className="w-4 h-4" /> Diagnóstico de Banco de Dados
         </div>
         <p className="text-gray-600">
           Seus dados estão salvos no Firestore no seguinte caminho:
         </p>
         <code className="block bg-black text-green-400 p-3 rounded font-mono break-all">
           artifacts / <span className="text-white font-bold">{getAppId()}</span> / public / data / goals
         </code>
         <p className="text-gray-500 italic mt-1">
           * Se não encontrar a coleção "artifacts" na raiz, clique em "Iniciar coleção", digite "artifacts" e cancele. Isso força o console a mostrar pastas ocultas.
         </p>
       </div>

       {/* TAB: METAS */}
       {tab === 'metas' && (
         <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
             <div className="flex items-center gap-2 text-gray-600"><Database className="w-4 h-4" /><span className="text-sm font-bold">{goals.length} metas cadastradas</span></div>
             <div className="flex gap-2">
                <button onClick={handleDeleteAllGoals} className="text-red-600 hover:text-red-800 text-sm font-bold px-3 py-1 border border-red-200 rounded hover:bg-red-50 transition">Limpar Tudo</button>
                <button onClick={handleNewGoal} className="bg-black text-white px-3 py-1 rounded text-sm font-bold hover:bg-gray-800 transition">+ Nova Meta</button>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs">
                 <tr>
                   <th className="px-4 py-3">Tipo</th>
                   <th className="px-4 py-3">Área</th>
                   <th className="px-4 py-3">KR / KPI</th>
                   <th className="px-4 py-3">Ref.</th>
                   <th className="px-4 py-3 text-center">Status</th>
                   <th className="px-4 py-3 text-center">Peso</th>
                   <th className="px-4 py-3 text-center">Ating.</th>
                   <th className="px-4 py-3 text-right">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {goals.map(item => (
                   <tr key={item.id} className="hover:bg-gray-50">
                     <td className="px-4 py-3"><span className="text-xs font-bold text-gray-500">{item.tipo}</span></td>
                     <td className="px-4 py-3 font-medium">{item.area}</td>
                     <td className="px-4 py-3 font-bold text-gray-900">{item.kr || item.kpi}</td>
                     <td className="px-4 py-3 text-xs text-gray-500">{safeDateDisplay(item.data_referencia)}</td>
                     <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.status === 'Concluída' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {item.status || 'Em andamento'}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-center">{item.peso}%</td>
                     <td className="px-4 py-3 text-center">{item.atingimento}%</td>
                     <td className="px-4 py-3 text-right flex justify-end gap-2">
                       <button onClick={() => handleEditGoal(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-4 h-4" /></button>
                       <button onClick={() => handleDeleteGoal(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow border border-gray-200 h-fit">
             <h3 className="font-bold text-gray-900 mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
             <form onSubmit={handleSaveUser} className="space-y-4">
               <div><label className="block text-xs font-bold text-gray-500 mb-1">Login (Usuário)</label><input type="text" className="w-full p-2 border rounded" value={userForm.user} onChange={e => setUserForm({...userForm, user: e.target.value})} required /></div>
               <div><label className="block text-xs font-bold text-gray-500 mb-1">Senha</label><input type="text" className="w-full p-2 border rounded" value={userForm.pass} onChange={e => setUserForm({...userForm, pass: e.target.value})} required /></div>
               <div><label className="block text-xs font-bold text-gray-500 mb-1">Nome/Label</label><input type="text" className="w-full p-2 border rounded" value={userForm.label} onChange={e => setUserForm({...userForm, label: e.target.value})} required placeholder="Ex: Diretoria Financeira" /></div>
               <div><label className="block text-xs font-bold text-gray-500 mb-1">Perfil</label><select className="w-full p-2 border rounded" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}><option value="AREA">Área (Comum)</option><option value="CEO">CEO</option><option value="ADMIN">Admin</option></select></div>
               {userForm.role === 'AREA' && (
                 <div><label className="block text-xs font-bold text-gray-500 mb-1">Área Vinculada</label><input type="text" className="w-full p-2 border rounded" value={userForm.area} onChange={e => setUserForm({...userForm, area: e.target.value})} placeholder="Nome EXATO da área" /></div>
               )}
               <div className="pt-2 flex gap-2">
                 <button type="submit" className="flex-1 bg-black text-white py-2 rounded font-bold hover:bg-gray-800">Salvar</button>
                 {editingUser && <button type="button" onClick={() => { setEditingUser(null); setUserForm({ user: '', pass: '', role: 'AREA', label: '', area: '' }) }} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>}
               </div>
             </form>
           </div>
           <div className="md:col-span-2 bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b"><tr className="text-gray-500 text-xs uppercase"><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Senha</th><th className="px-4 py-3">Perfil</th><th className="px-4 py-3 text-right">Ações</th></tr></thead>
               <tbody className="divide-y divide-gray-100">
                 {users.map(u => (
                   <tr key={u.id}>
                     <td className="px-4 py-3 font-bold">{u.label} <span className="text-xs font-normal text-gray-400 block">{u.area}</span></td>
                     <td className="px-4 py-3 font-mono text-gray-600">{u.user}</td>
                     <td className="px-4 py-3 font-mono text-gray-400">••••••</td>
                     <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'CEO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>{u.role}</span></td>
                     <td className="px-4 py-3 text-right">
                       <button onClick={() => { setEditingUser(u); setUserForm(u); }} className="text-blue-600 hover:text-blue-800 mr-3">Editar</button>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-800">Excluir</button>
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
         <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-yellow-50">
              <h3 className="font-bold text-yellow-900 flex items-center gap-2"><Wallet className="w-5 h-5"/> Configuração de Orçamento (Target)</h3>
              <p className="text-sm text-yellow-700 mt-1">Valores salvos automaticamente no Firestore.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueAreas.map(area => (
                  <div key={area} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{area}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">R$</span>
                      <input 
                        type="number" 
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-black outline-none font-mono font-bold text-gray-800"
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
   
  const [user, setUser] = useState(null); // Local user state (app login)
  const [activeTab, setActiveTab] = useState('company'); 
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  
  // --- FIREBASE SYNC ---
  // 1. Authenticate with Firebase first
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

  // 2. Sync Collections (only if authenticated)
  useEffect(() => {
    if (!firebaseUser) return;

    // Sync Goals
    const unsubGoals = onSnapshot(getCollectionRef('goals'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setGoals(data);
    });

    // Sync Users
    const unsubUsers = onSnapshot(getCollectionRef('users'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setUsers(data);
    });

    // Sync Budgets
    const unsubBudgets = onSnapshot(getCollectionRef('budgets'), (snapshot) => {
      const budgetObj = {};
      snapshot.docs.forEach(doc => {
        budgetObj[doc.id] = doc.data().value;
      });
      setBudgets(budgetObj);
    });

    return () => {
      unsubGoals();
      unsubUsers();
      unsubBudgets();
    };
  }, [firebaseUser]);

  // -- GROUPING LOGIC --
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
    return groupData(raw);
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
    return groupData(raw);
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
  
  // --- IMPORT CSV WITH BATCH WRITE (FIXED CHUNKING) ---
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setStatus({ type: 'loading', message: 'Lendo arquivo e enviando para o banco...' });
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const buffer = e.target.result; let text = ''; try { const decoder = new TextDecoder('utf-8', { fatal: true }); text = decoder.decode(buffer); } catch (err) { const decoder = new TextDecoder('windows-1252'); text = decoder.decode(buffer); }
        const firstLineEnd = text.indexOf('\n'); const firstLine = text.substring(0, firstLineEnd > -1 ? firstLineEnd : text.length); const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
        const rows = []; let currentRow = []; let currentField = ''; let inQuotes = false;
        for (let i = 0; i < text.length; i++) { const char = text[i]; const nextChar = text[i + 1]; if (char === '"') { if (inQuotes && nextChar === '"') { currentField += '"'; i++; } else { inQuotes = !inQuotes; } } else if (char === delimiter && !inQuotes) { currentRow.push(currentField); currentField = ''; } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) { currentRow.push(currentField); rows.push(currentRow); currentRow = []; currentField = ''; if (char === '\r') i++; } else { if (char !== '\r') currentField += char; } }
        if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
        const validRows = rows.filter(row => row.length > 1 && row.some(cell => cell.trim().length > 0)); if (validRows.length < 2) { setStatus({ type: 'error', message: 'Arquivo vazio ou formato inválido.' }); return; }
        const headers = validRows[0].map(h => h.trim().replace(/^"|"$/g, '').replace(/^\uFEFF/, '')); const dataRows = validRows.slice(1);
        
        // Chunking for batch (limit 500 operations per batch)
        const chunks = [];
        const chunkSize = 450; // safe margin
        for (let i = 0; i < dataRows.length; i += chunkSize) {
            chunks.push(dataRows.slice(i, i + chunkSize));
        }

        let totalProcessed = 0;
        
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((values) => {
                 const obj = {}; 
                 headers.forEach((header, index) => { 
                    let value = values[index] || ''; 
                    let key = (header || '').toLowerCase().trim(); 
                    if(key.includes('kpi') || key.includes('indicador')) key = 'kpi'; 
                    else if(key.includes('peso')) key = 'peso'; 
                    else if(key.includes('atingimento')) key = 'atingimento'; 
                    else if(key.includes('diretoria')) key = 'diretoria'; 
                    else if(key.includes('tipo')) key = 'tipo'; 
                    else if(key.includes('área') || key.includes('area')) key = 'area'; 
                    else if(key.includes('mensal') || key.includes('realizado_mes') || key === 'mes') key = 'resultado_mensal'; 
                    else if(key.includes('anual') || key.includes('ytd') || key.includes('acumulado') || key.includes('realizado_ano')) key = 'resultado_anual'; 
                    else if(key.includes('data') || key.includes('ref')) key = 'data_referencia'; 
                    else if(key.includes('kr') || key.includes('key result') || key.includes('resultado chave')) key = 'kr'; 
                    else key = header; 
                    
                    if (['id', 'atingimento', 'peso', 'resultado_mensal', 'resultado_anual'].includes(key)) { 
                        const num = cleanNumber(value); 
                        if (['atingimento', 'peso'].includes(key) && !String(value).includes('%') && num <= 2.0 && num !== 0) { 
                            obj[key] = num * 100; 
                        } else { 
                            obj[key] = num; 
                        } 
                    } else if (key === 'data_referencia') { 
                        if (typeof value === 'string' && value.match(/^\d{2}\/\d{2}\/\d{4}$/)) { 
                            const [day, month, year] = value.split('/'); 
                            obj[key] = `${year}-${month}-${day}`; 
                        } else { 
                            obj[key] = value; 
                        } 
                    } else { 
                        obj[key] = value || ''; 
                    } 
                 });

                 // Lógica Automática de Status: Se atingimento >= 100, Concluída.
                 if (obj.atingimento !== undefined) {
                    const val = Number(obj.atingimento);
                    if (!isNaN(val)) {
                        obj.status = val >= 100 ? 'Concluída' : 'Em andamento';
                    } else {
                        obj.status = 'Em andamento';
                    }
                 } else {
                    obj.status = 'Em andamento';
                 }
                 
                 // Create ref with auto-ID
                 const ref = doc(getCollectionRef('goals'));
                 batch.set(ref, { ...obj, id: ref.id });
                 totalProcessed++;
            });
            await batch.commit();
        }

        setStatus({ type: 'success', message: `${totalProcessed} metas enviadas para o banco de dados!` });

      } catch (error) { console.error(error); setStatus({ type: 'error', message: 'Erro ao processar arquivo.' }); }
    }; reader.onerror = () => setStatus({ type: 'error', message: 'Falha na leitura.' }); reader.readAsArrayBuffer(file);
    event.target.value = ''; 
  };
  
  const closeStatus = () => setStatus({ type: 'idle', message: '' });

  // Waiting for Auth
  if (!firebaseUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;

  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); if(u.role === 'ADMIN') setActiveTab('admin'); else if(u.role === 'CEO') setActiveTab('overview'); else setActiveTab('company'); }} users={users} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <StatusDialog status={status} onClose={closeStatus} />
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4"><div className="bg-black text-white w-8 h-8 rounded flex items-center justify-center font-bold">B</div><div><h1 className="text-lg font-bold text-gray-900 leading-tight">Portal de Metas</h1><p className="text-xs text-gray-500">Logado como: <span className="font-semibold text-black">{user.label}</span></p></div></div>
          <div className="flex items-center space-x-2"><button onClick={handleExport} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full" title="Exportar CSV"><Download className="w-5 h-5" /></button><button onClick={handleImportClick} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full" title="Importar CSV"><Upload className="w-5 h-5" /></button><div className="h-6 w-px bg-gray-200 mx-2"></div><button onClick={() => setUser(null)} className="flex items-center text-sm font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"><LogOut className="w-4 h-4 mr-2" /> Sair</button></div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit mb-8 overflow-x-auto">
          {user.role === 'ADMIN' && (<button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap flex items-center gap-2 ${activeTab === 'admin' ? 'bg-black text-white shadow' : 'text-gray-600 hover:text-black'}`}><Settings className="w-4 h-4" /> Administração</button>)}
          <button onClick={() => setActiveTab('company')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'company' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}>Empresa (Global)</button>
          {user.role === 'CEO' && (<button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'overview' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}>Visão CEO</button>)}
          {(user.role !== 'CEO' && user.role !== 'ADMIN') && (<button onClick={() => setActiveTab('area')} className={`px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${activeTab === 'area' ? 'bg-white shadow text-black' : 'text-gray-600 hover:text-black'}`}>Minha Área</button>)}
        </div>

        {activeTab === 'admin' && user.role === 'ADMIN' && (<AdminPanel goals={goals} users={users} budgets={budgets} setStatus={setStatus} />)}

        {activeTab === 'company' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl"><div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold mb-2">Resultado Global da Empresa</h2><p className="text-gray-400">Consolidado dos KPIs Organizacionais</p></div><div className="text-right"><div className={`text-5xl font-bold ${companyResult >= 100 ? 'text-green-400' : 'text-yellow-400'}`}>{companyResult}%</div><span className="text-sm bg-white/10 px-2 py-1 rounded">Média Ponderada + Extras</span></div></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{companyGoals.map(goal => (<GoalCard key={goal.id} goal={goal} history={goal.history} />))}</div>
          </div>
        )}

        {activeTab === 'area' && user.role === 'AREA' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-800">{user.area}</h2><p className="text-gray-500 text-sm">Desempenho da Diretoria</p></div><div className="flex items-center gap-3"><div className="text-right"><span className="block text-3xl font-bold text-gray-900">{areaResult}%</span><span className="text-xs text-gray-400">Atingimento</span></div><PieChart className={`w-10 h-10 ${areaResult >= 100 ? 'text-green-500' : 'text-yellow-500'}`} /></div></div>
              <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-800">Empresa</h2><p className="text-gray-500 text-sm">Gatilho Global</p></div><div className="flex items-center gap-3"><div className="text-right"><span className="block text-3xl font-bold text-gray-900">{companyResult}%</span><span className="text-xs text-gray-400">Atingimento</span></div><BarChart3 className="w-10 h-10 text-blue-500" /></div></div>
            </div>
            <AreaScoreTable goals={areaGoals} finalScore={areaResult} />
            <div><h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Metas da Área</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{areaGoals.length > 0 ? (areaGoals.map(goal => (<GoalCard key={goal.id} goal={goal} history={goal.history} />))) : (<div className="col-span-2 text-center py-10 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500">Nenhuma meta cadastrada para esta área.</div>)}</div></div>
            <div id="calculator-section"><BonusCalculator companyResult={companyResult} areaResult={areaResult} /></div>
          </div>
        )}

        {activeTab === 'overview' && user.role === 'CEO' && (
          <div className="animate-fade-in space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 text-sm font-medium">Média Global (Empresa)</h3><TrendingUp className="w-5 h-5 text-green-500" /></div><div className="text-3xl font-bold text-gray-900">{companyResult}%</div><p className="text-xs text-gray-400 mt-1">Baseado em {companyGoals.length} KPIs globais</p></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 text-sm font-medium">Áreas Monitoradas</h3><Users className="w-5 h-5 text-blue-500" /></div><div className="text-3xl font-bold text-gray-900">{allAreasSummary.length}</div><p className="text-xs text-gray-400 mt-1">Diretorias ativas</p></div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 text-sm font-medium">Projeção Total Bônus</h3><DollarSign className="w-5 h-5 text-yellow-500" /></div><div className="text-3xl font-bold text-gray-900">{formatCurrency(totalBonusProjection)}</div><p className="text-xs text-gray-400 mt-1">Estimativa de desembolso bruto (Target)</p></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50"><h3 className="font-bold text-gray-800">Performance por Área</h3></div>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="bg-gray-50 text-gray-500 border-b border-gray-100"><th className="px-6 py-3 font-medium">Área / Diretoria</th><th className="px-6 py-3 font-medium text-right">Target Bônus</th><th className="px-6 py-3 font-medium">Atingimento Médio</th><th className="px-6 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium text-right">Projeção Pagamento</th></tr></thead><tbody className="divide-y divide-gray-100">{allAreasSummary.map((area, idx) => (<tr key={idx} className="hover:bg-gray-50 transition"><td className="px-6 py-4 font-medium text-gray-900">{area.name}</td><td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">{formatCurrency(area.budget)}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden"><div className={`h-full ${getProgressColor(area.score)}`} style={{ width: `${Math.min(area.score, 100)}%` }}></div></div><span className="text-xs font-bold">{area.score}%</span></div></td><td className="px-6 py-4">{area.score >= 100 ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Meta Batida</span>) : area.score >= 80 ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Na média</span>) : (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Abaixo</span>)}</td><td className="px-6 py-4 text-right font-mono text-gray-600">{formatCurrency(area.projectedPayment)}</td></tr>))}</tbody></table></div>
              </div>
          </div>
        )}
      </main>
    </div>
  );
}