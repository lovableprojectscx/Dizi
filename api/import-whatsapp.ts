import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://wxpizbnuuaiculzfuhof.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4cGl6Ym51dWFpY3VsemZ1aG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMjM3MzMsImV4cCI6MjA5Mzg5OTczM30.azLkp485_RtvtgkUAOesk9BOwgqJiO7QLrM1sxI5-5A";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to detect niche based on store name
function detectNiche(name: string): "floreria" | "comida" | "ropa" | "bisuteria" | "tech" | "belleza" | "general" {
  const n = name.toLowerCase();
  if (n.includes("flor") || n.includes("regalo") || n.includes("detall") || n.includes("sorpres") || n.includes("rosas")) return "floreria";
  if (n.includes("comid") || n.includes("restauran") || n.includes("bocado") || n.includes("gourmet") || n.includes("burger") || n.includes("pizz") || n.includes("fast") || n.includes("sushi") || n.includes("cafe")) return "comida";
  if (n.includes("ropa") || n.includes("boutique") || n.includes("moda") || n.includes("vestir") || n.includes("jean") || n.includes("casual")) return "ropa";
  if (n.includes("bisuter") || n.includes("joya") || n.includes("accesor") || n.includes("collar") || n.includes("anill") || n.includes("carter")) return "bisuteria";
  if (n.includes("tech") || n.includes("electron") || n.includes("celular") || n.includes("comput") || n.includes("gadget") || n.includes("gamer")) return "tech";
  if (n.includes("bellez") || n.includes("cosmet") || n.includes("makeup") || n.includes("piel") || n.includes("facial") || n.includes("salon")) return "belleza";
  return "general";
}

// Generate premium mock products based on niche
function generateMockProducts(niche: string, categoryId: string) {
  const uid = () => "p_" + Math.random().toString(36).substring(2, 9);
  
  if (niche === "floreria") {
    return [
      {
        id: uid(),
        name: "Arreglo Primavera Elegante",
        price: 89.90,
        categoryId,
        image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80",
        description: "Hermoso arreglo floral de tulipanes, rosas premium y follaje silvestre. Presentado en una elegante base de madera.",
        isOnSale: true,
        originalPrice: 110.00,
        visible: true,
        isSample: false
      },
      {
        id: uid(),
        name: "Caja Sorpresa de Rosas & Chocolates",
        price: 125.00,
        categoryId,
        image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80",
        description: "12 rosas rojas seleccionadas en caja de lujo acompañada de finos chocolates Ferrero Rocher.",
        isOnSale: false,
        originalPrice: null,
        visible: true,
        isSample: false
      },
      {
        id: uid(),
        name: "Orquídea Phalaenopsis Premium",
        price: 95.00,
        categoryId,
        image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=600&q=80",
        description: "Orquídea exótica de dos varas en maceta de cerámica decorada, ideal para obsequiar o decorar espacios interiores.",
        isOnSale: false,
        originalPrice: null,
        visible: true,
        isSample: false
      }
    ];
  }

  if (niche === "comida") {
    return [
      {
        id: uid(),
        name: "Hamburguesa Monster Doble Queso",
        price: 28.90,
        categoryId,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        description: "Doble carne premium angus (150g c/u), doble queso cheddar fundido, tocino crocante, salsa especial de la casa en pan brioche artesanal.",
        isOnSale: true,
        originalPrice: 34.00,
        visible: true,
        isSample: false
      },
      {
        id: uid(),
        name: "Pizza Artesanal de Prosciutto & Rúcula",
        price: 38.00,
        categoryId,
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        description: "Masa madurada por 48 horas, salsa de tomates italianos, queso mozzarella flor di latte, láminas de prosciutto italiano y hojas frescas de rúcula.",
        isOnSale: false,
        originalPrice: null,
        visible: true,
        isSample: false
      }
    ];
  }

  if (niche === "ropa") {
    return [
      {
        id: uid(),
        name: "Vestido Midi Floral Primavera",
        price: 99.00,
        categoryId,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80",
        description: "Elegante vestido midi confeccionado en lino suave con delicado estampado floral. Corte en cintura y tirantes regulables.",
        isOnSale: true,
        originalPrice: 129.00,
        visible: true,
        isSample: false
      },
      {
        id: uid(),
        name: "Casaca Biker de Cuero Premium",
        price: 189.00,
        categoryId,
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        description: "Casaca de cuero sintético texturizado de alta durabilidad con cierres metálicos plateados y forro interior satinado.",
        isOnSale: false,
        originalPrice: null,
        visible: true,
        isSample: false
      }
    ];
  }

  // Fallback / General Niche
  return [
    {
      id: uid(),
      name: "Taza de Cerámica Artesanal Minimalist",
      price: 22.00,
      categoryId,
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      description: "Taza de cerámica torneada a mano con un acabado rústico esmaltado en tonos naturales. Capacidad 350ml.",
      isOnSale: true,
      originalPrice: 28.00,
      visible: true,
      isSample: false
    },
    {
      id: uid(),
      name: "Agenda Organizadora Planner Anual",
      price: 35.00,
      categoryId,
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80",
      description: "Organizador semanal y mensual con tapas duras forradas, stickers, marcapáginas y hojas de 90g para evitar traspaso de tinta.",
      isOnSale: false,
      originalPrice: null,
      visible: true,
      isSample: false
    }
  ];
}

export default async function handler(req: any, res: any) {
  // CORS - Restringido a orígenes de confianza (WhatsApp y dominio propio)
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://web.whatsapp.com",
    "https://dizi.idenza.site",
    "https://dizi.pe",
    "http://localhost:5173",
    "http://localhost:3000"
  ];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Origen por defecto seguro
    res.setHeader('Access-Control-Allow-Origin', 'https://dizi.idenza.site');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Recibir productos reales extraídos por el bookmarklet
  if (req.method === 'POST') {
    const { phone, products } = req.body || {};
    if (!phone || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: "Faltan parámetros requeridos ('phone' o 'products')" });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: "Número de teléfono no válido." });
    }

    try {
      // Guardar productos en la tabla temporal
      const { error } = await supabase
        .from("temporary_imports")
        .upsert({ phone: cleanPhone, products, created_at: new Date().toISOString() });

      if (error) throw error;

      console.log(`[Import-POST] Guardado exitoso para: ${cleanPhone}. ${products.length} productos.`);
      return res.status(200).json({ success: true, count: products.length });
    } catch (err: any) {
      console.error("[Import-POST] Error saving to Supabase:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET: Consultar si ya hay productos cargados para este número
  if (req.method === 'GET') {
    const input = req.query.input;
    if (!input) {
      return res.status(400).json({ error: "Falta el parámetro 'input'." });
    }

    let cleanPhone = input.replace(/\D/g, "");
    if (input.includes("wa.me/c/")) {
      const parts = input.split("wa.me/c/");
      if (parts.length > 1) {
        cleanPhone = parts[1].replace(/\D/g, "");
      }
    }

    if (cleanPhone.length < 8) {
      return res.status(400).json({ error: "Número o enlace inválido." });
    }

    // 1. Verificar si existen productos reales importados desde el bookmarklet
    try {
      const { data, error } = await supabase
        .from("temporary_imports")
        .select("products")
        .eq("phone", cleanPhone)
        .single();

      if (data && !error) {
        // Encontrados productos reales scrapeados por el bookmarklet!
        // Eliminar fila de uso único para limpiar la base
        await supabase
          .from("temporary_imports")
          .delete()
          .eq("phone", cleanPhone);

        console.log(`[Import-GET] Productos reales cargados para: ${cleanPhone}`);
        return res.status(200).json({
          phone: cleanPhone,
          source: "bookmarklet",
          products: data.products
        });
      }
    } catch (err) {
      // Ignorar error de no encontrado y continuar
    }

    // 2. Intentar Whapi si está configurado
    const whapiToken = process.env.WHAPI_TOKEN;
    if (whapiToken) {
      try {
        console.log(`[Import-GET] Intentando importar de Whapi para: ${cleanPhone}`);
        const whapiRes = await fetch(`https://gate.whapi.cloud/business/products?wid=${cleanPhone}`, {
          headers: {
            'Authorization': `Bearer ${whapiToken}`,
            'Accept': 'application/json'
          }
        });
        
        if (whapiRes.ok) {
          const whapiData: any = await whapiRes.json();
          if (whapiData.products && whapiData.products.length > 0) {
            const categoryId = "c_" + Math.random().toString(36).substring(2, 9);
            const mappedProducts = whapiData.products.slice(0, 8).map((p: any) => ({
              id: "p_" + Math.random().toString(36).substring(2, 9),
              name: p.name || "Producto sin nombre",
              price: p.price ? Number(p.price) / 1000 : 25.00,
              categoryId,
              image: p.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
              description: p.description || "",
              isOnSale: false,
              originalPrice: null,
              visible: true,
              isSample: false
            }));

            return res.status(200).json({
              phone: cleanPhone,
              source: "whapi",
              products: mappedProducts
            });
          }
        }
      } catch (whapiErr) {
        console.error("[Import-GET] Error Whapi:", whapiErr);
      }
    }

    // 3. Fallback inteligente generativo si no hay datos reales ni Whapi
    const nameParam = req.query.name || "Mi Negocio";
    const detected = detectNiche(nameParam);
    const categoryId = "c_" + Math.random().toString(36).substring(2, 9);
    const mockProducts = generateMockProducts(detected, categoryId);

    // Pequeño retardo de experiencia de carga
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return res.status(200).json({
      phone: cleanPhone,
      source: "ai_generator",
      niche: detected,
      products: mockProducts
    });
  }
}
