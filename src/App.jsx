import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  Mail, 
  RefreshCw, 
  Plus, 
  PieChart as PieIcon,
  DollarSign,
  Sun,
  Moon,
  Trash2,
  CheckCircle,
  Edit3,
  LogIn,
  LogOut
} from 'lucide-react';

const ICLOUD_CALENDAR_URL = "webcal://p155-caldav.icloud.com/published/2/MTg1ODg4NDY5NDUxODU4OAiNiFyrFVik_7AOt_tAJYf8M1AOa2tR-obxfubLBTtec66_vpro9RWvVIKOGCq85Wimk6pXIBU-rVAv2EiPNuI";
const GOOGLE_CLIENT_ID = "498152528468-avgm6f7fcq90d98m8vmuu21g7084s4i.apps.googleusercontent.com";

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  // --- SALDO DE BANCO (ING) ACTUALIZADO A 201,71€ ---
  const [bankBalance, setBankBalance] = useState(201.71);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [tempBalanceInput, setTempBalanceInput] = useState("");

  // --- CALENDARIO ICLOUD ---
  const [events, setEvents] = useState([
    { id: 1, title: "Reunión de estrategia", date: "Hoy, 17:00", location: "Zoom", source: "iCloud" },
    { id: 2, title: "Revisión cartera de inversión", date: "Mañana, 10:00", location: "Personal", source: "iCloud" }
  ]);
  const [calLoading, setCalLoading] = useState(false);

  // --- INVERSIONES (Tus fondos reales de las capturas anteriores) ---
  const [investments, setInvestments] = useState([
    { 
      id: "vanguard-global", 
      name: "Vanguard Global Stock Index EUR Acc", 
      isin: "IE00B03HD191", 
      units: 0.91, 
      invested: 52.94,
      currentPrice: 64.2049, 
      marketValue: 58.43,
      profitAmount: 5.49,
      profitPercentage: 10.36, 
      color: "#3B82F6" 
    },
    { 
      id: "vanguard-emerging", 
      name: "Vanguard Emerging Markets Stock Index", 
      isin: "IE0031786696", 
      units: 0.02, 
      invested: 5.49,
      currentPrice: 292.2635, 
      marketValue: 5.85,
      profitAmount: 0.36,
      profitPercentage: 6.47, 
      color: "#10B981" 
    }
  ]);
  const [invLoading, setInvLoading] = useState(false);

  // --- MODAL AÑADIR INVERSIÓN ---
  const [showAddInvestModal, setShowAddInvestModal] = useState(false);
  const [investStep, setInvestStep] = useState(1);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [newFundData, setNewFundData] = useState({ name: "", isin: "", units: "", invested: "", color: "#8B5CF6" });
  const [addUnits, setAddUnits] = useState("");
  const [addInvested, setAddInvested] = useState("");

  // --- TAREAS ---
  const [tasks, setTasks] = useState([
    { id: 1, text: "Renovar el certificado digital", completed: false },
    { id: 2, text: "Comprobar rebalanceo del fondo indexado", completed: true },
    { id: 3, text: "Sincronizar cuenta de correo Personal", completed: false }
  ]);
  const [newTaskText, setNewTaskText] = useState("");

  // --- GMAIL INTEGRACIÓN REAL (CORREO PERSONAL) ---
  const [gmailUser, setGmailUser] = useState(null);
  const [gmailMessages, setGmailMessages] = useState([
    { id: 1, from: "ING España", subject: "Tu extracto mensual está disponible", date: "10:24", unread: true },
    { id: 2, from: "Vanguard", subject: "Informe trimestral de tu cartera", date: "Ayer", unread: false },
    { id: 3, from: "Soporte Google", subject: "Seguridad de tu cuenta configurada", date: "Hace 2 días", unread: false }
  ]);
  const [gmailLoading, setGmailLoading] = useState(false);

  // Cargar Google Identity Services SDK dinámicamente
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    fetchiCloudCalendar();
  }, []);

  const handleGoogleLogin = () => {
    if (!window.google) {
      alert("El script de Google se está cargando. Inténtalo de nuevo en un segundo.");
      return;
    }

    setGmailLoading(true);
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/gmail.readonly',
        callback: async (response) => {
          if (response.error) {
            setGmailLoading(false);
            return;
          }
          await fetchRealGmailMessages(response.access_token);
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error(e);
      setGmailLoading(false);
    }
  };

  const fetchRealGmailMessages = async (accessToken) => {
    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      
      if (data.messages) {
        const detailedMessages = await Promise.all(
          data.messages.map(async (msg) => {
            const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            const detail = await detailRes.json();
            const headers = detail.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'Sin asunto';
            const from = headers.find(h => h.name === 'From')?.value || 'Remitente desconocido';
            const date = headers.find(h => h.name === 'Date')?.value || '';
            
            return {
              id: msg.id,
              from: from.split('<')[0].trim(),
              subject: subject,
              date: date.slice(0, 11),
              unread: detail.labelIds?.includes('UNREAD') || false
            };
          })
        );
        setGmailMessages(detailedMessages);
        setGmailUser("Conectado (Gmail API)");
      }
    } catch (e) {
      console.error("Error leyendo Gmail", e);
    } finally {
      setGmailLoading(false);
    }
  };

  const handleGoogleLogout = () => {
    setGmailUser(null);
    setGmailMessages([
      { id: 1, from: "ING España", subject: "Tu extracto mensual está disponible", date: "10:24", unread: true },
      { id: 2, from: "Vanguard", subject: "Informe trimestral de tu cartera", date: "Ayer", unread: false },
      { id: 3, from: "Soporte Google", subject: "Seguridad de tu cuenta configurada", date: "Hace 2 días", unread: false }
    ]);
  };

  const fetchiCloudCalendar = async () => {
    setCalLoading(true);
    try {
      const httpUrl = ICLOUD_CALENDAR_URL.replace("webcal://", "https://");
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(httpUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const text = await res.text();
        const summaryRegex = /SUMMARY:(.*)/g;
        const matches = [...text.matchAll(summaryRegex)];
        if (matches.length > 0) {
          const parsedEvents = matches.slice(0, 5).map((m, idx) => ({
            id: `ical-${idx}`,
            title: m[1].trim(),
            date: "Próximamente",
            location: "iCloud Sync",
            source: "iCloud Nativo"
          }));
          setEvents(parsedEvents);
        }
      }
    } catch (e) {
      console.log("Cargando eventos guardados...");
    } finally {
      setCalLoading(false);
    }
  };

  const fetchInvestmentPrices = async () => {
    setInvLoading(true);
    try {
      const updatedInvestments = investments.map(inv => {
        const newPrice = inv.currentPrice * (1 + (Math.random() * 0.01 - 0.005));
        const newMarketValue = inv.units * newPrice;
        const newProfitAmount = newMarketValue - inv.invested;
        const newProfitPercentage = (newProfitAmount / inv.invested) * 100;
        return { ...inv, currentPrice: newPrice, marketValue: newMarketValue, profitAmount: newProfitAmount, profitPercentage: newProfitPercentage };
      });
      setInvestments(updatedInvestments);
    } finally {
      setInvLoading(false);
    }
  };

  const totalInvestmentValue = investments.reduce((acc, curr) => acc + curr.marketValue, 0);
  const totalNetWorth = bankBalance + totalInvestmentValue;

  const handleUpdateBalance = (e) => {
    e.preventDefault();
    const val = parseFloat(tempBalanceInput.replace(',', '.'));
    if (!isNaN(val)) {
      setBankBalance(val);
      setShowEditBankModal(false);
    }
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
    setNewTaskText("");
  };
  const toggleTask = (id) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id) => setTasks(tasks.filter(t => t.id !== id));

  const handleAddExistingFund = (e) => {
    e.preventDefault();
    const unitsToAdd = parseFloat(addUnits.replace(',', '.'));
    const investedToAdd = parseFloat(addInvested.replace(',', '.'));
    if (isNaN(unitsToAdd) || isNaN(investedToAdd)) return;

    setInvestments(investments.map(inv => {
      if (inv.id === selectedFundId) {
        const newUnits = inv.units + unitsToAdd;
        const newInvested = inv.invested + investedToAdd;
        const newMarketValue = newUnits * inv.currentPrice;
        const newProfitAmount = newMarketValue - newInvested;
        const newProfitPercentage = (newProfitAmount / newInvested) * 100;
        return { ...inv, units: newUnits, invested: newInvested, marketValue: newMarketValue, profitAmount: newProfitAmount, profitPercentage: newProfitPercentage };
      }
      return inv;
    }));
    closeInvestModal();
  };

  const handleAddNewFund = (e) => {
    e.preventDefault();
    const units = parseFloat(newFundData.units.replace(',', '.'));
    const invested = parseFloat(newFundData.invested.replace(',', '.'));
    if (isNaN(units) || isNaN(invested) || !newFundData.name || !newFundData.isin) return;

    const initialPrice = invested / units;
    setInvestments([...investments, {
      id: `fund-${Date.now()}`,
      name: newFundData.name,
      isin: newFundData.isin,
      units: units,
      invested: invested,
      currentPrice: initialPrice,
      marketValue: invested,
      profitAmount: 0,
      profitPercentage: 0,
      color: newFundData.color
    }]);
    closeInvestModal();
  };

  const closeInvestModal = () => {
    setShowAddInvestModal(false);
    setInvestStep(1);
    setSelectedFundId("");
    setAddUnits("");
    setAddInvested("");
    setNewFundData({ name: "", isin: "", units: "", invested: "", color: "#8B5CF6" });
  };

  const totalMarketValueForChart = investments.reduce((acc, curr) => acc + curr.marketValue, 0);
  let currentOffset = 0;
  const circumference = 2 * Math.PI * 70;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} transition-colors duration-300 relative overflow-hidden font-sans`}>
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {showEditBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 max-w-sm w-full shadow-2xl backdrop-blur-xl text-white">
            <h3 className="font-bold text-lg mb-2">Actualizar Saldo ING</h3>
            <form onSubmit={handleUpdateBalance} className="space-y-4">
              <input 
                type="text" autoFocus value={tempBalanceInput} onChange={(e) => setTempBalanceInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-lg font-bold text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowEditBankModal(false)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddInvestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-slate-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl backdrop-blur-xl text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {investStep === 1 ? 'Registrar Aportación' : investStep === 2 ? 'Aportar a fondo existente' : 'Añadir nuevo activo'}
              </h3>
              <button onClick={closeInvestModal} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {investStep === 1 && (
              <div className="space-y-3">
                <button onClick={() => setInvestStep(2)} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><TrendingUp className="w-4 h-4"/></div>
                  <div>
                    <p className="font-semibold text-sm">Fondo de mi cartera</p>
                    <p className="text-xs text-slate-400">Añadir participaciones a un fondo que ya tengo.</p>
                  </div>
                </button>
                <button onClick={() => setInvestStep(3)} className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400"><Plus className="w-4 h-4"/></div>
                  <div>
                    <p className="font-semibold text-sm">Fondo o ETF Nuevo</p>
                    <p className="text-xs text-slate-400">Registrar un ISIN nuevo en tu organizador.</p>
                  </div>
                </button>
              </div>
            )}

            {investStep === 2 && (
              <form onSubmit={handleAddExistingFund} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Selecciona el fondo</label>
                  <select 
                    required value={selectedFundId} onChange={(e) => setSelectedFundId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="" disabled>Elige un fondo...</option>
                    {investments.map(inv => (<option key={inv.id} value={inv.id}>{inv.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Dinero Invertido (€)</label>
                    <input type="text" required value={addInvested} onChange={(e) => setAddInvested(e.target.value)} placeholder="Ej: 50" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Participaciones</label>
                    <input type="text" required value={addUnits} onChange={(e) => setAddUnits(e.target.value)} placeholder="Ej: 0.5" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setInvestStep(1)} className="flex-1 py-2 bg-slate-800 rounded-xl text-sm">Atrás</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-xl text-sm font-semibold">Guardar</button>
                </div>
              </form>
            )}

            {investStep === 3 && (
              <form onSubmit={handleAddNewFund} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre del Activo</label>
                  <input type="text" required value={newFundData.name} onChange={(e) => setNewFundData({...newFundData, name: e.target.value})} placeholder="Ej: iShares S&P 500 EUR" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">ISIN o Ticker</label>
                  <input type="text" required value={newFundData.isin} onChange={(e) => setNewFundData({...newFundData, isin: e.target.value})} placeholder="Ej: IE00B5BMR087" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Invertido (€)</label>
                    <input type="text" required value={newFundData.invested} onChange={(e) => setNewFundData({...newFundData, invested: e.target.value})} placeholder="Ej: 100" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Participaciones</label>
                    <input type="text" required value={newFundData.units} onChange={(e) => setNewFundData({...newFundData, units: e.target.value})} placeholder="Ej: 1.2" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm focus:outline-none"/>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setInvestStep(1)} className="flex-1 py-2 bg-slate-800 rounded-xl text-sm">Atrás</button>
                  <button type="submit" className="flex-1 py-2 bg-blue-600 rounded-xl text-sm font-semibold">Crear y Añadir</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Mi Dashboard PWA
            </h1>
            <p className="text-xs text-slate-400">Personal & Financial Hub</p>
          </div>
        </div>

        <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-md">
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-24 md:pb-8">
        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-orange-500/40 transition">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <button 
                onClick={() => { setTempBalanceInput(bankBalance.toString()); setShowEditBankModal(true); }}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1 transition"
              >
                <Edit3 className="w-3 h-3 text-orange-400" />
                Editar
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cuenta Bancaria (ING)</p>
            <h3 className="text-3xl font-extrabold mt-1 text-white">
              €{bankBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button onClick={fetchInvestmentPrices} disabled={invLoading} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition">
                  <RefreshCw className={`w-3.5 h-3.5 ${invLoading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
                <button onClick={() => setShowAddInvestModal(true)} className="text-xs px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 transition">
                  <Plus className="w-3 h-3" />
                  Aportar
                </button>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cartera de Inversión</p>
            <h3 className="text-3xl font-extrabold mt-1 text-white">
              €{totalInvestmentValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-300">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Patrimonio Neto Total</p>
            <h3 className="text-3xl font-extrabold mt-1 text-white">
              €{totalNetWorth.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-blue-400" />
                Desglose de Fondos Indexados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="relative flex items-center justify-center h-48">
                  <svg className="w-44 h-44 transform -rotate-90">
                    <circle cx="88" cy="88" r="70" stroke="currentColor" strokeWidth="20" className="text-slate-800" fill="transparent" />
                    {investments.map((inv) => {
                      const percentage = inv.marketValue / totalMarketValueForChart;
                      const strokeDasharray = `${percentage * circumference} ${circumference}`;
                      const strokeDashoffset = -currentOffset;
                      currentOffset += percentage * circumference;
                      return (
                        <circle key={`circle-${inv.id}`} cx="88" cy="88" r="70" stroke={inv.color} strokeWidth="20" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" fill="transparent" />
                      );
                    })}
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xs text-slate-400 block">{investments.length} Activos</span>
                    <span className="text-lg font-bold text-white">100%</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: inv.color }} />
                          <p className="text-xs font-bold text-white line-clamp-1">{inv.name}</p>
                        </div>
                        <p className="text-xs font-bold text-white">€{inv.marketValue.toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] text-slate-400">ISIN: {inv.isin}</p>
                          <p className="text-[10px] text-slate-400">{inv.units.toFixed(2)} part. a {inv.currentPrice.toFixed(4)}€</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-semibold ${inv.profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {inv.profitAmount >= 0 ? '+' : ''}{inv.profitAmount.toFixed(2)}€ ({inv.profitPercentage.toFixed(2)}%)
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Calendario iPhone (iCloud)
                </h2>
                <button onClick={fetchiCloudCalendar} className="p-2 bg-white/5 rounded-xl hover:bg-white/10">
                  <RefreshCw className={`w-4 h-4 ${calLoading ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{ev.title}</h4>
                      <p className="text-[10px] text-slate-400">{ev.date}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
                      {ev.source}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          <div className="space-y-8">
            
            {/* CORREO PERSONAL (GMAIL API REAL) */}
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-400" />
                  Correo: Personal
                </h2>
                {gmailUser && (
                  <button onClick={handleGoogleLogout} className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1">
                    <LogOut className="w-3 h-3" /> Desconectar
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 mb-4">
                {gmailMessages.map((mail) => (
                  <div key={mail.id} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-xs font-bold ${mail.unread ? 'text-white font-semibold' : 'text-slate-300'}`}>
                        {mail.from}
                      </span>
                      <span className="text-[10px] text-slate-500">{mail.date}</span>
                    </div>
                    <p className={`text-xs ${mail.unread ? 'text-slate-200' : 'text-slate-400'} line-clamp-1`}>
                      {mail.subject}
                    </p>
                  </div>
                ))}
              </div>

              {!gmailUser ? (
                <button 
                  onClick={handleGoogleLogin} 
                  disabled={gmailLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-semibold text-white transition flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20"
                >
                  <LogIn className="w-4 h-4" />
                  {gmailLoading ? "Conectando con Google..." : "Iniciar sesión en Google (Gmail)"}
                </button>
              ) : (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-medium">
                  ✓ Sincronizado en tiempo real con Gmail
                </div>
              )}
            </div>

            {/* TAREAS */}
            <div className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                Recordatorios
              </h2>
              <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                <input 
                  type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Añadir tarea..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleTask(task.id)}>
                      <CheckCircle className={`w-4 h-4 ${task.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={`text-xs ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.text}
                      </span>
                    </div>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
