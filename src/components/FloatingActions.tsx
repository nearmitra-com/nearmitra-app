import { useState, useEffect } from 'react';
import { MessageCircle, Phone, X, AlertCircle } from 'lucide-react';

const PHONE_NUMBER = '+919152106425';
const WHATSAPP_NUMBER = '919152106425';

export const FloatingActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Stop pulse after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 flex flex-col items-end gap-2">
      {/* Expanded menu */}
      {isOpen && (
        <div className="flex flex-col gap-2 mb-2 animate-fade-in-up">
          {/* Emergency */}
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white pl-4 pr-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 group"
          >
            <AlertCircle className="w-5 h-5" />
            <div className="text-left">
              <div className="text-xs font-bold">Emergency</div>
              <div className="text-[10px] opacity-80">Immediate dispatch</div>
            </div>
          </a>

          {/* Call */}
          <a
            href={`tel:${PHONE_NUMBER}`}
            className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white pl-4 pr-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <Phone className="w-5 h-5" />
            <div className="text-left">
              <div className="text-xs font-bold">Call Helpline</div>
              <div className="text-[10px] opacity-80">+91 91521 06425</div>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello NearMitra, I need home service assistance.')}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white pl-4 pr-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
          >
            <MessageCircle className="w-5 h-5" />
            <div className="text-left">
              <div className="text-xs font-bold">WhatsApp</div>
              <div className="text-[10px] opacity-80">Chat with us</div>
            </div>
          </a>
        </div>
      )}

      {/* FAB trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
          isOpen
            ? 'bg-foreground text-white rotate-0'
            : 'bg-[#25D366] text-white hover:bg-[#20bd5a]'
        }`}
      >
        {/* Pulse ring */}
        {pulse && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        )}

        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <MessageCircle className="w-6 h-6 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
};
