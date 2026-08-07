import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface Product {
  id: string;
  name: string;
  title?: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  badge?: string;
  available: boolean;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

interface StoreSettings {
  storeName: string;
  whatsappPhone: string;
  currency: string;
  logo: string;
  publicCatalogUrl: string;
  adminPin: string;
  updatedAt: string;
}

interface DatabaseSchema {
  products: Product[];
  settings: StoreSettings;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store_db.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure data and uploads directory exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial Seed Data
const initialSeedData: DatabaseSchema = {
  settings: {
    storeName: "GamaFit Catalogo",
    whatsappPhone: "5215512345678",
    currency: "$",
    logo: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",
    publicCatalogUrl: "https://gamafitcatalogo1.netlify.app/",
    adminPin: "1234",
    updatedAt: new Date().toISOString(),
  },
  products: [],
};

// Database helper functions
function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content) as DatabaseSchema;
      if (!parsed.products) parsed.products = [];
      if (!parsed.settings) parsed.settings = initialSeedData.settings;
      return parsed;
    }
  } catch (err) {
    console.error("Error reading database file, writing default seed:", err);
  }
  // Initialize file if not found or corrupted
  fs.writeFileSync(DB_FILE, JSON.stringify(initialSeedData, null, 2), "utf-8");
  return initialSeedData;
}

function writeDb(data: DatabaseSchema): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing database file:", err);
    return false;
  }
}

// Middleware to check Admin PIN
function checkAdminPin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const pinHeader = req.headers["x-admin-pin"] || req.headers["authorization"]?.replace("Bearer ", "");
  const db = readDb();
  if (!pinHeader || pinHeader !== db.settings.adminPin) {
    return res.status(401).json({ error: "PIN de administrador incorrecto o no proporcionado" });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Serve static uploaded files if any
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- PUBLIC API ROUTES ---

  // GET /api/products - Get all products (accessible globally)
  app.get("/api/products", (req, res) => {
    try {
      const db = readDb();
      res.json(db.products);
    } catch (err) {
      console.error("Error in GET /api/products:", err);
      res.status(500).json({ error: "Error al recuperar los productos de la base de datos" });
    }
  });

  // GET /api/settings - Get public store settings (omits adminPin)
  app.get("/api/settings", (req, res) => {
    try {
      const db = readDb();
      const { adminPin, ...publicSettings } = db.settings;
      res.json(publicSettings);
    } catch (err) {
      console.error("Error in GET /api/settings:", err);
      res.status(500).json({ error: "Error al recuperar la configuración de la tienda" });
    }
  });

  // --- PROTECTED ADMIN API ROUTES ---

  // POST /api/admin/login - Verify admin PIN
  app.post("/api/admin/login", (req, res) => {
    const { pin } = req.body;
    const db = readDb();
    if (pin && pin === db.settings.adminPin) {
      return res.json({ success: true, message: "Autenticación correcta" });
    } else {
      return res.status(401).json({ error: "PIN de administrador incorrecto" });
    }
  });

  // POST /api/admin/products - Create a new product
  app.post("/api/admin/products", checkAdminPin, (req, res) => {
    try {
      const { name, title, description, price, category, imageUrl, badge, available, stock } = req.body;
      if (!name || price === undefined || !category) {
        return res.status(400).json({ error: "El nombre, precio y categoría son obligatorios." });
      }

      const db = readDb();
      const now = new Date().toISOString();
      const newProduct: Product = {
        id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: String(name).trim(),
        title: title ? String(title).trim() : String(name).trim(),
        description: description ? String(description).trim() : "",
        price: Number(price) || 0,
        category: String(category).trim(),
        imageUrl: imageUrl ? String(imageUrl).trim() : "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800",
        badge: badge ? String(badge).trim() : "",
        available: available !== undefined ? Boolean(available) : true,
        stock: stock !== undefined ? Number(stock) : 99,
        createdAt: now,
        updatedAt: now,
      };

      db.products.unshift(newProduct);
      writeDb(db);

      return res.status(201).json({ success: true, product: newProduct, message: "Producto guardado correctamente." });
    } catch (err) {
      console.error("Error in POST /api/admin/products:", err);
      return res.status(500).json({ error: "No se pudo guardar el producto en la nube." });
    }
  });

  // PUT /api/admin/products/:id - Update an existing product
  app.put("/api/admin/products/:id", checkAdminPin, (req, res) => {
    try {
      const { id } = req.params;
      const { name, title, description, price, category, imageUrl, badge, available, stock } = req.body;

      const db = readDb();
      const productIndex = db.products.findIndex((p) => p.id === id);

      if (productIndex === -1) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }

      const now = new Date().toISOString();
      const existing = db.products[productIndex];

      const updatedProduct: Product = {
        ...existing,
        name: name !== undefined ? String(name).trim() : existing.name,
        title: title !== undefined ? String(title).trim() : existing.title,
        description: description !== undefined ? String(description).trim() : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        category: category !== undefined ? String(category).trim() : existing.category,
        imageUrl: imageUrl !== undefined ? String(imageUrl).trim() : existing.imageUrl,
        badge: badge !== undefined ? String(badge).trim() : existing.badge,
        available: available !== undefined ? Boolean(available) : existing.available,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        updatedAt: now,
      };

      db.products[productIndex] = updatedProduct;
      writeDb(db);

      return res.json({ success: true, product: updatedProduct, message: "Producto actualizado correctamente." });
    } catch (err) {
      console.error("Error in PUT /api/admin/products/:id:", err);
      return res.status(500).json({ error: "Error al actualizar el producto." });
    }
  });

  // DELETE /api/admin/products/:id - Delete a product
  app.delete("/api/admin/products/:id", checkAdminPin, (req, res) => {
    try {
      const { id } = req.params;
      const db = readDb();
      const initialCount = db.products.length;
      db.products = db.products.filter((p) => p.id !== id);

      if (db.products.length === initialCount) {
        return res.status(404).json({ error: "Producto no encontrado." });
      }

      writeDb(db);
      return res.json({ success: true, message: "Producto eliminado correctamente." });
    } catch (err) {
      console.error("Error in DELETE /api/admin/products/:id:", err);
      return res.status(500).json({ error: "Error al eliminar el producto." });
    }
  });

  // PUT /api/admin/settings - Update store settings
  app.put("/api/admin/settings", checkAdminPin, (req, res) => {
    try {
      const { storeName, whatsappPhone, currency, logo, publicCatalogUrl, newAdminPin } = req.body;
      const db = readDb();

      db.settings = {
        ...db.settings,
        storeName: storeName !== undefined ? String(storeName).trim() : db.settings.storeName,
        whatsappPhone: whatsappPhone !== undefined ? String(whatsappPhone).replace(/[^\d+]/g, "").trim() : db.settings.whatsappPhone,
        currency: currency !== undefined ? String(currency).trim() : db.settings.currency,
        logo: logo !== undefined ? String(logo).trim() : db.settings.logo,
        publicCatalogUrl: publicCatalogUrl !== undefined ? String(publicCatalogUrl).trim() : db.settings.publicCatalogUrl,
        adminPin: newAdminPin ? String(newAdminPin).trim() : db.settings.adminPin,
        updatedAt: new Date().toISOString(),
      };

      writeDb(db);

      const { adminPin, ...publicSettings } = db.settings;
      return res.json({ success: true, settings: publicSettings, message: "Configuración guardada correctamente." });
    } catch (err) {
      console.error("Error in PUT /api/admin/settings:", err);
      return res.status(500).json({ error: "Error al guardar la configuración de la tienda." });
    }
  });

  // POST /api/admin/upload-image - Save image base64
  app.post("/api/admin/upload-image", checkAdminPin, (req, res) => {
    try {
      const { base64Image } = req.body;
      if (!base64Image || typeof base64Image !== "string") {
        return res.status(400).json({ error: "No se proporcionó una imagen válida." });
      }

      // If it's a data URL, decode and write file
      const matches = base64Image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // Return base64 as-is if unable to parse format
        return res.json({ imageUrl: base64Image });
      }

      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return res.json({ imageUrl: publicUrl, message: "Imagen subida exitosamente." });
    } catch (err) {
      console.error("Error uploading image:", err);
      return res.status(500).json({ error: "No se pudo procesar la imagen." });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server GamaFit running on http://localhost:${PORT}`);
  });
}

startServer();
