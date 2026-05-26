-- =========================================================================================
-- MIGRACIÓN: Políticas Estrictas de Seguridad Multi-Tenant (RLS)
-- Fecha: 2026-05-14
-- Descripción: Elimina las políticas públicas permisivas y establece un aislamiento
--              estricto por inquilino (Tenant) basado en el auth.uid() = owner_id.
--              Garantiza que una empresa no pueda ver ni modificar datos privados de otra.
-- =========================================================================================

-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 1. Limpieza de Políticas Permisivas Anteriores (Fase Mock)
-- ─────────────────────────────────────────────────────────────────────────────────────────

-- Tabla: stores
DROP POLICY IF EXISTS "Lectura pública de tiendas" ON stores;
DROP POLICY IF EXISTS "Edición pública de tiendas" ON stores;

-- Tabla: categories
DROP POLICY IF EXISTS "Lectura pública de categorías" ON categories;
DROP POLICY IF EXISTS "Edición pública de categorías" ON categories;

-- Tabla: products
DROP POLICY IF EXISTS "Lectura pública de productos" ON products;
DROP POLICY IF EXISTS "Edición pública de productos" ON products;

-- Tabla: reclamaciones
DROP POLICY IF EXISTS "anon_insert_reclamaciones" ON reclamaciones;
DROP POLICY IF EXISTS "autenticados_select_reclamaciones" ON reclamaciones;
DROP POLICY IF EXISTS "autenticados_update_reclamaciones" ON reclamaciones;


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 2. Políticas Multi-Tenant Estrictas: STORES (El Inquilino)
-- ─────────────────────────────────────────────────────────────────────────────────────────

-- LECTURA PÚBLICA: Cualquier persona en internet puede ver una tienda SOLO SI está publicada y activa.
-- (Requerido para que los clientes finales vean el catálogo).
CREATE POLICY "stores_public_select"
ON stores FOR SELECT
USING (active = true AND is_published = true);

-- LECTURA PRIVADA: El dueño de la tienda siempre puede ver su propia tienda, aunque no esté publicada.
CREATE POLICY "stores_owner_select"
ON stores FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

-- INSERCIÓN: Un usuario autenticado puede crear una tienda, pero el owner_id DEBE ser su propio UID.
CREATE POLICY "stores_owner_insert"
ON stores FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- ACTUALIZACIÓN Y BORRADO: Solo el dueño absoluto de la tienda puede modificarla o eliminarla.
CREATE POLICY "stores_owner_update"
ON stores FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "stores_owner_delete"
ON stores FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 3. Políticas Multi-Tenant Estrictas: CATEGORIES (Aislamiento Cruzado)
-- ─────────────────────────────────────────────────────────────────────────────────────────

-- LECTURA PÚBLICA: Se pueden ver las categorías si la tienda a la que pertenecen es visible.
CREATE POLICY "categories_public_select"
ON categories FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id 
    AND ( (stores.active = true AND stores.is_published = true) OR stores.owner_id = auth.uid() )
  )
);

-- ESCRITURA (Insert/Update/Delete): Solo el dueño de la tienda padre puede alterar las categorías.
CREATE POLICY "categories_owner_all"
ON categories FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = categories.store_id AND stores.owner_id = auth.uid()
  )
);


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 4. Políticas Multi-Tenant Estrictas: PRODUCTS (Aislamiento Cruzado)
-- ─────────────────────────────────────────────────────────────────────────────────────────

-- LECTURA PÚBLICA: Se pueden ver los productos si la tienda padre es visible, o si soy el dueño.
CREATE POLICY "products_public_select"
ON products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND ( (stores.active = true AND stores.is_published = true) OR stores.owner_id = auth.uid() )
  )
);

-- ESCRITURA (Insert/Update/Delete): Solo el dueño de la tienda padre puede alterar los productos.
CREATE POLICY "products_owner_all"
ON products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
  )
);


-- ─────────────────────────────────────────────────────────────────────────────────────────
-- 5. Políticas Multi-Tenant Estrictas: RECLAMACIONES (Datos Sensibles / Privados)
-- ─────────────────────────────────────────────────────────────────────────────────────────

-- INSERCIÓN PÚBLICA: Cualquier usuario (cliente final anónimo o logueado) puede crear un reclamo.
CREATE POLICY "reclamaciones_public_insert"
ON reclamaciones FOR INSERT
WITH CHECK (true);

-- LECTURA, ACTUALIZACIÓN Y BORRADO: ESTRICTAMENTE SOLO EL DUEÑO DE LA TIENDA.
-- Ningún cliente externo puede leer los reclamos de una tienda, ni mucho menos el dueño de OTRA tienda.
CREATE POLICY "reclamaciones_owner_all"
ON reclamaciones FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "reclamaciones_owner_update"
ON reclamaciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
  )
);

CREATE POLICY "reclamaciones_owner_delete"
ON reclamaciones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = reclamaciones.tenant_id AND stores.owner_id = auth.uid()
  )
);
