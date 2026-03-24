import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileDown, Info, Calculator, FileSpreadsheet, Send, ChevronDown } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FinanceTaxes() {
  const { formatMoney } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [isEduOpen, setIsEduOpen] = useState(false);
  
  // Data State
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [montos, setMontos] = useState({ ventasTotales: 0, comprasTotales: 0 });

  const businessId = localStorage.getItem('korat_business_id');

  useEffect(() => {
    if (businessId) fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // 1. Fetch Ventas (Citas Completadas)
      const { data: citasData } = await supabase
        .from('citas')
        .select(`
          id, fecha, precio,
          clientes!inner(nombre, telefono)
        `)
        .eq('business_id', businessId)
        .eq('estado', 'Completada')
        .gte('fecha', startOfMonth)
        .lte('fecha', endOfMonth);

      // 2. Fetch Compras (Gastos)
      const { data: gastosData } = await supabase
        .from('finances_expenses')
        .select('*')
        .eq('business_id', businessId)
        .gte('expense_date', startOfMonth)
        .lte('expense_date', endOfMonth);

      const vData = citasData || [];
      const cData = gastosData || [];

      setVentas(vData);
      setCompras(cData);

      const vTotal = vData.reduce((sum, item) => sum + Number(item.precio || 0), 0);
      const cTotal = cData.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      setMontos({ ventasTotales: vTotal, comprasTotales: cTotal });
    } catch (error) {
      console.error('Error al obtener datos fiscales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert to CSV and Trigger Download
  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + rows.map(e => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Exportar Registro de Ventas
  const exportarVentas = () => {
    const headers = ["Fecha", "Cliente", "Teléfono", "Base Imponible (Sin IGV)", "IGV (18%)", "Total Venta"];
    const rows = ventas.map(v => {
      const total = Number(v.precio || 0);
      const base = total / 1.18;
      const igv = total - base;
      return [
        format(new Date(v.fecha), 'yyyy-MM-dd'),
        v.clientes?.nombre || 'Cliente General',
        v.clientes?.telefono || '',
        base.toFixed(2),
        igv.toFixed(2),
        total.toFixed(2)
      ];
    });
    downloadCSV(`Registro_Ventas_${format(new Date(), 'MM-yyyy')}`, [headers, ...rows]);
  };

  // Exportar Registro de Compras
  const exportarCompras = () => {
    const headers = ["Fecha", "Concepto", "Categoría", "Base Imponible (Sin IGV)", "IGV (18%)", "Total Compra"];
    const rows = compras.map(c => {
      const total = Number(c.amount || 0);
      const base = total / 1.18;
      const igv = total - base;
      return [
        format(new Date(c.expense_date), 'yyyy-MM-dd'),
        c.title || 'Gasto',
        c.category || '',
        base.toFixed(2),
        igv.toFixed(2),
        total.toFixed(2)
      ];
    });
    downloadCSV(`Registro_Compras_${format(new Date(), 'MM-yyyy')}`, [headers, ...rows]);
  };

  const currentMonthName = format(new Date(), 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase());
  
  // Cálculos IGV
  const ventasBase = montos.ventasTotales / 1.18;
  const ventasIGV = montos.ventasTotales - ventasBase;
  const comprasBase = montos.comprasTotales / 1.18;
  const comprasIGV = montos.comprasTotales - comprasBase;
  const igvAPagar = ventasIGV - comprasIGV;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-3">
        <div className="animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 h-32" />
        <div className="animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 h-40" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-28 space-y-5">
      
      {/* ── Introducción Educativa ────────────────────────────── */}
      <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 overflow-hidden">
        <button 
          onClick={() => setIsEduOpen(!isEduOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 outline-none"
        >
          <div className="flex items-center gap-3">
            <Info className="flex-shrink-0 text-indigo-500" size={20} />
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
              ¿Cómo funciona este apartado? (Para Dueños)
            </h3>
          </div>
          <motion.div animate={{ rotate: isEduOpen ? 180 : 0 }} className="text-indigo-400 dark:text-indigo-500">
            <ChevronDown size={18} />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isEduOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 sm:px-5 pb-5 pt-1"
            >
              <div className="pl-8">
                <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed mb-3">
                  Cada mes tu contador necesita saber cuánto vendiste y cuánto gastaste para declarar tus impuestos a <strong>SUNAT</strong>. 
                  En lugar de enviar fotos de boletas desordenadas, aquí puedes enviar un resumen en <strong>Excel (CSV)</strong>.
                  Nilah ya separó la Base Imponible y el IGV (18%) matemático por ti.
                </p>
                <ol className="text-xs text-indigo-800 dark:text-indigo-200 list-decimal pl-4 space-y-1">
                  <li>Revisa tu resumen mensual aquí abajo.</li>
                  <li>Descarga ambos Registros (Ventas y Compras).</li>
                  <li>Envíalos a tu contador por WhatsApp o Correo. ¡Listo!</li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Consolidado Mensual Pre-PDT 621 ──────────────────────── */}
      <div className="bg-white dark:bg-[#111118] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.07] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="text-emerald-500" size={18} />
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            Pre-Cálculo de Impuestos ({currentMonthName})
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-[#0d0d14] rounded-xl p-3 border border-gray-100 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Ventas (Ingresos)</span>
            <span className="text-lg font-black text-gray-900 dark:text-white">S/ {montos.ventasTotales.toFixed(2)}</span>
            <div className="mt-1 flex justify-between text-[10px] text-gray-500">
              <span>Base: S/ {ventasBase.toFixed(2)}</span>
              <span>IGV: S/ {ventasIGV.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-[#0d0d14] rounded-xl p-3 border border-gray-100 dark:border-white/[0.05]">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Compras (Gastos)</span>
            <span className="text-lg font-black text-gray-900 dark:text-white">S/ {montos.comprasTotales.toFixed(2)}</span>
            <div className="mt-1 flex justify-between text-[10px] text-gray-500">
              <span>Base: S/ {comprasBase.toFixed(2)}</span>
              <span>IGV: S/ {comprasIGV.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-xl p-4 border ${igvAPagar > 0 ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'} flex justify-between items-center`}>
          <div>
            <h4 className={`text-sm font-bold ${igvAPagar > 0 ? 'text-amber-900 dark:text-amber-400' : 'text-emerald-900 dark:text-emerald-400'}`}>
              Balance Tributario aprox.
            </h4>
            <p className={`text-xs ${igvAPagar > 0 ? 'text-amber-700 dark:text-amber-500' : 'text-emerald-700 dark:text-emerald-500'}`}>
              {igvAPagar > 0 ? 'IGV estimado a pagar a SUNAT' : 'Crédito Fiscal a tu favor (IGV Compras mayor a Ventas)'}
            </p>
          </div>
          <p className={`text-xl font-black ${igvAPagar > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            S/ {Math.abs(igvAPagar).toFixed(2)}
          </p>
        </div>
      </div>

      {/* ── Botones de Exportación para Contador ──────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 px-1 flex items-center gap-2">
          <Send size={15} className="text-blue-500" /> Comparte con tu Contador
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button 
            onClick={exportarVentas}
            className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-[#111118] border border-gray-200 dark:border-white/[0.08] hover:border-blue-500 dark:hover:border-blue-500 p-5 rounded-2xl transition-all shadow-sm group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={20} />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">Registro de Ventas</span>
              <span className="text-[10px] text-gray-500">Excel / CSV compatible</span>
            </div>
          </button>

          <button 
            onClick={exportarCompras}
            className="flex flex-col items-center justify-center gap-2 bg-white dark:bg-[#111118] border border-gray-200 dark:border-white/[0.08] hover:border-purple-500 dark:hover:border-purple-500 p-5 rounded-2xl transition-all shadow-sm group active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileDown size={20} />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">Registro de Compras</span>
              <span className="text-[10px] text-gray-500">Excel / CSV compatible</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  );
}
