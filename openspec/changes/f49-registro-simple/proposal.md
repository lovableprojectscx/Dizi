# F49 · Registro simple: de 6 pantallas a 3, origen de llegada y rubros

**Estado:** ✅ Aprobada por Jack (17 nov 2026) · **Planes:** todos · **Base:** recorrido en vivo de Claude en `/register` (17 nov) y código de master `c5f1608`.

## Por qué
Hoy, para tener su primer producto, una clienta pasa por **6 pantallas**: Registro (Negocio → Diseño → Cuenta) y asistente (Marca → Link en Bio → Primer producto). Problemas verificados el 17 nov:
1. **"Negocios que ya usan Dizi"** (`register.tsx:1827`, `showcase.ts`) muestra 5 tiendas demo como si fueran clientas; solo Adornia es real. Es una promesa falsa justo cuando la persona decide.
2. **El producto va al final** (pantalla 6), después de logo, portada, eslogan y Link en Bio. Una tienda sirve cuando tiene productos.
3. **El paso Diseño** obliga a elegir entre 9 diseños (todos marcados "IDEAL"), una paleta y un color, sin haber visto su tienda.
4. **El link no se completa solo** a partir del nombre.
5. **El nombre se pide dos veces** (registro y asistente).
6. **Rubros:** el registro ofrece 6 (`general, comida, bisuteria, ropa, tech, servicios`), sin "Florería". En la base hay 52 de 61 tiendas reales en `general`.
7. **No sabemos de dónde llegan** (3 de 61 respondieron la encuesta) **ni dónde abandonan** (no hay medición).

## Decisiones de Jack (17 nov; tomó las recomendaciones de Claude)
- "Negocios que ya usan Dizi" pasa a **"Mira cómo se ven las tiendas en Dizi"**, con las mismas demos. Clientas reales solo con su permiso, más adelante.
- El **primer producto** entra al recorrido y se puede saltar.
- Rubros: Florería, Ropa y moda, Calzado, Accesorios y joyería, Belleza, Hogar y decoración, Comida, Postres y pastelería, Tecnología, Regalos, Servicios y Otro.
- El dominio del link no cambia en F49 (sigue `window.location.origin`). `dizicatalogo.com` es otra decisión.
- No hay mockup HTML: especificación escrita y capturas de referencia.

## Recorrido nuevo
1. **Tu negocio:** nombre, rubro (botones con ícono, no lista desplegable) y WhatsApp (se conserva la validación con "Tus clientes te escribirán a…" y "Probar en WhatsApp").
2. **Tu cuenta:** correo, contraseña, link ya completado a partir del nombre (editable, con aviso si está ocupado), "¿Cómo nos conociste?" (opcional, botones: TikTok · Facebook · Instagram · Me recomendaron · Otro) y términos. Botón: "Crear mi catálogo".
3. **Tu primer producto:** se abre el formulario de producto que ya existe, con un mensaje de bienvenida, y "Lo hago después".
Luego, en Inicio, una tarjeta **"Completa tu tienda"** con lo que antes pedía el asistente: logo, portada, diseño, Link en Bio y 3 productos.

## Alcance
- Diseño fuera del registro: se asigna uno por defecto según el rubro (el mismo criterio de "Sugeridos para tu negocio" que existe hoy) y se cambia en el panel.
- Paleta y color fuera del registro: se usa la paleta sugerida del rubro.
- El asistente actual (`OnboardingWizard`) deja de mostrarse a las tiendas nuevas; su contenido pasa a la tarjeta "Completa tu tienda".
- Origen de llegada: respuesta de la clienta + parámetro del link (`?origen=tiktok` o `utm_source`), guardados en la tienda. **`?ref=` no se toca: ya es el código de referidos.**
- Medición del embudo: en qué pantalla abandonan, sin datos personales.
- El superadmin ve el origen de cada tienda nueva.

**Fuera de F49:** entrar con Google, cambio de dominio, cambiar la encuesta (F43), clientas reales en el registro, nuevos estilos de catálogo por rubro.

## Requisitos funcionales
| RF | Descripción |
|---|---|
| RF-49.1 | El registro tiene 2 pantallas (Tu negocio, Tu cuenta) y luego el primer producto, que se puede saltar |
| RF-49.2 | Rubro con 12 opciones en botones; cada una guarda un valor en `stores.niche` (ver diseño) |
| RF-49.3 | El link se completa solo a partir del nombre (minúsculas, sin tildes, con guiones), es editable y avisa si ya existe antes de enviar |
| RF-49.4 | "¿Cómo nos conociste?" opcional, con 5 botones; se guarda en `stores.signup_source` |
| RF-49.5 | Si el link de llegada trae `?origen=` o `utm_source=`, se guarda en `stores.signup_utm` (texto corto, solo letras, números y guiones) |
| RF-49.6 | Diseño y paleta por defecto según el rubro; la clienta no elige en el registro |
| RF-49.7 | Tras crear la cuenta, se abre el formulario de producto existente con mensaje de bienvenida; "Lo hago después" lleva a Inicio |
| RF-49.8 | El asistente `OnboardingWizard` no aparece a tiendas nuevas; Inicio muestra "Completa tu tienda" con 5 tareas y su estado real; se oculta cuando todas están hechas o la dueña la cierra |
| RF-49.9 | El título de la sección de demos pasa a "Mira cómo se ven las tiendas en Dizi" |
| RF-49.10 | Se registra cada pantalla vista del embudo (vio registro, completó negocio, creó cuenta, creó primer producto o lo saltó) sin correo, nombre ni teléfono |
| RF-49.11 | El superadmin ve el origen (respuesta y parámetro) en la lista de tiendas |
| RF-49.12 | Las invitaciones (`?invite=`), los referidos (`?ref=`) y el plan pedido (`?plan=`) siguen funcionando igual |

## Requisitos no funcionales
- RNF-49.1 Nada más cambia: las 61 tiendas existentes, sus catálogos y su panel se ven igual. Las tiendas existentes no ven la tarjeta "Completa tu tienda" ni el asistente.
- RNF-49.2 Celular primero (375 px): botones de 44 px como mínimo, sin scroll dentro de cajas, teclado correcto (correo, número).
- RNF-49.3 Una sola fuente de verdad: los rubros y su diseño y paleta por defecto viven en un solo archivo de `src/lib/`.
- RNF-49.4 Seguridad: la tabla del embudo solo permite insertar (nunca leer) como anónimo, con valores cerrados por CHECK; no guarda datos personales.
- RNF-49.5 Primero la migración y después el merge; el código funciona aunque las columnas nuevas todavía no existan.

## Escenarios (cada uno es una prueba)
1. Dado el registro en celular, cuando completo Tu negocio y Tu cuenta, entonces se crea la cuenta y la tienda y veo el formulario de primer producto.
2. Dado el nombre "Florería María", entonces el link propuesto es `floreria-maria`; si ya existe, veo el aviso antes de enviar.
3. Dado que elijo "TikTok", entonces la tienda queda con `signup_source = 'tiktok'`; si no elijo nada, queda vacío y el registro funciona igual.
4. Dado que llego con `/register?origen=tiktok-video1`, entonces la tienda queda con `signup_utm = 'tiktok-video1'`.
5. Dado que llego con `?ref=<código>`, entonces el referido se guarda como hoy (`referred_by`) y no se mezcla con el origen.
6. Dado `?invite=` válido, entonces el plan y la duración de la invitación se aplican como hoy.
7. Dado el rubro "Florería", entonces la tienda queda con el diseño y la paleta por defecto definidos para ese rubro.
8. Dado "Lo hago después", entonces llego a Inicio y veo "Completa tu tienda" con 0 o 1 de 5.
9. Dada una tienda existente (creada antes de F49), entonces no ve "Completa tu tienda" ni el asistente.
10. Dado el registro, entonces la sección de demos dice "Mira cómo se ven las tiendas en Dizi".
11. Dado un recorrido completo, entonces quedan registrados los pasos del embudo, sin correo ni teléfono.
12. Dado el superadmin, entonces ve el origen de las tiendas nuevas.

## Cómo medimos si funcionó (línea base 17 nov)
| Métrica | Hoy | Meta a 30 días |
|---|---|---|
| Tiendas nuevas con origen conocido | 3 de 61 (por encuesta) | 80 % de las nuevas |
| Tiendas nuevas con 1 o más productos a las 24 h | 80 % (37 de 46 reales, últimos 60 días; Paso 0 y verificación de Claude) | 90 % |
| Abandono entre "vio registro" y "creó cuenta" | no se mide | se mide desde F49 |

## Decisiones tras el Paso 0 (17 nov)
- Diseño por defecto: Florería → `bloom_general`, Comida → `bite`, Ropa y moda → `vitrina`, el resto → `grid`. Paleta: la primera sugerida del rubro.
- Eslogan por defecto de Belleza (`brand-cover.ts:83`): pasa a uno de venta, no de citas.
- Superadmin: las etiquetas de rubro salen de `rubros.ts`, y los valores viejos (`hamburgueseria`, `cosmetica`, `tecnologia`, etc.) se muestran con su nombre.
- `OnboardingWizard` sale de `admin.tsx`; las tiendas nuevas se crean con `onboarding_completed = true`; "Completa tu tienda" solo para tiendas creadas después del despliegue.
