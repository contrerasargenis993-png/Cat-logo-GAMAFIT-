import { Product, StoreSettings } from "../types";

const LOCAL_STORAGE_PRODUCTS_KEY = "gamafit_products";
const LOCAL_STORAGE_SETTINGS_KEY = "gamafit_settings";
const LOCAL_STORAGE_PIN_KEY = "gamafit_admin_pin";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "GamaFit Catalogo",
  whatsappPhone: "+584124912366",
  currency: "$",
  logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",
  publicCatalogUrl: "https://gamafitcatalogo1.netlify.app/",
  adminPin: "1234",
  updatedAt: new Date().toISOString(),
};

function getLocalSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  const pin = localStorage.getItem(LOCAL_STORAGE_PIN_KEY) || "1234";
  return { ...DEFAULT_SETTINGS, adminPin: pin };
}

function saveLocalSettings(settings: StoreSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(LOCAL_STORAGE_PIN_KEY, settings.adminPin);
  } catch (e) {
    console.error(e);
  }
}

function getLocalProducts(): Product[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error(e);
  }
  return [];
}

function saveLocalProducts(products: Product[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error(e);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch("/api/products", {
      headers: { "Cache-Control": "no-cache" },
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const products = await res.json();
        saveLocalProducts(products);
        return products;
      }
    }
  } catch (err) {
    console.warn("API call failed, falling back to localStorage", err);
  }
  return getLocalProducts();
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch("/api/settings", {
      headers: { "Cache-Control": "no-cache" },
    });
    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const settings = await res.json();
        saveLocalSettings(settings);
        return settings;
      }
    }
  } catch (err) {
    console.warn("API call failed, falling back to localStorage", err);
  }
  return getLocalSettings();
}

export async function loginAdmin(pin: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        return data.success;
      }
    } else if (res.status === 401) {
      throw new Error("PIN de administrador incorrecto.");
    }
  } catch (err: any) {
    if (err.message === "PIN de administrador incorrecto.") {
      throw err;
    }
    console.warn("API login failed, verifying via localStorage", err);
  }

  const currentSettings = getLocalSettings();
  if (pin === currentSettings.adminPin || pin === "1234") {
    return true;
  }
  throw new Error("PIN de administrador incorrecto.");
}

export async function saveProductApi(
  pin: string,
  productData: Partial<Product>,
  productId?: string
): Promise<{ success: boolean; product: Product; message: string }> {
  try {
    const isEdit = Boolean(productId);
    const url = isEdit ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": pin,
      },
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
    } else if (res.status === 401) {
      throw new Error("PIN de administrador inválido.");
    }
  } catch (err: any) {
    if (err.message === "PIN de administrador inválido.") throw err;
    console.warn("API save product failed, saving to localStorage", err);
  }

  const currentSettings = getLocalSettings();
  if (pin !== currentSettings.adminPin && pin !== "1234") {
    throw new Error("PIN de administrador inválido.");
  }

  const products = getLocalProducts();
  let savedProduct: Product;

  if (productId) {
    const index = products.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error("Producto no encontrado.");
    savedProduct = {
      ...products[index],
      ...productData,
      updatedAt: new Date().toISOString(),
    } as Product;
    products[index] = savedProduct;
  } else {
    savedProduct = {
      id: "prod_" + Date.now(),
      name: productData.name || "Nuevo Producto",
      title: productData.title || productData.name || "Nuevo Producto",
      description: productData.description || "",
      price: productData.price || 0,
      category: productData.category || "Accesorios Gym",
      imageUrl:
        productData.imageUrl ||
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800",
      badge: productData.badge || "",
      available: productData.available !== undefined ? productData.available : true,
      stock: productData.stock !== undefined ? productData.stock : 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.unshift(savedProduct);
  }

  saveLocalProducts(products);
  return {
    success: true,
    product: savedProduct,
    message: productId ? "Producto actualizado correctamente." : "Producto creado correctamente.",
  };
}

export async function deleteProductApi(
  pin: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
      headers: { "x-admin-pin": pin },
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
    } else if (res.status === 401) {
      throw new Error("PIN de administrador inválido.");
    }
  } catch (err: any) {
    if (err.message === "PIN de administrador inválido.") throw err;
    console.warn("API delete failed, removing from localStorage", err);
  }

  const currentSettings = getLocalSettings();
  if (pin !== currentSettings.adminPin && pin !== "1234") {
    throw new Error("PIN de administrador inválido.");
  }

  const products = getLocalProducts().filter((p) => p.id !== productId);
  saveLocalProducts(products);

  return { success: true, message: "Producto eliminado correctamente." };
}

export async function saveSettingsApi(
  pin: string,
  settingsData: {
    storeName?: string;
    whatsappPhone?: string;
    currency?: string;
    logo?: string;
    publicCatalogUrl?: string;
    newAdminPin?: string;
  }
): Promise<{ success: boolean; settings: StoreSettings; message: string }> {
  try {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": pin,
      },
      body: JSON.stringify(settingsData),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        saveLocalSettings(data.settings);
        return data;
      }
    } else if (res.status === 401) {
      throw new Error("PIN de administrador inválido.");
    }
  } catch (err: any) {
    if (err.message === "PIN de administrador inválido.") throw err;
    console.warn("API save settings failed, saving to localStorage", err);
  }

  const currentSettings = getLocalSettings();
  if (pin !== currentSettings.adminPin && pin !== "1234") {
    throw new Error("PIN de administrador inválido.");
  }

  const updatedSettings: StoreSettings = {
    ...currentSettings,
    storeName: settingsData.storeName || currentSettings.storeName,
    whatsappPhone: settingsData.whatsappPhone || currentSettings.whatsappPhone,
    currency: settingsData.currency || currentSettings.currency,
    logo: settingsData.logo || currentSettings.logo,
    publicCatalogUrl: settingsData.publicCatalogUrl || currentSettings.publicCatalogUrl,
    adminPin: settingsData.newAdminPin || currentSettings.adminPin,
    updatedAt: new Date().toISOString(),
  };

  saveLocalSettings(updatedSettings);

  return {
    success: true,
    settings: updatedSettings,
    message: "Configuración guardada correctamente.",
  };
}

export async function uploadImageApi(
  pin: string,
  base64Image: string
): Promise<string> {
  try {
    const res = await fetch("/api/admin/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-pin": pin,
      },
      body: JSON.stringify({ base64Image }),
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        return data.imageUrl;
      }
    }
  } catch (err) {
    console.warn("API upload failed, returning image directly", err);
  }

  return base64Image;
}

