import React, { useState } from "react";
import { X, Trash2, Plus, Minus, Send, ShoppingBag, User, FileText } from "lucide-react";
import { CartItem, StoreSettings } from "../types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSendWhatsAppOrder = () => {
    if (items.length === 0) return;

    const currency = settings.currency || "$";

    // Format order text matching exact requested structure
    let message = `🛍️ *NUEVO PEDIDO ${settings.storeName.toUpperCase()}*\n\n`;
    message += `Hola, quiero realizar el siguiente pedido:\n\n`;

    items.forEach((item, index) => {
      const subtotal = item.product.price * item.quantity;
      message += `${index + 1}. *${item.product.title || item.product.name}*\n`;
      message += `   Cantidad: ${item.quantity}\n`;
      message += `   Precio: ${currency}${item.product.price.toFixed(2)}\n`;
      message += `   Subtotal: ${currency}${subtotal.toFixed(2)}\n\n`;
    });

    message += `━━━━━━━━━━━━━\n`;
    message += `💰 *TOTAL: ${currency}${totalAmount.toFixed(2)}*\n`;

    if (customerName.trim()) {
      message += `\n👤 *Cliente:* ${customerName.trim()}`;
    }
    if (customerNotes.trim()) {
      message += `\n📝 *Notas:* ${customerNotes.trim()}`;
    }

    message += `\n\nPor favor, confírmame disponibilidad y método de pago.`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = (settings.whatsappPhone || "5215512345678").replace(/[^\d+]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(waUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Cart Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                Mi Carrito ({items.reduce((acc, item) => acc + item.quantity, 0)})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-950/40 rounded border border-rose-800/40 transition-colors"
                >
                  Vaciar
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-16 h-16 text-slate-700 mb-3" />
                <p className="text-base font-bold text-slate-300">Tu carrito está vacío</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Agrega suplementos o accesorios del catálogo para armar tu pedido.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-sm"
                >
                  <img
                    src={item.product.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200"}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-800"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.product.title || item.product.name}
                    </h4>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {settings.currency || "$"}{item.product.price.toFixed(2)} c/u
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-white font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-xs font-extrabold text-orange-400 font-mono">
                        = {settings.currency || "$"}{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                    title="Eliminar del carrito"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Customer Info & Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              
              {/* Optional Fields */}
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tu Nombre (opcional)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Dirección / Horario de entrega (opcional)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Total Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Total del Pedido
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {settings.currency || "$"}{totalAmount.toFixed(2)}
                </span>
              </div>

              {/* WhatsApp Checkout Button */}
              <button
                onClick={handleSendWhatsAppOrder}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Enviar Pedido a WhatsApp</span>
              </button>

              <p className="text-[10px] text-center text-slate-500">
                Al presionar, se abrirá WhatsApp con el resumen listo para enviar a la tienda.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
