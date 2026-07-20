# Spec: Bio-Link

## Propósito
Página de enlaces múltiples optimizada para redes sociales, con personalización condicionada al plan. Cubre RF-10.

## Requisitos

### Requisito: Personalización según plan (RF-10)
El Bio-Link (`/bio/:slug`) DEBE limitar enlaces y funciones visuales según el plan: semilla máx. 3 enlaces; premium ilimitados con tipografía, fondos y mapa (Leaflet).

#### Escenario: Límite en plan gratuito
- **Dado** una tienda semilla con 3 enlaces guardados
- **Cuando** intenta guardar un cuarto enlace
- **Entonces** el guardado se bloquea con alerta de upgrade

#### Escenario: Personalización premium
- **Dado** una tienda con plan Pro activo
- **Cuando** configura tipografía, fondo degradado y ubicación en mapa
- **Entonces** el Bio-Link público renderiza todas las personalizaciones

## Trazabilidad
Casos de prueba: E2E-05 · Código: `src/routes/admin.link-bio.tsx`, `src/routes/bio.$slug.tsx`, migraciones `20260526000000_add_biolink_and_location.sql`, `20260605000000_add_bio_typography.sql`
