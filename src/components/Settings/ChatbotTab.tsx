import React from 'react';
import { VincularWhatsApp } from './VincularWhatsApp';
import { Bot, MessageCircle, ToggleLeft, ToggleRight } from 'lucide-react';

export const ChatbotTab: React.FC = () => {
  const businessId = localStorage.getItem('korat_business_id') || '';

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Motor de Nilah IA</h2>
              <p className="text-sm text-gray-500">Configura la personalidad y el estado del asistente virtual.</p>
            </div>
          </div>
        </div>

        {/* We can add more chatbot settings here in the future, like the kill-switch, welcome message etc. */}
        <div className="rounded-lg border border-gray-100 p-4 dark:border-white/5 space-y-2 mb-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <MessageCircle className="text-gray-400" size={18} />
                 <span className="font-medium text-gray-900 dark:text-white">Estado del Chatbot</span>
             </div>
             <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Activo (Glow Pro)</span>
          </div>
          <p className="text-sm text-gray-500">Nilah responderá automáticamente a los mensajes entrantes de tus clientes basándose en tu "Identidad de Marca".</p>
        </div>

      </section>

      {/* WhatsApp Connection Section */}
      <VincularWhatsApp businessId={businessId} />

    </div>
  );
};
