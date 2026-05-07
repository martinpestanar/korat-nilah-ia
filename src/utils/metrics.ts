import { Appointment } from '../types';
import { SIMULATION_DATE } from '../constants';

/**
 * PUNTUACIÓN DE FIABILIDAD (RELIABILITY SCORE)
 * Calcula del 0 al 100 qué tan confiable es un cliente.
 */
export const calculateReliabilityScore = (clientAppts: Appointment[]): { score: number; level: 'High' | 'Medium' | 'Low' } => {
  if (clientAppts.length === 0) return { score: 100, level: 'Medium' }; // Neutro para nuevos (Gris)

  let points = 0;
  const total = clientAppts.length;

  clientAppts.forEach(appt => {
    if (appt.estado === 'Completada') points += 100;
    else if (appt.estado === 'Cancelada' || appt.estado === 'Reagendada') points += 50; // Avisó
    else if (appt.estado === 'No-Show') points += 0; // Castigo máximo
    else points += 100; // Pendientes no afectan
  });

  const average = Math.round(points / total);

  let level: 'High' | 'Medium' | 'Low' = 'High';
  if (average < 50) level = 'Low';       // Escudo Rosa (Riesgo)
  else if (average < 90) level = 'Medium'; // Escudo Gris (Neutro)
  else level = 'High';                   // Escudo Índigo (Fiable)

  return { score: average, level };
};

/**
 * RIESGO DE ABANDONO (CHURN RISK)
 * Semáforo basado en días desde la última visita.
 * Acepta una fecha de referencia para simulaciones.
 */
export const calculateChurnRisk = (lastVisitStr: string, status: string, referenceDate: Date = SIMULATION_DATE) => {
  if (status === 'Inactivo') return { level: 'Lost', days: -1, color: 'text-gray-400', label: 'Inactivo', bg: 'bg-gray-100', border: 'border-gray-200' };
  if (lastVisitStr === '-' || !lastVisitStr) return { level: 'New', days: 0, color: 'text-blue-500', label: 'Nuevo', bg: 'bg-blue-50', border: 'border-blue-200' };

  const lastVisit = new Date(lastVisitStr);
  const today = referenceDate;
  
  // Diferencia en milisegundos
  const diffTime = today.getTime() - lastVisit.getTime();
  // Diferencia en días
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 45) {
      return { 
          level: 'High', 
          days: diffDays, 
          color: 'text-red-500', 
          bg: 'bg-red-500/10', 
          border: 'border-red-500/20', 
          label: 'Alto Riesgo' 
      };
  }
  
  if (diffDays > 25) {
      return { 
          level: 'Medium', 
          days: diffDays, 
          color: 'text-yellow-500', 
          bg: 'bg-yellow-500/10', 
          border: 'border-yellow-500/20', 
          label: 'Riesgo Medio' 
      };
  }

  return { 
      level: 'Low', 
      days: diffDays, 
      color: 'text-green-500', 
      bg: 'bg-green-500/10', 
      border: 'border-green-500/20', 
      label: 'Leal' 
  };
};