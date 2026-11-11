# Sistema de Gestión de Consentimientos Informados y Pertenencias Clínicas

Plataforma clínica desarrollada bajo los estándares oficiales de **GST-SOFTWARE** para la captura digital, firma táctil, custodia inmutable, recibo de pertenencias y generación de PDF imprimible de formatos de hospitalización y enfermería.

---

## 🎯 Características Principales

1. **Encabezado Clínico Automático:** Fecha y hora autogeneradas, selección de sede/servicio y consecutivo único de formato (`FOR-CLI-YYYY-XXXX`).
2. **Identificación de Paciente y Regla de Acudiente Obligatorio:**
   - Captura de nombre completo, tipo y número de documento, edad, diagnóstico/motivo de consulta.
   - Si el paciente es **menor de 18 años** o se marca con **incapacidad / alteración de conciencia para firmar**, el bloque de **Acudiente Responsable** (nombre, documento, parentesco, teléfono y firma) se vuelve obligatorio automáticamente.
3. **Consentimientos Informados Independientes (Parametrizables):**
   - **Hospitalización / Ingreso Clínico**
   - **Procedimientos de Enfermería**
   - **Presencia de Estudiantes en Prácticas Docencia-Servicio**
   - Cada consentimiento cuenta con su propio texto institucional aprobado, casilla independiente de **Acepto / Rechazo** y **Firma Digital Táctil** individual.
4. **Recibo y Custodia de Pertenencias + Acta de Devolución:**
   - Lista dinámica de pertenencias (ítem, descripción, cantidad, clasificación **Apta** o **No Apta** para permanecer en el servicio).
   - Registro de monto de dinero en efectivo y observaciones.
   - Firma de quien entrega y firma del funcionario de enfermería que recibe.
   - **Acta de Devolución Automática** para los elementos marcados como **"No Apta"**, con identificación de quien retira y firma independiente.
5. **Firma Electrónica Táctil (Tablet / Celular / PC):**
   - Lienzo HTML5 Canvas de alta sensibilidad compatible con dedo, lápiz óptico (Stylus) o mouse, con hash SHA-256 de integridad y metadatos de trazabilidad (Ley 527 de 1999 y Decreto 2364 de 2012).
6. **Inmutabilidad Clínica y Anulación Justificada (Resolución 1995 de 1999):**
   - Una vez firmado y cerrado el formato, **queda bloqueado contra edición**.
   - Solo puede ser **Anulado** registrando motivo obligatorio, usuario responsable y fecha/hora exacta en la pista de auditoría.
7. **Modo Offline-First con Sincronización Automática:**
   - Funciona en tablets/celulares incluso sin conexión a internet (almacenamiento cifrado/estructurado local y cola de sincronización hacia Supabase PostgreSQL).
8. **Impresión y Exportación PDF:**
   - Vista de impresión idéntica al formato hospitalario oficial (encabezado de calidad, tablas clínicas, firmas embebidas y huella criptográfica).
9. **Roles y Permisos (RBAC):**
   - **Enfermería (`nursing`):** Diligencia formatos, captura firmas y consulta historial.
   - **Consulta / Auditoría (`viewer`):** Búsqueda por paciente/documento, visualización y descarga de PDF.
   - **Administrador (`admin`):** Gestión de textos oficiales de consentimientos, sedes/servicios, auditoría y anulación justificada.

---

## 🛠️ Stack Tecnológico (GST-SOFTWARE Standard)

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript Estricto (`no-any`).
- **Estilos & UI:** Tailwind CSS + Lucide Icons + GST Design System.
- **Validaciones:** Esquemas estrictos con **Zod**.
- **Persistencia & Auth:** Supabase PostgreSQL (con Row Level Security - RLS) + Motor Local-First (Offline Sync Queue).
- **Testing:** Vitest (Pruebas unitarias de reglas clínicas y validadores Zod).

---

## 🚀 Inicio Rápido

```powershell
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Verificar calidad (TypeScript, Linter y Tests)
npm run typecheck
npm run lint
npm run test
```
