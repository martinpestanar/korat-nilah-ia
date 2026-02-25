import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, X, Mail, User as UserIcon, Lock, Check } from 'lucide-react';

interface StaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    onSave: (staffData: any) => Promise<void>;
    userToEdit?: any; // Añadido para edición
}

const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, businessId, onSave, userToEdit }) => {
    const [role, setRole] = useState<'Admin' | 'Staff'>('Staff');
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setRole(userToEdit.role === 'Admin' || userToEdit.role === 'Dueño' ? 'Admin' : 'Staff');
            setNombre(userToEdit.nombre_persona || '');
            setEmail(userToEdit.email || '');
            setPassword(''); // No mostramos la contraseña al editar

            if (userToEdit.features) {
                setPermissions(prev => ({
                    ...prev,
                    ...userToEdit.features
                }));
            }
        } else {
            // Reset for new creation
            setRole('Staff');
            setNombre('');
            setEmail('');
            setPassword('');
            setPermissions({
                perm_view_all_appointments: false,
                perm_view_client_notes: true,
                perm_edit_services: false,
                perm_view_financials: false,
                perm_manage_staff: false
            });
        }
    }, [userToEdit, isOpen]);

    // Detailed permissions for Staff role
    const [permissions, setPermissions] = useState({
        perm_view_all_appointments: false,
        perm_view_client_notes: true,
        perm_edit_services: false,
        perm_view_financials: false,
        perm_manage_staff: false
    });

    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                id: userToEdit?.id || userToEdit?.user_id, // Pasar ID si estamos editando
                business_id: businessId,
                nombre,
                email,
                password, // Puede estar vacío en edición
                role,
                permissions: role === 'Staff' ? permissions : undefined // Admins get full access
            });
            onClose();
        } catch (error) {
            console.error("Error saving staff:", error);
            // In a real app, show error toast here
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950/50 shrink-0">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-violet-400" />
                        {userToEdit ? 'Editar Usuario' : 'Agregar Usuario'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto">
                    <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">

                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <button
                                type="button"
                                onClick={() => setRole('Admin')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors ${role === 'Admin'
                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                                    : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                <span className="text-sm font-medium">Administrador</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('Staff')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors ${role === 'Staff'
                                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                                    : 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                                    }`}
                            >
                                <UserIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Staff</span>
                            </button>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-4 w-4 text-zinc-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nombre completo"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-zinc-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="Correo electrónico"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                />
                            </div>

                            {!userToEdit && (
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <input
                                        type="password"
                                        required={!userToEdit}
                                        placeholder="Contraseña temporal"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Staff Permissions (Only visible if role is Staff) */}
                        {role === 'Staff' && (
                            <div className="mt-6 pt-6 border-t border-white/5 animate-fade-in">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Permisos Específicos</h4>
                                <div className="space-y-2">
                                    <PermissionToggle
                                        label="Ver todas las citas"
                                        desc="Permitir ver agenda completa del salón"
                                        checked={permissions.perm_view_all_appointments}
                                        onChange={() => togglePermission('perm_view_all_appointments')}
                                    />
                                    <PermissionToggle
                                        label="Ver notas de clientes"
                                        desc="Historial, alertas y preferencias CRM"
                                        checked={permissions.perm_view_client_notes}
                                        onChange={() => togglePermission('perm_view_client_notes')}
                                    />
                                    <PermissionToggle
                                        label="Editar servicios"
                                        desc="Modificar catálogo y precios"
                                        checked={permissions.perm_edit_services}
                                        onChange={() => togglePermission('perm_edit_services')}
                                    />
                                    <PermissionToggle
                                        label="Ver finanzas"
                                        desc="Acceso a ingresos y reportes"
                                        checked={permissions.perm_view_financials}
                                        onChange={() => togglePermission('perm_view_financials')}
                                    />
                                    <PermissionToggle
                                        label="Gestionar staff"
                                        desc="Agregar o eliminar empleados"
                                        checked={permissions.perm_manage_staff}
                                        onChange={() => togglePermission('perm_manage_staff')}
                                    />
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="p-4 border-t border-white/5 bg-zinc-950/50 shrink-0">
                    <button
                        type="submit"
                        form="staff-form"
                        disabled={isSaving || !nombre || !email || (!userToEdit && !password)}
                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isSaving ? (userToEdit ? 'Guardando...' : 'Creando Usuario...') : (userToEdit ? 'Modificar Usuario' : 'Crear Usuario')}
                    </button>
                    <p className="text-[11px] text-zinc-500 text-center mt-3">
                        Se enviará un correo de invitación a esta dirección.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Helper component for permission toggles
const PermissionToggle = ({ label, desc, checked, onChange }: { label: string, desc: string, checked: boolean, onChange: () => void }) => (
    <div
        onClick={onChange}
        className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-white/5 cursor-pointer hover:bg-zinc-800/50 transition-colors"
    >
        <div className="pr-4">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{desc}</p>
        </div>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${checked
            ? 'bg-violet-500 border-violet-500 text-white'
            : 'border-zinc-600 bg-zinc-900 text-transparent'
            }`}>
            <Check className="w-3 h-3" />
        </div>
    </div>
);

export default StaffModal;
