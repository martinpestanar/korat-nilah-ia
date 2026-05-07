import sys
with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Ahora reemplazar servicios
start_marker2 = "                    {/* ── Servicios (Multi-Selección) ──────────────────────── */}"
end_marker2 = "                    {/* ── Fecha & Hora ─────────────────────────────────────── */}"

start_idx2 = content.find(start_marker2)
end_idx2 = content.find(end_marker2)

if start_idx2 != -1 and end_idx2 != -1:
    servicios_new = '''                    {/* ── Servicios (Grid de Chips Interactivos) ──────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.2s' }}>
                      <label className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">💎</span> Servicios <span className="text-red-400">*</span>
                        {selectedServices.length > 0 && (
                          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary animate-pulse">
                            {selectedServices.length} activo(s)
                          </span>
                        )}
                      </label>

                      {filteredServices.length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-border p-5 text-center text-xs text-gray-400">
                          Selecciona una categoría primero o no hay servicios disponibles
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {filteredServices.map((s, i) => {
                            const isSelected = selectedServices.some(ss => ss.servicio === s.name);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedServices(prev => prev.filter(ss => ss.servicio !== s.name));
                                  } else {
                                    if ((s as any).es_variable) {
                                      setVariablePriceInput(String((s as any).price || ''));
                                      setVariablePricePendingSvc(s);
                                      setFormError(null);
                                      return;
                                    }
                                    const sId = formStaffId ? parseInt(formStaffId) : null;
                                    const sName = sId ? staffList.find(sl => sl.id === sId)?.nombre : undefined;
                                    setSelectedServices(prev => [...prev, {
                                      servicio: s.name,
                                      duracion_min: (s as any).durationMin || (s as any).duration || 60,
                                      precio: (s as any).price || 0,
                                      categoria: formCategoria || (s as any).categoria || '',
                                      staff_id: sId,
                                      _staffName: sName,
                                    }]);
                                  }
                                  setFormError(null);
                                }}
                                className={`svc-chip relative flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left transition-all overflow-hidden ${
                                  isSelected
                                    ? 'svc-chip-active border-primary bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/20'
                                    : 'border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-bg dark:hover:border-primary/40'
                                }`}
                                style={{ animationDelay: `${i * 0.03}s` }}
                              >
                                {isSelected && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                                )}
                                <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                                  isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-dark-card'
                                }`}>
                                  {isSelected ? <CheckCircle size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                                </div>
                                <div>
                                  <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary dark:text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {s.name}
                                  </p>
                                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                    {(s as any).es_variable ? 'Precio variable' : `S/ ${typeof s.price === 'number' ? s.price.toFixed(2) : s.price}`} · {s.durationMin || 60}m
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* ── Panel precio variable ─────────────────────────── */}
                      {variablePricePendingSvc && (() => {
                        const svc = variablePricePendingSvc;
                        const basePrice = svc.price || 0;
                        return (
                          <div className="mt-4 rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3 field-fade-in shadow-inner">
                            <div className="flex items-start gap-2">
                              <span className="text-xl leading-none">✏️</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 leading-tight">
                                  Precio personalizado — <span className="font-black">{svc.name}</span>
                                </p>
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                  Este servicio tiene precio a convenir.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <div className="relative flex-1">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">S/</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.50"
                                  autoFocus
                                  value={variablePriceInput}
                                  onChange={(e) => setVariablePriceInput(e.target.value)}
                                  placeholder={String(basePrice || '0.00')}
                                  className="w-full rounded-xl border-2 border-amber-300 bg-white dark:bg-dark-bg dark:border-amber-500/50 pl-10 pr-4 py-2.5 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-amber-300/30"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const precio = parseFloat(variablePriceInput) || 0;
                                  const sId = formStaffId ? parseInt(formStaffId) : null;
                                  const sName = sId ? staffList.find(sl => sl.id === sId)?.nombre : undefined;
                                  setSelectedServices(prev => [...prev, {
                                    servicio: svc.name,
                                    duracion_min: svc.durationMin || svc.duration || 60,
                                    precio,
                                    categoria: formCategoria || svc.categoria || '',
                                    staff_id: sId,
                                    _staffName: sName,
                                    _esVariable: true,
                                  } as any]);
                                  setVariablePriceInput('');
                                  setVariablePricePendingSvc(null);
                                  setFormError(null);
                                }}
                                className="flex-shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-amber-400/30 transition-all"
                              >
                                ✓ Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => { setVariablePricePendingSvc(null); setVariablePriceInput(''); }}
                                className="flex-shrink-0 rounded-xl bg-white dark:bg-dark-bg hover:bg-gray-50 border-2 border-amber-200 dark:border-amber-900 px-3 py-2.5 text-gray-400 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Lista de servicios seleccionados (Resumen) */}
                      {selectedServices.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {selectedServices.map((ss, idx) => {
                            const isVar = (ss as any)._esVariable;
                            return (
                            <div key={idx} className={`flex items-start gap-2 rounded-2xl border-2 px-3 py-2.5 ${isVar ? 'border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-500/30' : 'border-primary/20 bg-primary/5 dark:bg-primary/10'}`}>
                              <span className={`flex-shrink-0 h-6 w-6 rounded-full text-white text-[10px] font-black flex items-center justify-center mt-0.5 ${isVar ? 'bg-amber-500' : 'bg-primary'}`}>
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-bold text-gray-800 dark:text-white truncate">{ss.servicio}</p>
                                  {isVar && (
                                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                      ✏️ Variable
                                    </span>
                                  )}
                                </div>
                                {isVar ? (
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {serviceTimeslots[idx]?.start && serviceTimeslots[idx]?.end
                                        ? `${serviceTimeslots[idx].start} → ${serviceTimeslots[idx].end} · ` : ''}
                                      {ss.duracion_min}min{ss._staffName ? ` · 👤 ${ss._staffName.split(' ')[0]}` : ' · 🎲 Auto'} · S/
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.50"
                                      value={ss.precio}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setSelectedServices(prev => prev.map((item, i) => i === idx ? { ...item, precio: newPrice } : item));
                                      }}
                                      className="w-20 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-dark-bg px-2 py-1 text-xs font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-300/30"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {serviceTimeslots[idx]?.start && serviceTimeslots[idx]?.end
                                      ? `${serviceTimeslots[idx].start} → ${serviceTimeslots[idx].end} · ` : ''}
                                    {ss.duracion_min}min · S/ {typeof ss.precio === 'number' ? ss.precio.toFixed(2) : ss.precio}
                                    {ss._staffName ? ` · 👤 ${ss._staffName.split(' ')[0]}` : ' · 🎲 Auto'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );}))}
                          <div className="flex items-center justify-between rounded-2xl bg-gray-100 dark:bg-dark-bg px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300">
                            <span>⏱ Total: {selectedServices.reduce((a, s) => a + s.duracion_min, 0)} min</span>
                            <span>💰 S/ {selectedServices.reduce((a, s) => a + (Number(s.precio) || 0), 0).toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Required validation for services */}
                      <input type="text" required value={selectedServices.length > 0 ? 'valid' : ''} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden="true" />
                    </div>

'''
    final_content = content[:start_idx2] + servicios_new + content[end_idx2:]
    with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("Servicios reemplazados con éxito")
else:
    print("No se encontraron los marcadores de servicios")
