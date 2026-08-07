import React from "react";
import { ShoppingBag, Lock, Share2, Search, Dumbbell } from "lucide-react";
import { StoreSettings } from "../types";

interface HeaderProps {
  settings: StoreSettings;
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  cartCount,
  searchQuery,
  setSearchQuery,
  onOpenCart,
  onOpenAdmin,
  onOpenShare,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Brand & Logo */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-3">
              {settings.logo ? (
                <img
                  src={settings.logo}
                  alt={settings.storeName}
                  className="w-10 h-10 rounded-xl object-cover border border-orange-500/30 shadow-md shadow-orange-500/10"
                  onError={(e) => {
                    // Fallback to default icon if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-orange-500 animate-pulse" />
                  <h1 className="text-xl font-extrabold tracking-tight text-white uppercase font-mono">
                    {settings.storeName || "GamaFit Catalogo"}
                  </h1>
                </div>
                <p className="text-xs text-slate-400">Artículos Fitness & Uso Cotidiano</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={onOpenShare}
                className="p-2 text-slate-300 hover:text-orange-400 bg-slate-900 border border-slate-800 rounded-xl active:scale-95 transition-all"
                title="Compartir Catálogo"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={onOpenCart}
                className="relative p-2 text-white bg-orange-600 hover:bg-orange-500 rounded-xl active:scale-95 transition-all shadow-lg shadow-orange-600/20"
                title="Ver Carrito"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-white text-orange-600 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cinturones, termos, rodilleras, electroestimuladores..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onOpenShare}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 text-orange-400" />
              <span>Compartir</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-xl active:scale-95 transition-all shadow-lg shadow-orange-600/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Carrito</span>
              {cartCount > 0 && (
                <span className="ml-1 bg-white text-orange-600 font-extrabold text-xs px-2 py-0.5 rounded-full shadow">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-xl active:scale-95 transition-all"
              title="Panel de Administración"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
