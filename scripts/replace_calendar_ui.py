import sys
with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Buscamos las lineas usando string find para evitar regex si es posible
start_marker = "                    {/* ── Cliente ──────────────────────────────────────────── */}"
end_marker = "                    {/* ── Categoría — Card Grid ─────────────────────────────── */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    client_new = '''                    {/* ── Cliente (Searchable Combobox) ──────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.05s' }}>
                      <label htmlFor="client-search-input" className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">👤</span> Cliente <span className="text-red-400">*</span>
                      </label>

                      <div className="relative" ref={clientDropdownRef}>
                        {/* Trigger button / search input */}
                        <div
                          className={`flex items-center gap-2.5 w-full rounded-2xl border-2 px-3.5 py-3 cursor-text transition-all ${
                            isClientDropdownOpen
                              ? 'border-primary bg-white dark:bg-dark-card ring-4 ring-primary/10'
                              : formClient
                                ? 'border-primary/40 bg-white dark:bg-dark-card'
                                : 'border-gray-200 bg-gray-50 dark:border-dark-border dark:bg-dark-bg hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                          onClick={() => { if (!isSubmitting && !formClient) setIsClientDropdownOpen(true); }}
                        >
                          {formClient ? (() => {
                            const sel = clients.find(c => c.id.toString() === formClient);
                            const shield = sel ? getClientShield({ cliente_id: sel.id, nombre_cliente: sel.nombre } as Appointment) : null;
                            return (
                              <>
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary">
                                  {sel?.nombre?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{sel?.nombre || ''}</p>
                                  {sel?.telefono && <p className="text-[10px] text-gray-400 dark:text-gray-500">{sel.telefono}</p>}
                                </div>
                                {shield && shield.level === 'Low' && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">🚨 Riesgo</span>}
                                {shield && shield.level === 'Medium' && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">⚠️ Cuidado</span>}
                                <button type="button" aria-label="Cambiar cliente"
                                  onClick={(e) => { e.stopPropagation(); setFormClient(''); setClientSearch(''); setIsClientDropdownOpen(true); }}
                                  className="flex-shrink-0 rounded-xl p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                ><X size={13} /></button>
                              </>
                            );
                          })() : (
                            <>
                              <Search size={15} className="flex-shrink-0 text-gray-400" />
                              <input
                                id="client-search-input"
                                type="text"
                                placeholder="Buscar cliente por nombre o teléfono..."
                                autoComplete="off"
                                disabled={isSubmitting}
                                value={clientSearch}
                                onChange={(e) => { setClientSearch(e.target.value); setIsClientDropdownOpen(true); }}
                                onFocus={() => setIsClientDropdownOpen(true)}
                                className="flex-1 bg-transparent text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none min-w-0"
                              />
                            </>
                          )}
                        </div>

                        {/* Dropdown list */}
                        {isClientDropdownOpen && !formClient && (
                          <div className="client-dropdown absolute z-50 mt-2 w-full rounded-2xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl overflow-hidden">
                            <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-gray-100 dark:divide-dark-border/50">
                              {(() => {
                                const q = clientSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                const filtered = clients.filter(c =>
                                  !q ||
                                  c.nombre?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
                                  (c.telefono && c.telefono.replace(/\s/g,'').includes(clientSearch.replace(/\s/g,'')))
                                );
                                if (filtered.length === 0) return (
                                  <div className="px-4 py-8 text-center">
                                    <p className="text-2xl mb-1">🔍</p>
                                    <p className="text-sm font-medium text-gray-400">Sin resultados para "{clientSearch}"</p>
                                  </div>
                                );
                                return filtered.map((c, i) => {
                                  const shield = getClientShield({ cliente_id: c.id, nombre_cliente: c.nombre } as Appointment);
                                  return (
                                    <button key={c.id} type="button"
                                      onClick={() => { setFormClient(c.id.toString()); setClientSearch(''); setIsClientDropdownOpen(false); setFormError(null); }}
                                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors group"
                                    >
                                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-dark-bg text-sm font-black text-gray-600 dark:text-gray-300 group-hover:bg-primary/15 group-hover:text-primary transition-colors">
                                        {c.nombre?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.nombre}</p>
                                        {c.telefono && <p className="text-[10px] text-gray-400 truncate">{c.telefono}</p>}
                                      </div>
                                      {shield.level === 'Low' && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">🚨 Riesgo</span>}
                                      {shield.level === 'Medium' && <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">⚠️ Precauc.</span>}
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}

                        <input type="text" required value={formClient} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden="true" />
                      </div>

                      {/* Risk alert con cliente ya seleccionado */}
                      {formClient && (() => {
                        const cId = parseInt(formClient);
                        const cf = clients.find(c => c.id === cId);
                        if (!cf) return null;
                        const shield = getClientShield({ cliente_id: cId, nombre_cliente: cf.nombre } as Appointment);
                        if (shield.level === 'Low') return (
                          <div className="mt-2.5 flex gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 dark:bg-rose-900/20 dark:border-rose-900/40 field-fade-in">
                            <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
                            <div>
                              <strong className="block text-xs font-bold text-rose-700 dark:text-rose-400">⚠️ Alerta de riesgo</strong>
                              <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-300 leading-relaxed">Historial de inasistencias. Solicitar <span className="font-bold">depósito del 50%</span>.</p>
                            </div>
                          </div>
                        );
                        if (shield.level === 'Medium') return (
                          <div className="mt-2 flex gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 dark:bg-orange-900/15 dark:border-orange-900/30 field-fade-in">
                            <AlertCircle size={13} className="shrink-0 text-orange-500 mt-0.5" />
                            <p className="text-[11px] text-orange-700 dark:text-orange-300">Puntaje intermedio — envía un recordatorio extra el día anterior.</p>
                          </div>
                        );
                        return null;
                      })()}
                    </div>
'''
    new_content = content[:start_idx] + client_new + content[end_idx:]
    with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Cliente reemplazado con éxito")
else:
    print("No se encontraron los marcadores de cliente")

# Ahora reemplazar servicios
start_marker2 = "                    {/* ── Servicios (Multi-Selección) ──────────────────────── */}"
end_marker2 = "                    {/* ── Origen de Cita ──────────────────────────────────── */}"

start_idx2 = new_content.find(start_marker2) if 'new_content' in locals() else content.find(start_marker2)
end_idx2 = new_content.find(end_marker2) if 'new_content' in locals() else content.find(end_marker2)

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
                      
                      {/* Required validation for services */}
                      <input type="text" required value={selectedServices.length > 0 ? 'valid' : ''} onChange={() => {}} className="sr-only" tabIndex={-1} aria-hidden="true" />
                    </div>
'''
    current_content = new_content if 'new_content' in locals() else content
    final_content = current_content[:start_idx2] + servicios_new + current_content[end_idx2:]
    with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("Servicios reemplazados con éxito")
else:
    print("No se encontraron los marcadores de servicios")
