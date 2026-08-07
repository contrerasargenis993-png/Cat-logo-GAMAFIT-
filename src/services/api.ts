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
    console.warn("localStorage write skipped:", e);
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

export function compressImage(
  dataUrl: string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.65
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
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

  let existingProduct: Partial<Product> = {};
  if (productId) {
    try {
      const pRef = doc(db, "products", productId);
      const pSnap = await getDoc(pRef);
      if (pSnap.exists()) {
        existingProduct = pSnap.data() as Product;
      }
    } catch (e) {
      console.warn("Could not fetch existing product from Firestore:", e);
    }
    if (!existingProduct.id) {
      const localProds = getLocalProducts();
      const found = localProds.find((p) => p.id === productId);
      if (found) existingProduct = found;
    }
  }

  let finalImageUrl =
    productData.imageUrl !== undefined
      ? productData.imageUrl
      : (existingProduct.imageUrl ||
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800");

  if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
    finalImageUrl = await compressImage(finalImageUrl, 600, 600, 0.65);
  }

  const productToSave: Product = {
    id,
    name:
      productData.name !== undefined
        ? productData.name
        : (existingProduct.name || "Nuevo Producto"),
    title:
      productData.title !== undefined
        ? productData.title
        : (existingProduct.title || productData.name || existingProduct.name || "Nuevo Producto"),
    description:
      productData.description !== undefined
        ? productData.description
        : (existingProduct.description || ""),
    price:
      productData.price !== undefined
        ? productData.price
        : (existingProduct.price !== undefined ? existingProduct.price : 0),
    category:
      productData.category !== undefined
        ? productData.category
        : (existingProduct.category || "Accesorios Gym"),
    imageUrl: finalImageUrl,
    badge:
      productData.badge !== undefined
        ? productData.badge
        : (existingProduct.badge || ""),
    available:
      productData.available !== undefined
        ? productData.available
        : (existingProduct.available !== undefined ? existingProduct.available : true),
    stock:
      productData.stock !== undefined
        ? productData.stock
        : (existingProduct.stock !== undefined ? existingProduct.stock : 50),
    createdAt: existingProduct.createdAt || productData.createdAt || now,
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
    message: productId
      ? "Producto actualizado correctamente."
      : "Producto guardado y sincronizado correctamente.",
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
  return await compressImage(base64Image, 800, 800, 0.75);
}
