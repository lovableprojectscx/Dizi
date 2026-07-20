# Spec: Libro de Reclamaciones

## Propósito
Ofrecer a cada tienda un Libro de Reclamaciones digital conforme al Anexo I de INDECOPI. Cubre RF-09.

## Requisitos

### Requisito: Registro público de reclamos (RF-09)
El consumidor DEBE poder registrar quejas/reclamos en un formulario paso a paso, obteniendo un correlativo único inalterable y un ticket digital imprimible.

#### Escenario: Reclamo exitoso
- **Dado** una tienda con el libro activo
- **Cuando** el consumidor completa sus datos y su reclamo
- **Entonces** se genera el correlativo (ej. N° 0001-2026) y se muestra el ticket con opción de impresión

#### Escenario: Atención del comerciante
- **Dado** reclamos pendientes en `/admin/reclamaciones`
- **Cuando** el dueño responde formalmente y guarda
- **Entonces** el estado pasa a "resuelto" con fecha y hora registradas (plazo máximo: 15 días hábiles)

## Trazabilidad
Casos de prueba: E2E-04 · Código: `src/routes/admin.reclamaciones.tsx`, migración `20260514_libro_reclamaciones.sql` · Ver `docs/informes/entregables/Informe_Libro_Reclamaciones_Dizi`
