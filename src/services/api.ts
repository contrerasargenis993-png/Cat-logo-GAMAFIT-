import { Product, StoreSettings } from "../types";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products", {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!res.ok) {
    throw new Error("No pudimos cargar los productos de la base de datos.");
  }
  return res.json();
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const res = await fetch("/api/settings", {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
  if (!res.ok) {
    throw new Error("No pudimos cargar la configuración de la tienda.");
  }
  return res.json();
}

export async function loginAdmin(pin: string): Promise<boolean> {
  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "PIN de administrador incorrecto.");
  }

  const data = await res.json();
  return data.success;
}

export async function saveProductApi(
  pin: string,
  productData: Partial<Product>,
  productId?: string
): Promise<{ success: boolean; product: Product; message: string }> {
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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "No se pudo guardar el producto. Intenta nuevamente.");
  }

  return res.json();
}

export async function deleteProductApi(
  pin: string,
  productId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/products/${productId}`, {
    method: "DELETE",
    headers: {
      "x-admin-pin": pin,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "No se pudo eliminar el producto.");
  }

  return res.json();
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
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": pin,
    },
    body: JSON.stringify(settingsData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "No se pudo guardar la configuración.");
  }

  return res.json();
}

export async function uploadImageApi(
  pin: string,
  base64Image: string
): Promise<string> {
  const res = await fetch("/api/admin/upload-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": pin,
    },
    body: JSON.stringify({ base64Image }),
  });

  if (!res.ok) {
    throw new Error("Error al subir la imagen al servidor.");
  }

  const data = await res.json();
  return data.imageUrl;
}
