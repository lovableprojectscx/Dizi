# SKILL: Auditoría de Ciberseguridad — Stack Idenza

**Para agentes IA que revisan y protegen proyectos de Idenza**

---

## CONTEXTO DEL STACK

- **Frontend:** React + Vite (Lovable)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deploy:** Vercel
- **IA:** Gemini / Google AI Studio
- **Arquitectura:** Multi-tenant con RLS por `tenant_id`
- **Clientes:** Florerías y tiendas en Lima, Perú

---

## MISIÓN DEL AGENTE

Cuando se te pida revisar seguridad de un proyecto Idenza, sigue este checklist en orden de prioridad. Detecta, explica en términos simples y propón el fix exacto.

---

## PRIORIDAD 1 — CRÍTICO (resolver antes de deploy)

### 1.1 API Keys expuestas en frontend

**Riesgo:** Cualquier persona puede ver el código fuente y robar las keys.
**Detectar:** Buscar en el código cualquier string que empiece con `AIza`, `sk-`, `Bearer`, o asignaciones directas como `const apiKey = "..."` fuera de variables de entorno.
**Fix:**

```js
// MAL — nunca así
const geminiKey = "AIzaSyXXXXXXXXXX";

// BIEN — siempre en Edge Function de Supabase
// La key vive en los secrets de Supabase, nunca en el frontend
```

**Acción:** Mover toda llamada a Gemini/Google AI a un Supabase Edge Function. La key se guarda en Supabase Dashboard > Settings > Edge Functions > Secrets.

---

### 1.2 RLS desactivado en tablas de Supabase

**Riesgo:** Cualquier persona con la `anon key` puede leer TODA la base de datos de todos los clientes.
**Detectar:** Ejecutar en Supabase SQL Editor:

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND NOT rowsecurity;
```

Si devuelve resultados → vulnerabilidad crítica.

**Fix:** Activar RLS en cada tabla:

```sql
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
-- repetir para cada tabla
```

**Policy multi-tenant obligatoria:**

```sql
CREATE POLICY "tenant_isolation" ON productos
FOR ALL USING (tenant_id = auth.jwt() -> 'tenant_id');
```

---

### 1.3 service_role key en frontend

**Riesgo:** La `service_role` bypasea RLS completamente — acceso total a la BD.
**Detectar:** Buscar `service_role` o `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9` en código frontend.
**Fix:** La `service_role` SOLO va en Edge Functions o en el servidor. Nunca en el cliente.

---

## PRIORIDAD 2 — IMPORTANTE (resolver en la semana)

### 2.1 Variables de entorno mal configuradas en Vercel

**Riesgo:** Keys expuestas al browser si se usa el prefijo incorrecto.
**Regla:**

```
VITE_SUPABASE_URL=...        ✅ OK — es pública
VITE_SUPABASE_ANON_KEY=...   ✅ OK — es pública por diseño
VITE_GEMINI_KEY=...          ❌ NUNCA — queda expuesta en el bundle
GEMINI_KEY=...               ✅ OK — solo server-side
```

**Fix:** En Vercel Dashboard > Settings > Environment Variables, marcar las keys sensibles como "Sensitive". Las sensibles nunca deben tener prefijo `VITE_` ni `NEXT_PUBLIC_`.

---

### 2.2 CORS mal configurado en Edge Functions

**Riesgo:** Cualquier dominio puede llamar tus Edge Functions.
**Fix:**

```js
// En cada Edge Function de Supabase
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://tudominio.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
};
```

No usar `*` en producción.

---

### 2.3 Validación de JWT en Edge Functions

**Riesgo:** Alguien puede llamar tu Edge Function sin autenticarse.
**Fix:**

```js
// Siempre validar el JWT al inicio de cada Edge Function
const authHeader = req.headers.get("Authorization");
if (!authHeader) return new Response("Unauthorized", { status: 401 });

const {
  data: { user },
  error,
} = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
if (error || !user) return new Response("Unauthorized", { status: 401 });
```

---

### 2.4 Rate limiting en Edge Functions

**Riesgo:** Alguien puede spamear tu Edge Function de Gemini y generar costos enormes.
**Fix básico:** Limitar por IP o por usuario — máximo X llamadas por minuto. Implementar con un contador en Supabase o usando Upstash Redis.

---

## PRIORIDAD 3 — BUENAS PRÁCTICAS

### 3.1 Headers de seguridad HTTP

**Fix en vercel.json:**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 3.2 .gitignore correcto

```
.env
.env.local
.env.production
*.key
```

### 3.3 Rotación de keys

Si sospechas que una key fue expuesta:

1. Ir a Supabase Dashboard → Settings → API → Regenerate keys
2. Actualizar en Vercel Environment Variables
3. Redeployar

---

## CHECKLIST RÁPIDO PRE-DEPLOY

Antes de cada deploy, el agente debe verificar:

- [ ] No hay API keys hardcodeadas en el código
- [ ] Todas las tablas tienen RLS activado (query SQL del punto 1.2)
- [ ] `service_role` no aparece en el frontend
- [ ] Gemini/AI calls van por Edge Function, no directo desde el cliente
- [ ] Variables sensibles en Vercel marcadas como "Sensitive"
- [ ] CORS configurado con dominio específico, no `*`
- [ ] JWT validado al inicio de cada Edge Function

---

## CÓMO REPORTAR AL USUARIO (Jack)

Usar lenguaje simple, no técnico. Ejemplo:

> "Encontré 2 problemas críticos:
>
> 1. Tu key de Gemini está visible en el código — cualquiera puede verla y usarla a tu costo. Fix: la movemos a una función segura en Supabase (5 minutos).
> 2. La tabla 'productos' no tiene protección de datos — cualquier persona podría ver los productos de todos tus clientes. Fix: activamos RLS con un comando SQL (2 minutos)."

---

## REFERENCIAS

- Supabase Security Retro 2025: https://supabase.com/blog/supabase-security-2025-retro
- RLS Best Practices: https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- CVE-2025-48757 (Lovable apps con RLS desactivado): 10.3% de apps Lovable tenían datos expuestos
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
