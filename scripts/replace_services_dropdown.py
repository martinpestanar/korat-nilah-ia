import re

with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = "{filteredServices.length === 0 ? ("
end_marker = "{/* ── Panel precio variable ─────────────────────────── */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_services_ui = """{filteredServices.length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-border p-5 text-center text-xs text-gray-400">
                          Selecciona una categoría primero o no hay servicios disponibles
                        </p>
                      ) : (
                        <div className="relative" ref={serviceDropdownRef}>
                          <div
                            className={`flex items-center gap-2.5 w-full rounded-2xl border-2 px-3.5 py-3 cursor-text transition-all ${
                              isServiceDropdownOpen
                                ? 'border-primary bg-white dark:bg-dark-card ring-4 ring-primary/10'
                                : 'border-gray-200 bg-gray-50 dark:border-dark-border dark:bg-dark-bg hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            onClick={() => { if (!isSubmitting) setIsServiceDropdownOpen(true); }}
                          >
                            <Search size={15} className="flex-shrink-0 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Buscar y seleccionar servicio..."
                              autoComplete="off"
                              disabled={isSubmitting}
                              value={serviceSearch}
                              onChange={(e) => { setServiceSearch(e.target.value); setIsServiceDropdownOpen(true); }}
                              onFocus={() => setIsServiceDropdownOpen(true)}
                              className="flex-1 bg-transparent text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none min-w-0"
                            />
                            {serviceSearch && (
                              <button type="button" aria-label="Limpiar búsqueda"
                                onClick={(e) => { e.stopPropagation(); setServiceSearch(''); }}
                                className="flex-shrink-0 rounded-xl p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          {/* Dropdown list for services */}
                          {isServiceDropdownOpen && (
                            <div className="client-dropdown absolute z-50 mt-2 w-full rounded-2xl border-2 border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl overflow-hidden">
                              <div className="max-h-56 overflow-y-auto overscroll-contain divide-y divide-gray-100 dark:divide-dark-border/50">
                                {(() => {
                                  const q = serviceSearch.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
                                  const filtered = filteredServices.filter(s =>
                                    !q || s.name.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q)
                                  );
                                  
                                  if (filtered.length === 0) return (
                                    <div className="px-4 py-6 text-center">
                                      <p className="text-sm font-medium text-gray-400">Sin resultados</p>
                                    </div>
                                  );

                                  return filtered.map((s, i) => {
                                    const isSelected = selectedServices.some(ss => ss.servicio === s.name);
                                    return (
                                      <button key={s.id} type="button"
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedServices(prev => prev.filter(ss => ss.servicio !== s.name));
                                          } else {
                                            if ((s as any).es_variable) {
                                              setVariablePriceInput(String((s as any).price || ''));
                                              setVariablePricePendingSvc(s);
                                              setFormError(null);
                                              setIsServiceDropdownOpen(false);
                                              setServiceSearch('');
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
                                          setServiceSearch('');
                                          setIsServiceDropdownOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors group ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-dark-border/50'}`}
                                      >
                                        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                                          isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 dark:bg-dark-card group-hover:bg-gray-200 dark:group-hover:bg-dark-bg'
                                        }`}>
                                          {isSelected ? <CheckCircle size={12} strokeWidth={3} /> : <Plus size={12} strokeWidth={3} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary dark:text-primary' : 'text-gray-800 dark:text-white'}`}>
                                            {s.name}
                                          </p>
                                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                                            {(s as any).es_variable ? 'Precio variable' : `S/ ${typeof s.price === 'number' ? s.price.toFixed(2) : s.price}`} · {s.durationMin || 60}m
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      """
    
    new_content = content[:start_idx] + new_services_ui + content[end_idx:]
    with open(r'c:\Users\Martin\Documents\Korat-Flow-Agencia\Korat_MVP\pages\Calendar.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Services dropdown injected!")
else:
    print("Markers not found")
