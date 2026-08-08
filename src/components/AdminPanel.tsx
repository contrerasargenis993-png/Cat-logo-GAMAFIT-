import React, { useState } from "react";
import {
  X,
  Lock,
  Plus,
  Edit2,
  Trash2,
  Save,
  Check,
  Package,
  Settings,
  Share2,
  Upload,
  Search,
  Eye,
  EyeOff,
  LogOut,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Store,
  RefreshCw,
} from "lucide-react";
import { Product, StoreSettings } from "../types";
import {
  loginAdmin,
  saveProductApi,
  deleteProductApi,
  saveSettingsApi,
  uploadImageApi,
} from "../services/api";

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings;
  onRefreshData: () => Promise<void>;
  onShowToast: (text: string, type: "success" | "error" | "info") => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  onRefreshData,
  onShowToast,
}) => {
  // Auth state
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active tab inside panel
  const [activeTab, setActiveTab] = useState<"products" | "form" | "settings" | "share">("products");

  // Product form state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Accesorios Gym");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formBadge, setFormBadge] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formStock, setFormStock] = useState("50");
  const [imageUploading, setImageUploading] = useState(false);

  // Store Settings form state
  const [settingStoreName, setSettingStoreName] = useState(settings.storeName);
  const [settingPhone, setSettingPhone] = useState(settings.whatsappPhone);
  const [settingCurrency, setSettingCurrency] = useState(settings.currency);
  const [settingLogo, setSettingLogo] = useState(settings.logo);
  const [settingPublicUrl, setSettingPublicUrl] = useState(settings.publicCatalogUrl);
  const [settingNewPin, setSettingNewPin] = useState("");

  // Product search filter in admin
  const [adminSearch, setAdminSearch] = useState("");

  // Delete confirmation modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    try {
      const ok = await loginAdmin(pin.trim());
      if (ok) {
        setIsAuthenticated(true);
        onShowToast("Acceso concedido al Panel de Administración", "success");
        // Sync setting form defaults
        setSettingStoreName(settings.storeName);
        setSettingPhone(settings.whatsappPhone);
        setSettingCurrency(settings.currency);
        setSettingLogo(settings.logo);
        setSettingPublicUrl(settings.publicCatalogUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "PIN incorrecto";
      setLoginError(msg);
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPin("");
    setActiveTab("products");
    onClose();
  };

  // Open form to Create
  const handleOpenCreateForm = () => {
    setEditingProduct(null);
    setFormName("");
    setFormTitle("");
    setFormPrice("");
    setFormCategory("Accesorios Gym");
    setFormCustomCategory("");
    setFormDescription("");
    setFormImageUrl("");
    setFormBadge("");
    setFormAvailable(true);
    setFormStock("50");
    setActiveTab("form");
  };

  // Open form to Edit
  const handleOpenEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormTitle(prod.title || prod.name);
    setFormPrice(prod.price.toString());
    setFormCategory(prod.category);
    setFormCustomCategory("");
    setFormDescription(prod.description);
    setFormImageUrl(prod.imageUrl);
    setFormBadge(prod.badge || "");
    setFormAvailable(prod.available);
    setFormStock((prod.stock || 50).toString());
    setActiveTab("form");
  };

  // Image Upload File Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast("La imagen debe pesar menos de 5MB", "error");
      return;
    }

    setImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result as string;
        if (base64) {
          const uploadedUrl = await uploadImageApi(pin, base64);
          setFormImageUrl(uploadedUrl);
          onShowToast("Imagen subida y procesada correctamente", "success");
        }
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      onShowToast("Error al subir la imagen", "error");
      setImageUploading(false);
    }
  };

  // Save Product Submit Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formPrice) {
      onShowToast("El nombre y el precio son campos obligatorios", "error");
      return;
    }

    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      onShowToast("Introduce un precio válido", "error");
      return;
    }

    const finalCategory =
      formCategory === "Otra..." ? formCustomCategory.trim() || "General" : formCategory;

    setIsSubmitting(true);

    try {
      const productPayload = {
        name: formName.trim(),
        title: formTitle.trim() || formName.trim(),
        price: priceNum,
        category: finalCategory,
        description: formDescription.trim(),
        imageUrl:
          formImageUrl.trim() ||
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800",
        badge: formBadge.trim(),
        available: formAvailable,
        stock: parseInt(formStock) || 50,
      };

      const res = await saveProductApi(
        pin,
        productPayload,
        editingProduct ? editingProduct.id : undefined
      );

      if (res.success) {
        onShowToast(res.message || "Producto guardado correctamente.", "success");
        await onRefreshData();
        setActiveTab("products");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar el producto";
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability Switch 1-click
  const handleToggleAvailable = async (prod: Product) => {
    try {
      const res = await saveProductApi(
        pin,
        { available: !prod.available },
        prod.id
      );
      if (res.success) {
        onShowToast(
          `Producto marcado como ${!prod.available ? "Disponible" : "Agotado"}`,
          "info"
        );
        await onRefreshData();
      }
    } catch {
      onShowToast("No se pudo actualizar la disponibilidad", "error");
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async (id: string) => {
    setIsSubmitting(true);
    try {
      const res = await deleteProductApi(pin, id);
      if (res.success) {
        onShowToast(res.message || "Producto eliminado correctamente.", "success");
        await onRefreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al eliminar el producto";
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
      setDeleteConfirmId(null);
    }
  };

  // Save Store Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await saveSettingsApi(pin, {
        storeName: settingStoreName,
        whatsappPhone: settingPhone,
        currency: settingCurrency,
        logo: settingLogo,
        publicCatalogUrl: settingPublicUrl,
        newAdminPin: settingNewPin.trim() || undefined,
      });

      if (res.success) {
        onShowToast("Configuración de la tienda actualizada en la nube", "success");
        if (settingNewPin.trim()) {
          setPin(settingNewPin.trim());
          setSettingNewPin("");
          onShowToast("PIN de administrador actualizado con éxito", "success");
        }
        await onRefreshData();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al guardar la configuración";
      onShowToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products in admin
  const filteredAdminProducts = products.filter((p) => {
    const q = adminSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.badge && p.badge.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Panel Header */}
        <div className="p-4 sm:px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/20 border border-orange-500/30 rounded-xl text-orange-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Panel de Administración GamaFit
              </h2>
              <p className="text-xs text-slate-400">
                Gestión centralizada en la nube de productos y catálogo público
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-400 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/50 rounded-xl transition-colors"
                title="Cerrar sesión de Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        {!isAuthenticated ? (
          /* LOGIN SCREEN */
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center my-auto max-w-md mx-auto w-full">
            <div className="w-16 h-16 bg-orange-600/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-4 text-orange-500 shadow-xl">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Inicia Sesión como Administrador</h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Ingresa tu PIN de seguridad para gestionar productos y cambiar la configuración.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Introduce el PIN (Ej: 1234)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-2xl text-center text-lg tracking-widest font-mono text-white placeholder-slate-600 focus:outline-none transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-white"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {loginError && (
                <p className="text-xs text-rose-400 font-medium">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !pin}
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-600/25 transition-all active:scale-98"
              >
                {isSubmitting ? "Verificando..." : "Entrar al Panel"}
              </button>
            </form>

            <p className="text-[11px] text-slate-500 mt-6">
              PIN por defecto: <code className="text-orange-400 font-mono font-bold">1234</code> (puedes cambiarlo dentro de la pestaña Configuración).
            </p>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Tab Navigation Header */}
            <div className="px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1 min-w-max py-2">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "products"
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Productos ({products.length})</span>
                </button>

                <button
                  onClick={handleOpenCreateForm}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "form"
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingProduct ? "Editar Producto" : "+ Nuevo Producto"}</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "settings"
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración Tienda</span>
                </button>

                <button
                  onClick={() => setActiveTab("share")}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === "share"
                      ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir Catálogo</span>
                </button>
              </div>

              <button
                onClick={async () => {
                  await onRefreshData();
                  onShowToast("Datos sincronizados desde la nube", "info");
                }}
                className="p-2 text-slate-400 hover:text-orange-400 transition-colors"
                title="Sincronizar datos"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* TAB CONTENT PANES */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              
              {/* TAB 1: PRODUCT LIST */}
              {activeTab === "products" && (
                <div className="space-y-4">
                  
                  {/* Top Bar inside Product List */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Buscar en el inventario..."
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <button
                      onClick={handleOpenCreateForm}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-600/20 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Producto</span>
                    </button>
                  </div>

                  {/* Products Table / Cards */}
                  {filteredAdminProducts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-2xl border border-slate-800">
                      <Package className="w-12 h-12 mx-auto mb-2 text-slate-700" />
                      <p className="text-sm font-bold text-slate-400">No se encontraron productos</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Empieza agregando un producto desde el botón "+ Agregar Producto".
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredAdminProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800/80 rounded-2xl shadow-sm hover:border-slate-700 transition-all"
                        >
                          <img
                            src={
                              prod.imageUrl ||
                              "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=200"
                            }
                            alt={prod.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-800 shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-orange-400 uppercase bg-orange-950/80 px-1.5 py-0.5 rounded">
                                {prod.category}
                              </span>
                              {prod.badge && (
                                <span className="text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded">
                                  {prod.badge}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-white truncate mt-1">
                              {prod.title || prod.name}
                            </h4>

                            <span className="text-xs font-extrabold text-orange-400 font-mono block mt-0.5">
                              {settings.currency || "$"}{prod.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Availability Toggle */}
                            <button
                              onClick={() => handleToggleAvailable(prod)}
                              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                prod.available
                                  ? "text-emerald-400 hover:bg-emerald-950/50"
                                  : "text-rose-400 hover:bg-rose-950/50"
                              }`}
                              title={prod.available ? "Marcar como Agotado" : "Marcar como Disponible"}
                            >
                              {prod.available ? (
                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-slate-500" />
                              )}
                            </button>

                            <button
                              onClick={() => handleOpenEditForm(prod)}
                              className="p-2 text-slate-400 hover:text-orange-400 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
                              title="Editar producto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteConfirmId(prod.id)}
                              className="p-2 text-slate-400 hover:text-rose-400 bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PRODUCT CREATE / EDIT FORM */}
              {activeTab === "form" && (
                <form onSubmit={handleSaveProduct} className="space-y-4 max-w-2xl mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      {editingProduct ? "Editar Producto Existente" : "Crear Nuevo Producto"}
                    </h3>
                    <span className="text-xs text-orange-400 font-mono">
                      {editingProduct ? `ID: ${editingProduct.id}` : "Guardado automático en nube"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Name */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Nombre del Producto <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Ej: Proteína Whey Iso 100 Gold"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Precio ({settings.currency || "$"}) <span className="text-orange-400">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        placeholder="Ej: 35.00"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Categoría
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="Accesorios Gym">Accesorios Gym (Cinturones, Guantes, Rodilleras)</option>
                        <option value="Salud & Bienestar">Salud & Bienestar (Correctores, Electroestimuladores)</option>
                        <option value="Termos & Hidratación">Termos & Hidratación (Termos motivacionales)</option>
                        <option value="Cuidado & Uso Cotidiano">Cuidado & Uso Cotidiano (Cepillos, Zapateras)</option>
                        <option value="Equipamiento Fitness">Equipamiento Fitness</option>
                        <option value="Otra...">Otra...</option>
                      </select>

                      {formCategory === "Otra..." && (
                        <input
                          type="text"
                          value={formCustomCategory}
                          onChange={(e) => setFormCustomCategory(e.target.value)}
                          placeholder="Nombre de la nueva categoría"
                          className="w-full mt-2 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                        />
                      )}
                    </div>

                    {/* Badge */}
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Etiqueta / Badge (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="Ej: Más Vendido, Oferta, Nuevo"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                  </div>

                  {/* Image URL & File Upload */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Imagen del Producto
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="Pega la URL de la imagen (https://...)"
                        className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      />

                      <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5 text-orange-400" />
                        <span>{imageUploading ? "Subiendo..." : "Subir Archivo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="hidden"
                          disabled={imageUploading}
                        />
                      </label>
                    </div>

                    {formImageUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                        <img
                          src={formImageUrl}
                          alt="Previsualización"
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <span className="text-xs text-slate-400 truncate flex-1">
                          Vista previa de imagen vinculada
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Descripción del Producto
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Escribe los beneficios, ingredientes o especificaciones clave del producto..."
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Availability & Stock */}
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormAvailable(!formAvailable)}
                        className={`p-1 rounded-lg text-xs font-bold ${
                          formAvailable ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        {formAvailable ? (
                          <ToggleRight className="w-7 h-7 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-slate-500" />
                        )}
                      </button>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Estado de Disponibilidad
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formAvailable
                            ? "El producto será visible para los clientes en el catálogo."
                            : "El producto se mostrará como 'Agotado'."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Action Footer */}
                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("products")}
                      className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || imageUploading}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/20 active:scale-98 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSubmitting ? "Guardando en nube..." : "Guardar Producto"}</span>
                    </button>
                  </div>

                </form>
              )}

              {/* TAB 3: STORE SETTINGS */}
              {activeTab === "settings" && (
                <form onSubmit={handleSaveSettings} className="space-y-4 max-w-2xl mx-auto">
                  <div className="pb-3 border-b border-slate-800 flex items-center gap-2">
                    <Store className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                      Configuración Global de la Tienda
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Nombre de la Tienda
                      </label>
                      <input
                        type="text"
                        value={settingStoreName}
                        onChange={(e) => setSettingStoreName(e.target.value)}
                        placeholder="Ej: GamaFit Catalogo"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        WhatsApp para Recibir Pedidos
                      </label>
                      <input
                        type="text"
                        value={settingPhone}
                        onChange={(e) => setSettingPhone(e.target.value)}
                        placeholder="Ej: 5215512345678 (con código de país)"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Símbolo de Moneda
                      </label>
                      <input
                        type="text"
                        value={settingCurrency}
                        onChange={(e) => setSettingCurrency(e.target.value)}
                        placeholder="Ej: $, S/, MXN $"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        URL Pública del Catálogo
                      </label>
                      <input
                        type="text"
                        value={settingPublicUrl}
                        onChange={(e) => setSettingPublicUrl(e.target.value)}
                        placeholder="https://gamafitcatalogo1.netlify.app/"
                        className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      URL del Logo
                    </label>
                    <input
                      type="text"
                      value={settingLogo}
                      onChange={(e) => setSettingLogo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {/* Security PIN Change */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-orange-400 uppercase tracking-wider block">
                      Cambiar PIN de Seguridad de Administrador
                    </label>
                    <input
                      type="text"
                      value={settingNewPin}
                      onChange={(e) => setSettingNewPin(e.target.value)}
                      placeholder="Deja vacío si no deseas cambiar el PIN actual"
                      className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/20 active:scale-98 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSubmitting ? "Guardando..." : "Guardar Configuración"}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: SHARE BROADCAST */}
              {activeTab === "share" && (() => {
                const currentAppUrl = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
                const activeShareUrl =
                  settings.publicCatalogUrl && !settings.publicCatalogUrl.includes("gamafitcatalogo1.netlify.app")
                    ? settings.publicCatalogUrl
                    : currentAppUrl || window.location.href;

                return (
                  <div className="space-y-4 max-w-lg mx-auto text-center p-4">
                    <div className="w-12 h-12 bg-orange-600/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto text-orange-400">
                      <Share2 className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-black text-white">Difusión del Catálogo Público</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Comparte este enlace permanente con tus clientes en WhatsApp, Instagram, Facebook o estados. Los productos agregados se cargarán automáticamente desde la nube para todos.
                    </p>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-left">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Enlace público activo
                      </span>
                      <p className="text-xs font-mono text-orange-400 break-all select-all">
                        {activeShareUrl}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeShareUrl);
                          onShowToast("Enlace copiado al portapapeles", "success");
                        }}
                        className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-600/20 transition-all"
                      >
                        Copiar Enlace al Portapapeles
                      </button>

                      <button
                        onClick={() => {
                          const text = encodeURIComponent(
                            `🛍️ Mira nuestro catálogo ${settings.storeName || "GamaFit"} y realiza tu pedido directamente desde aquí:\n\n${activeShareUrl}`
                          );
                          window.open(`https://wa.me/?text=${text}`, "_blank");
                        }}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        Compartir Catálogo por WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        )}

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl text-center space-y-4">
            <h4 className="text-sm font-extrabold text-white">¿Eliminar producto definitivamente?</h4>
            <p className="text-xs text-slate-400">
              Esta acción eliminará el producto de la base de datos de la nube y ya no aparecerá en el catálogo público.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-800 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
