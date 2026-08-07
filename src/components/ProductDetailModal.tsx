import React, { useState } from "react";
import { X, ShoppingBag, Plus, Minus, Check, MessageSquare, ShieldCheck } from "lucide-react";
import { Product } from "../types";

interface ProductDetailModalProps {
  product: Product | null;
  currency: string;
  whatsappPhone: string;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currency,
  whatsappPhone,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleQuickWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hola GamaFit, quisiera consultar más información sobre el producto:\n\n*${product.name}*\nPrecio: ${currency}${product.price.toFixed(2)}\n\n¿Tienen disponible para entrega inmediata?`
    );
    const cleanPhone = whatsappPhone.replace(/[^\d+]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Section */}
        <div className="md:w-1/2 relative bg-slate-950 min-h-[250px] md:min-h-full">
          <img
            src={product.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800"}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.badge && (
            <span className="absolute top-4 left-4 px-3 py-1 text-xs font-black uppercase bg-orange-600 text-white rounded-lg shadow-lg">
              {product.badge}
            </span>
          )}
        </div>

        {/* Product Info Section */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wide bg-orange-950/60 px-2.5 py-1 rounded-md border border-orange-500/20">
                {product.category}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                  product.available ? "text-emerald-400 bg-emerald-950/60" : "text-rose-400 bg-rose-950/60"
                }`}
              >
                {product.available ? "Disponible" : "Agotado"}
              </span>
            </div>

            <h2 className="mt-3 text-xl font-black text-white leading-tight">
              {product.title || product.name}
            </h2>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-500 font-mono">
                {currency}{product.price.toFixed(2)}
              </span>
              {product.stock && product.stock > 0 && (
                <span className="text-xs text-slate-400">
                  ({product.stock} unidades disponibles)
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Descripción
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantía de calidad GamaFit. Envío rápido y asesoría personalizada.</span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Cantidad:</span>
              <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold text-white font-mono">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleAdd}
                disabled={!product.available}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  !product.available
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : added
                    ? "bg-emerald-600 text-white"
                    : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/25 active:scale-98"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>¡Agregado al Carrito!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    <span>Agregar al Carrito ({currency}{(product.price * quantity).toFixed(2)})</span>
                  </>
                )}
              </button>

              <button
                onClick={handleQuickWhatsAppInquiry}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
