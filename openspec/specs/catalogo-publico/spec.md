# Spec: Catálogo Público

## Propósito
Exponer el catálogo de cada comercio en una URL pública propia, sin autenticación, renderizando productos, categorías y la identidad visual configurada. Cubre RF-01 y RF-03.

## Requisitos

### Requisito: Publicación por slug (RF-01)
El sistema DEBE servir el catálogo en `/t/:slug` para tiendas publicadas (`is_published = true`), mostrando productos activos, categorías, logo y paleta de colores.

#### Escenario: Acceso exitoso
- **Dado** que la tienda "pasteleria-diana" existe y está publicada
- **Cuando** un visitante accede a `/t/pasteleria-diana`
- **Entonces** se muestran los productos activos, categorías, logo y colores configurados

#### Escenario: Catálogo despublicado
- **Dado** que la tienda tiene `is_published = false`
- **Cuando** un visitante accede a su URL pública
- **Entonces** se muestra 404 o el mensaje "catálogo temporalmente desactivo"

### Requisito: Formateo de precios en soles (RF-03)
Todo precio DEBE mostrarse con prefijo `S/` y dos decimales; sin precio definido DEBE mostrarse "A consultar".

#### Escenario: Precio con decimales
- **Dado** un producto con precio `15.5`
- **Cuando** se renderiza su tarjeta
- **Entonces** el precio se muestra como "S/ 15.50"

#### Escenario: Producto sin precio
- **Dado** un producto con precio `null`, `undefined` o `0`
- **Cuando** se despliega en el catálogo
- **Entonces** la tarjeta muestra "A consultar"

### Requisito: Preservación de Modelo Visual y Carrusel de Banners
El servidor DEBE entregar en `get_public_store` el modelo visual elegido por el dueño (`model`), renderizándolo fielmente en el catálogo público con rotación de carrusel multi-banner de 5 segundos e indicadores táctiles, manteniendo la columna de filtros lateral en pantallas de escritorio (PC).

#### Escenario: Renderizado completo en PC y Móvil
- **Dado** que la tienda tiene configurado un modelo visual (ej. `bite`, `overlay`, `hero`, `spotlight`)
- **Cuando** un visitante accede a la URL pública `/t/:slug`
- **Entonces** se renderiza la plantilla seleccionada, el carrusel de banners rota dinámicamente y en PC se mantiene visible la barra lateral de filtros y categorías.

## Trazabilidad
Casos de prueba: CP-01 a CP-04, CP-14 · E2E-01 · Código: `src/routes/t.$slug.tsx`, `src/components/public/PublicCatalog.tsx`, RPC `get_public_store`
