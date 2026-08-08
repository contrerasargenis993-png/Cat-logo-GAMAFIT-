import React, { useState } from "react";
import { X, Copy, Check, Share2, Send, Globe, ExternalLink } from "lucide-react";
import { StoreSettings } from "../types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  settings,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const catalogUrl =
    settings.publicCatalogUrl && !settings.publicCatalogUrl.includes("gamafitcatalogo1.netlify.app")
      ? settings.publicCatalogUrl
      : currentAppUrl || window.location.href;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      setCopied(true);
      onShowToast("¡Enlace copiado al portapapeles!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast("No se pudo copiar automáticamente. Por favor copia la URL manualmente.", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛍️ Mira nuestro catálogo ${settings.storeName || "GamaFit"} y realiza tu pedido directamente desde aquí:\n\n${catalogUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-black text-white">Compartir Catálogo</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Box */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Enlace Público del Catálogo
          </label>
          <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-2xl">
            <Globe className="w-4 h-4 text-orange-400 ml-2 shrink-0" />
            <input
              type="text"
              readOnly
              value={catalogUrl}
              className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-orange-600 hover:bg-orange-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Este enlace es permanente y funciona para cualquier cliente en Android, iPhone, PC o WhatsApp.
          </p>
        </div>

        {/* Direct Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Compartir por WhatsApp</span>
          </button>

          <a
            href={catalogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Abrir en nueva pestaña</span>
          </a>
        </div>

      </div>
    </div>
  );
};
