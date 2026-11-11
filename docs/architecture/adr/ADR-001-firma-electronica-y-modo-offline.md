# ADR-001: Firma Electrónica Táctil, Inmutabilidad Clínica y Sincronización Offline

- **Estado:** Aprobado
- **Fecha:** 2026-10-27
- **Autor:** Equipo de Arquitectura GST-SOFTWARE

---

## 1. Contexto

El sistema se utilizará en servicios hospitalarios (Urgencias, Hospitalización, Cirugía, UCI) desde tablets, celulares y computadores de escritorio. En muchas zonas hospitalarias la señal Wi-Fi presenta intermitencia. Además, la normativa colombiana (Ley 527 de 1999, Decreto 2364 de 2012, Ley 1581 de 2012 y Resolución 1995 de 1999) exige integridad documental, autenticidad, trazabilidad y prohibición de alteración de registros clínicos firmados.

## 2. Decisión

1. **Captura de Firma Táctil Nativa (HTML5 Pointer Events Canvas):**
   - Implementar un componente propio de alta precisión (`SignaturePad`) utilizando la API estándar `PointerEvent` del navegador (soporta dedo en pantalla táctil, lápiz óptico/Stylus y mouse) sin depender de librerías externas obsoletas que rompan el tipado estricto de React 19.
2. **Sello Criptográfico de Integridad (Web Crypto API `SHA-256`):**
   - Al firmar y cerrar un formato, se calcula en tiempo real un hash `SHA-256` sobre el payload canónico del formato (encabezado, paciente, acudiente, textos exactos de cada consentimiento vigente al momento de la firma, inventario de pertenencias y trazos de firma).
3. **Almacenamiento Híbrido Local-First (Offline Sync Queue):**
   - Los formatos y la bitácora de auditoría se persisten inmediatamente en el almacenamiento local del dispositivo con bandera `syncStatus: 'PENDING_SYNC' | 'SYNCED'` y se sincronizan con **Supabase PostgreSQL** cuando existe conectividad.
4. **Bloqueo de Edición y Anulación Lógica:**
   - Tanto en la capa de servicios TypeScript como mediante un `TRIGGER` en PostgreSQL, se prohíbe modificar cualquier campo clínico de un formato firmado (`status = 'SIGNED'`). Solo se permite cambiar el estado a `'ANNULLED'` adjuntando obligatoriamente `annulment_reason`, `annulled_by` y `annulled_at`.

## 3. Consecuencias

- **Positivas:** Cero pérdida de datos por caídas de red en rondas de enfermería; cumplimiento estricto de integridad probatoria bajo el Decreto 2364 de 2012; costo $0 adicional de infraestructura.
- **Riesgos mitigados:** Se guarda una copia exacta del texto institucional de cada consentimiento dentro del registro firmado (`snapshot`), de modo que si el Administrador actualiza el texto meses después, los formatos históricos conservan intacto el texto exacto que el paciente firmó.
