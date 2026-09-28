# Spec: Teléfonos de WhatsApp y países

## Propósito
Que cualquier negocio de Latinoamérica, España o EE. UU./Canadá pueda registrar su número de WhatsApp de
ventas **correctamente**, y que todos los enlaces de pedido del sistema lleguen a ese número. Cubre el bug
de países detectado el 28 sep 2026 (el registro solo admitía Perú y cortaba los números a 9 dígitos).

## Decisiones de arquitectura

1. **Librería única de validación:** `libphonenumber-js` con metadatos `mobile` (validación real de celulares por
   país). Se carga **solo** en las pantallas que editan el teléfono (registro, Configuración, superadmin), nunca en
   el catálogo público, para no sumar peso a la carga del cliente final.
2. **Un solo módulo propio:** `src/lib/phone.ts`. Ningún otro archivo arma, limpia ni valida teléfonos por su cuenta.
   Exporta: `COUNTRIES`, `DEFAULT_COUNTRY = "PE"`, `normalizePhone`, `validatePhone`, `formatPhoneDisplay`,
   `toWhatsAppDigits`. `src/lib/whatsapp.ts#buildWaUrl` sigue siendo el único constructor de enlaces `wa.me`.
3. **Qué se guarda en la base (tabla `stores`):**
   - `phone`: número internacional **completo, solo dígitos, sin `+`**, listo para `wa.me` (ej. `51987654321`,
     `593991234567`, `5491123456789`). Mismo significado que hoy → el catálogo público no cambia.
   - `country_code`: código de marcación sin `+` (ej. `51`, `593`). Se mantiene por compatibilidad.
   - **Nueva** `country_iso`: código ISO-3166 de 2 letras (ej. `PE`, `EC`). Necesario porque el código de
     marcación no identifica un solo país (`1` = EE. UU., Canadá y R. Dominicana). Default `'PE'`.
4. **Validación en dos capas:** en la interfaz (bloquea el botón y explica el formato) y en la base (restricción de
   formato: `phone ~ '^[1-9][0-9]{7,14}$'`, creada `NOT VALID` para no romper filas existentes).

## Países habilitados

Perú (por defecto), Argentina, Bolivia, Brasil, Chile, Colombia, Costa Rica, Ecuador, El Salvador, España,
EE. UU., Canadá, Guatemala, Honduras, México, Nicaragua, Panamá, Paraguay, República Dominicana, Uruguay, Venezuela.

Perú va primero; el resto en orden alfabético. Cada país muestra bandera, nombre, `+código` y un **ejemplo de
formato local** (placeholder). Los ejemplos se validan en tests con la propia librería.

## Requisitos

### Requisito: Selección de país en el registro y en Configuración
El formulario DEBE mostrar un selector de país (por defecto Perú) junto al número. El campo del número NO DEBE
cortar dígitos por una longitud fija.

#### Escenario: Registro desde Ecuador
- **Dado** un usuario que elige Ecuador y escribe `0991234567` (con el 0 local)
- **Cuando** completa el registro
- **Entonces** se guarda `phone = 593991234567`, `country_code = 593`, `country_iso = EC`

#### Escenario: Peruano que escribe con el código de país
- **Dado** un usuario con Perú seleccionado que escribe `+51 987 654 321` o `51987654321`
- **Cuando** continúa
- **Entonces** el sistema reconoce el código repetido y guarda `51987654321` (no `519876543`)

### Requisito: Validación de celular por país
El número DEBE ser un celular válido para el país elegido según la librería. Mientras no lo sea, el botón
"Siguiente" / "Guardar" queda deshabilitado y se muestra: *"Ingresa un celular válido de {país}. Ejemplo: {ejemplo}"*.

#### Escenario: Número peruano incompleto
- **Dado** Perú y el número `99964572` (8 dígitos)
- **Entonces** se bloquea con el mensaje de ejemplo `987 654 321`

#### Escenario: Fijo en lugar de celular
- **Dado** Perú y un número fijo de Lima `014567890`
- **Entonces** se bloquea: "Debe ser un celular con WhatsApp"

### Requisito: Formato correcto para WhatsApp
`toWhatsAppDigits` DEBE devolver el formato que WhatsApp acepta en `wa.me`:
- **Argentina:** `54` + `9` + código de área + número, sin el `0` ni el `15` locales (ej. `5491123456789`).
- **México:** `52` + 10 dígitos (sin el `1` antiguo).
- Resto: formato E.164 sin `+`.

### Requisito: Confirmación visual antes de guardar
Con un número válido, el formulario DEBE mostrar: *"Tus clientes te escribirán a +593 99 123 4567"* y un enlace
**"Probar en WhatsApp"** que abre `wa.me/<número>` en una pestaña nueva, para que el dueño verifique que es su chat.

### Requisito: Aviso de número inválido en tiendas existentes
- En `/admin`, si `phone` guardado no es válido para su `country_iso`: aviso rojo fijo *"Tu número de WhatsApp no
  es válido: tus clientes no pueden enviarte pedidos"* con botón a Configuración.
- En `/super/tiendas`: marca "📵 WhatsApp inválido" en la fila.

### Requisito: Un solo camino para armar enlaces
Todos los enlaces de WhatsApp hacia la tienda (carrito, "Consultar", botón flotante, "Pedir por WhatsApp" del Bio,
PDF del catálogo, alerta del superadmin) DEBEN construirse con `buildWaUrl(store.phone, …)`. El número de soporte de
Dizi (`51925176472`) vive en una sola constante `DIZI_SUPPORT_PHONE`.

### Requisito: Compatibilidad con lo existente
Las tiendas peruanas con número válido (`^519[0-9]{8}$`) NO cambian. La migración rellena `country_iso = 'PE'` en
todas las filas existentes. Los números inválidos existentes **no se corrigen automáticamente**: los corrige el dueño
o el superadmin con el dato real.

## Trazabilidad
Código: `src/lib/phone.ts` (nuevo), `src/lib/whatsapp.ts`, `src/components/PhoneInput.tsx` (nuevo),
`src/routes/register.tsx`, `src/routes/admin.configuracion.tsx`, `src/routes/admin.tsx`, `src/routes/super.tiendas.tsx`,
`src/components/admin/SubscriptionManager.tsx`, `src/components/public/PublicCatalog.tsx`,
`src/components/public/CatalogPdfExport.tsx`, `src/routes/admin.link-bio.tsx`.
Migración: `AAAAMMDDHHMMSS_telefonos_paises.sql`. Pruebas: `src/lib/__tests__/phone.test.ts`,
`tests/e2e/registro-paises.spec.ts`. Encargo: `ENCARGO-Antigravity-FASE-1A-Telefonos-y-Paises.md`.
