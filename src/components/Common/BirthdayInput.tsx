import React, { useState, useEffect } from 'react';

interface BirthdayInputProps {
  value: string; // Puede ser YYYY-MM-DD, DD/MM/YYYY, o DD/MM
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

const MESES = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

export const parseBirthdayParts = (raw: string) => {
  if (!raw || !raw.trim()) return { day: '', month: '', year: '' };
  const clean = raw.trim().split('T')[0].split(' ')[0];

  // Caso 1: DD/MM/YYYY o DD-MM-YYYY
  if (/^[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}$/.test(clean)) {
    const parts = clean.replace(/-/g, '/').split('/');
    return {
      day: parts[0].padStart(2, '0'),
      month: parts[1].padStart(2, '0'),
      year: parts[2]
    };
  }

  // Caso 2: YYYY-MM-DD o YYYY/MM/DD
  if (/^[0-9]{4}[/-][0-9]{1,2}[/-][0-9]{1,2}$/.test(clean)) {
    const parts = clean.replace(/\//g, '-').split('-');
    return {
      day: parts[2].padStart(2, '0'),
      month: parts[1].padStart(2, '0'),
      year: parts[0]
    };
  }

  // Caso 3: DD/MM o DD-MM (sin año)
  if (/^[0-9]{1,2}[/-][0-9]{1,2}$/.test(clean)) {
    const parts = clean.replace(/-/g, '/').split('/');
    return {
      day: parts[0].padStart(2, '0'),
      month: parts[1].padStart(2, '0'),
      year: ''
    };
  }

  return { day: '', month: '', year: '' };
};

export const formatBirthdayDisplay = (raw?: string | null): string | null => {
  if (!raw) return null;
  const { day, month } = parseBirthdayParts(raw);
  if (!day || !month) return null;
  const mesObj = MESES.find(m => m.value === month);
  const nombreMes = mesObj ? mesObj.label.slice(0, 3) : month;
  return `${parseInt(day, 10)} ${nombreMes}`;
};

export const BirthdayInput: React.FC<BirthdayInputProps> = ({ value, onChange, className = '' }) => {
  const parts = parseBirthdayParts(value);
  const [day, setDay] = useState(parts.day);
  const [month, setMonth] = useState(parts.month);
  const [year, setYear] = useState(parts.year);

  // Sincronizar si el valor externo cambia (ej. al abrir modal o cargar cliente)
  useEffect(() => {
    const p = parseBirthdayParts(value);
    setDay(p.day);
    setMonth(p.month);
    setYear(p.year);
  }, [value]);

  const updateValue = (newDay: string, newMonth: string, newYear: string) => {
    if (!newDay && !newMonth && !newYear) {
      onChange('');
      return;
    }

    if (!newDay || !newMonth) {
      // Si está incompleto, guardar lo que haya o vacío
      return;
    }

    const paddedDay = newDay.padStart(2, '0');
    const paddedMonth = newMonth.padStart(2, '0');

    if (newYear && newYear.trim().length === 4) {
      // Si ingresó año de 4 dígitos, guardamos estándar YYYY-MM-DD
      onChange(`${newYear.trim()}-${paddedMonth}-${paddedDay}`);
    } else {
      // Si el año es opcional / vacío, guardamos DD/MM
      onChange(`${paddedDay}/${paddedMonth}`);
    }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDay(val);
    updateValue(val, month, year);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMonth(val);
    updateValue(day, val, year);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    updateValue(day, month, val);
  };

  return (
    <div className={`grid grid-cols-12 gap-2 ${className}`}>
      {/* Día */}
      <div className="col-span-4">
        <select
          value={day}
          onChange={handleDayChange}
          className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-dark-bg px-2.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs min-h-[42px]"
        >
          <option value="">Día</option>
          {Array.from({ length: 31 }, (_, i) => {
            const d = String(i + 1).padStart(2, '0');
            return <option key={d} value={d}>{d}</option>;
          })}
        </select>
      </div>

      {/* Mes */}
      <div className="col-span-5">
        <select
          value={month}
          onChange={handleMonthChange}
          className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-dark-bg px-2.5 py-2.5 text-xs sm:text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs min-h-[42px]"
        >
          <option value="">Mes</option>
          {MESES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Año (Opcional) */}
      <div className="col-span-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={year}
          onChange={handleYearChange}
          placeholder="Año"
          title="Año (Opcional)"
          className="w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-dark-bg px-2.5 py-2.5 text-xs sm:text-sm text-center text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-xs min-h-[42px]"
        />
      </div>
    </div>
  );
};

export default BirthdayInput;
