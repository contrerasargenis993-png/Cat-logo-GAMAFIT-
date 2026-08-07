import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Product, StoreSettings, CartItem } from "./types";
import { fetchProducts, fetchStoreSettings } from "./services/api";
import { Header } from "./components/Header";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { ShareModal } from "./components/ShareModal";
import { AdminPanel } from "./components/AdminPanel";
import { Toast, ToastMessage } from "./components/Toast";
import {
  RefreshCw,
  AlertCircle,
  Dumbbell,
  PackageX,
  ShoppingBag,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

const CART_STORAGE_KEY = "gamafit_customer_cart";

export default function App() {
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "GamaFit Catalogo",
    whatsappPhone: "5215512345678",
    currency: "$",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",
    publicCatalogUrl: "https://gamafitcatalogo1.netlify.app/",
    updatedAt: new Date().toISOString(),
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "info") => {
    setToast({ id: Date.now().toString(), text, type });
  }, []);

  // Cart LocalStorage Engine (Independent per customer browser)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Error saving cart to local storage:", e);
    }
  }, [cart]);

  // Load Data from Backend Cloud API
  const loadCatalogData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [prodsData, settingsData] = await Promise.all([
        fetchProducts(),
        fetchStoreSettings(),
      ]);

      setProducts(prodsData || []);
      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (err: unknown) {
      console.error("Error loading catalog:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "No pudimos cargar el catálogo. Revisa tu conexión e intenta nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  // Default GamaFit Categories
  const DEFAULT_GAMAFIT_CATEGORIES = [
    "Accesorios Gym",
    "Salud & Bienestar",
    "Termos & Hidratación",
    "Cuidado & Uso Cotidiano",
    "Equipamiento Fitness",
  ];

  // Compute Categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>(DEFAULT_GAMAFIT_CATEGORIES);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["Todos", ...Array.from(set)];
  }, [products]);

  // Compute product counts per category
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: products.length };
    products.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Filter products by Search & Category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === "Todos" || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);

      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, quantity }];
      }
    });
    showToast(`"${product.name}" agregado al carrito`, "success");
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast("Producto eliminado del carrito", "info");
  };

  const handleClearCart = () => {
    setCart([]);
    showToast("Carrito vaciado", "info");
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-600 selection:text-white">
      
      {/* Toast Overlay */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* App Header */}
      <Header
        settings={settings}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Announcement */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950/80 via-slate-900 to-amber-950/80 border border-orange-500/30 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>GamaFit • Artículos Fitness & Uso Cotidiano</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-mono leading-none">
                {settings.storeName || "GamaFit Catalogo"}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Selecciona tus productos favoritos, arma tu carrito y envía tu pedido directo a nuestro WhatsApp. ¡Envíos inmediatos y la mejor calidad garantizada!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsShareOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <span>Compartir Catálogo</span>
              </button>

              <a
                href={`https://wa.me/${(settings.whatsappPhone || "5215512345678").replace(/[^\d+]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all active:scale-95 flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Contacto WhatsApp</span>
              </a>
            </div>
          </div>
        </section>

        {/* Category Filters Bar */}
        {!loading && !error && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            productCounts={productCounts}
          />
        )}

        {/* Catalog Body */}
        {loading ? (
          /* LOADING STATE */
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <Dumbbell className="w-12 h-12 text-orange-500 animate-spin" />
            </div>
            <p className="text-sm font-bold text-slate-300 animate-pulse">
              Cargando catálogo desde la nube...
            </p>
            <p className="text-xs text-slate-500">Sincronizando productos y disponibilidades</p>
          </div>
        ) : error ? (
          /* ERROR STATE */
          <div className="py-16 px-4 max-w-md mx-auto text-center space-y-4 bg-slate-900/80 border border-rose-500/30 rounded-3xl p-8 shadow-2xl">
            <div className="w-14 h-14 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h3 className="text-base font-extrabold text-white">Error de Carga</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{error}</p>

            <button
              onClick={loadCatalogData}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/25 transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reintentar Cargar</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* EMPTY CATALOG STATE */
          <div className="py-16 text-center space-y-3 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <PackageX className="w-16 h-16 text-slate-700 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-300">
              {searchQuery || selectedCategory !== "Todos"
                ? "No hay productos con los filtros seleccionados"
                : "Aún no hay productos disponibles"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery || selectedCategory !== "Todos"
                ? "Prueba cambiando el término de búsqueda o seleccionando otra categoría."
                : "El administrador aún no ha agregado productos al catálogo. Ingresa al panel de administración para empezar."}
            </p>

            {(searchQuery || selectedCategory !== "Todos") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Todos");
                }}
                className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-bold underline"
              >
                Ver todos los productos
              </button>
            )}
          </div>
        ) : (
          /* PRODUCT GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const inCart = cart.some((item) => item.product.id === product.id);

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  currency={settings.currency || "$"}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  onOpenDetail={(p) => setSelectedProductDetail(p)}
                  isInCart={inCart}
                />
              );
            })}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Dumbbell className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-black text-white uppercase font-mono tracking-wider">
              {settings.storeName || "GamaFit Catalogo"}
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Catálogo web interactivo con pedidos directos a WhatsApp y base de datos persistente en la nube.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="hover:text-orange-400 underline transition-colors"
            >
              Panel de Administración
            </button>
            <span>•</span>
            <button
              onClick={() => setIsShareOpen(true)}
              className="hover:text-orange-400 underline transition-colors"
            >
              Compartir Enlace
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Cart Button for Mobile */}
      {totalCartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 sm:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full font-black text-sm shadow-2xl shadow-orange-600/40 border border-orange-400/40 active:scale-95 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Ver Pedido ({totalCartCount})</span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProductDetail}
        currency={settings.currency || "$"}
        whatsappPhone={settings.whatsappPhone}
        onClose={() => setSelectedProductDetail(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        settings={settings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        settings={settings}
        onShowToast={showToast}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        settings={settings}
        onRefreshData={loadCatalogData}
        onShowToast={showToast}
      />

    </div>
  );
}
