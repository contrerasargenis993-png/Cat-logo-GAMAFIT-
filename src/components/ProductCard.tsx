import React from "react";
import { ShoppingBag, Eye, Check } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  product: Product;
  currency: string;
  onAddToCart: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  isInCart?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onAddToCart,
  onOpenDetail,
  isInCart,
}) => {
  const formattedPrice = `${currency}${product.price.toFixed(2)}`;

  return (
    <div className="group relative bg-slate-900 border border-slate-800/80 hover:border-orange-500/50 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-orange-500/10 flex flex-col h-full">
      
      {/* Image Container */}
      <div
        onClick={() => onOpenDetail(product)}
        className="relative aspect-square w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        <img
          src={product.imageUrl || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800";
          }}
        />

        {/* Gradient Overlay for Text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {product.badge ? (
            <span className="px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider bg-orange-600 text-white rounded-lg shadow-md border border-orange-400/30">
              {product.badge}
            </span>
          ) : (
            <div />
          )}

          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-sm ${
              product.available
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/40"
                : "bg-rose-950/90 text-rose-300 border-rose-500/40"
            }`}
          >
            {product.available ? "Disponible" : "Agotado"}
          </span>
        </div>

        {/* Quick View Hover Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-xl hover:bg-orange-600 hover:border-orange-500 transition-all transform hover:scale-105"
          >
            <Eye className="w-4 h-4 text-orange-400" />
            <span>Ver Detalle</span>
          </button>
        </div>
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-orange-400 bg-orange-950/50 px-2 py-0.5 rounded border border-orange-500/20">
            {product.category}
          </span>

          <h3
            onClick={() => onOpenDetail(product)}
            className="mt-2 text-base font-bold text-white line-clamp-1 hover:text-orange-400 cursor-pointer transition-colors"
          >
            {product.title || product.name}
          </h3>

          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer Price & Add Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Precio</span>
            <span className="text-lg font-black text-white tracking-tight font-mono">
              {formattedPrice}
            </span>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.available}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
              !product.available
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                : isInCart
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20"
            }`}
          >
            {isInCart ? (
              <>
                <Check className="w-4 h-4" />
                <span>En Carrito</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
