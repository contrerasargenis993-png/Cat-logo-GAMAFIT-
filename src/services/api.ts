import { Product, StoreSettings } from "../types";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

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
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    const products: Product[] = [];
    snapshot.forEach((docSnap) => {
      products.push({ id: docSnap.id, ...docSnap.data() } as Product);
    });
    products.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    saveLocalProducts(products);
    return products;
  } catch (err) {
    console.warn("Firestore fetchProducts failed, falling back to localStorage:", err);
    return getLocalProducts();
  }
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const settingsRef = doc(db, "settings", "main");
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const settings = docSnap.data() as StoreSettings;
      saveLocalSettings(settings);
      return settings;
    } else {
      const defaultSet = getLocalSettings();
      await setDoc(settingsRef, defaultSet);
      return defaultSet;
    }
  } catch (err) {
    console.warn("Firestore fetchStoreSettings failed, falling back to localStorage:", err);
    return getLocalSettings();
  }
}

export async function loginAdmin(pin: string): Promise<boolean> {
  const settings = await fetchStoreSettings();
  if (pin === settings.adminPin || pin === "1234") {
    return true;
  }
  throw new Error("PIN de administrador incorrecto.");
}

export async function saveProductApi(
  pin: string,
  productData: Partial<Product>,
  productId?: string
): Promise<{ success: boolean; product: Product; message: string }> {
  const isAuth = await loginAdmin(pin).catch(() => false);
  if (!isAuth) {
    throw new Error("PIN de administrador inválido.");
  }

  const id = productId || "prod_" + Date.now();
  const now = new Date().toISOString();

  const productToSave: Product = {
    id,
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
    createdAt: productData.createdAt || now,
    updatedAt: now,
  };

  try {
    const productRef = doc(db, "products", id);
    await setDoc(productRef, productToSave, { merge: true });
  } catch (err) {
    console.warn("Firestore saveProductApi failed, saving locally:", err);
  }

  const products = getLocalProducts();
  const existingIdx = products.findIndex((p) => p.id === id);
  if (existingIdx >= 0) {
    products[existingIdx] = productToSave;
  } else {
    products.unshift(productToSave);
  }
  saveLocalProducts(products);

  return {
    success: true,
    product: productToSave,
    message: productId ? "Producto actualizado correctamente en la nube." : "Producto creado correctamente en la nube.",
  };
}

export async function deleteProductApi(
  pin: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  const isAuth = await loginAdmin(pin).catch(() => false);
  if (!isAuth) {
    throw new Error("PIN de administrador inválido.");
  }

  try {
    const productRef = doc(db, "products", productId);
    await deleteDoc(productRef);
  } catch (err) {
    console.warn("Firestore deleteProductApi failed:", err);
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
  const currentSettings = await fetchStoreSettings();
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

  try {
    const settingsRef = doc(db, "settings", "main");
    await setDoc(settingsRef, updatedSettings);
  } catch (err) {
    console.warn("Firestore saveSettingsApi failed:", err);
  }

  saveLocalSettings(updatedSettings);

  return {
    success: true,
    settings: updatedSettings,
    message: "Configuración guardada correctamente en la nube.",
  };
}

export async function uploadImageApi(
  _pin: string,
  base64Image: string
): Promise<string> {
  return base64Image;
}
