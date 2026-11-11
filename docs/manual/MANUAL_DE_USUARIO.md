# Manual de Usuario — Sistema de Consentimientos Informados de Enfermería y Recibo de Pertenencias

**Versión del Sistema:** 1.0.0  
**Formato Institucional Homologado:** `FOR-ENF-HC-014` (Versión 04)  
**Marco Normativo (Colombia):** Resolución 1995 de 1999 (Historia Clínica), Ley 1581 de 2012 (Habeas Data), Ley 527 de 1999 y Decreto 2364 de 2012 (Firma Electrónica e Integridad SHA-256).

---

## 1. Propósito del Aplicativo

El **Sistema de Consentimientos Informados de Enfermería y Recibo de Pertenencias** permite al personal asistencial, auditores médicos y coordinadores de calidad diligenciar, firmar digitalmente en pantalla táctil, custodiar, consultar y exportar en PDF los formatos oficiales de ingreso hospitalario de un paciente, garantizando:

1. **Tres (3) consentimientos informados independientes** con decisión individual (`Acepto` / `No Acepto`) y firma separada por cada uno:
   - Consentimiento de **Hospitalización**
   - Consentimiento de **Procedimientos de Enfermería**
   - Consentimiento de **Presencia de Estudiantes en Prácticas** (Docencia-Servicio)
2. **Inventario detallado de pertenencias** clasificadas en **Aptas** (permanecen con el paciente) y **No Aptas** (deben devolverse a un familiar/acudiente).
3. **Acta automática de devolución** cuando se registran pertenencias **No Aptas**.
4. **Operación Híbrida (Online con Supabase Cloud + Modo Offline en Tablet):** Permite diligenciar formatos incluso en habitaciones o cubículos sin cobertura Wi-Fi y sincronizarlos con un clic al recuperar conexión.

---

## 2. Acceso al Sistema y Perfiles de Usuario

Al ingresar a la plataforma, se presenta la pantalla de autenticación institucional (o el selector rápido de rol en la barra superior para ambientes de demostración/capacitación).

### 2.1. Credenciales Institucionales Preconfiguradas

| Rol Clínico | Usuario | Contraseña | Permisos Principales |
| :--- | :--- | :--- | :--- |
| **Enfermería (Diligenciamiento)** | `enfermeria` | `Enfermeria2026*` | Diligenciar y firmar nuevos formatos, buscar en el historial, visualizar y exportar/imprimir PDF. **No puede** eliminar ni anular formatos. |
| **Consulta y Auditoría Clínica** | `consulta` | `Consulta2026*` | Consultar el historial clínico por cédula/nombre/fecha, verificar hashes de integridad y exportar/imprimir PDF. **Solo lectura.** |
| **Administrador (Calidad / Jurídica / TI)** | `admin` | `Admin2026*` | Todos los permisos anteriores + **Anular formatos con justificación auditable**, actualizar textos oficiales de la plantilla `FOR-ENF-HC-014`, consultar bitácora legal y exportar copias de seguridad JSON. |

---

## 3. Flujo Paso a Paso: Diligenciamiento de un Nuevo Formato (Rol Enfermería / Admin)

Diríjase a la pestaña **"1. Diligenciar Nuevo Formato"** en la barra de navegación superior.

> **Nota para pruebas rápidas:** En la esquina superior derecha del formulario encontrará los botones **"Cargar Caso Adulto"** y **"Cargar Caso Pediátrico (Con Acudiente)"** que autocompletan datos de ejemplo para entrenar al personal rápidamente.

### Paso 1: Encabezado Clínico y Datos del Paciente
1. **Sede / Servicio Hospitalario:** Seleccione el servicio donde ingresa el paciente (ej. *Urgencias Observación*, *Hospitalización Adultos Piso 3*, *Hospitalización Pediátrica*, *UCI*).
2. **Nombre Completo del Paciente:** Ingrese nombres y apellidos completos según documento.
3. **Tipo y Número de Documento:** Seleccione `CC`, `TI`, `RC`, `CE`, `PPT`, `PA`, `MS` o `AS` y digite el número sin puntos ni espacios.
4. **Edad (Años):** Ingrese la edad numérica del paciente.
5. **Diagnóstico / Motivo de Ingreso:** Describa brevemente el motivo clínico de hospitalización.
6. **Condición de Capacidad Legal:**
   - Si el paciente es **menor de 18 años** (`Edad < 18`) o usted marca la casilla **"Paciente con incapacidad / alteración de conciencia para firmar"**, el sistema **habilitará y exigirá automáticamente** la sección del **Acudiente o Representante Legal**.
   - Si el paciente es adulto capaz, deberá registrar su **Firma Digital del Paciente** en el recuadro táctil.

### Paso 2: Datos del Acudiente o Representante Legal *(Condicional)*
Esta sección es **obligatoria** cuando el paciente es menor de edad o incapaz para firmar:
1. Ingrese **Nombre Completo del Acudiente**, **Tipo y Número de Documento**, **Parentesco** (ej. *Madre*, *Padre*, *Cónyuge*) y **Teléfono de Contacto**.
2. Capture la **Firma del Acudiente Responsable** en el panel táctil.

### Paso 3: Los 3 Consentimientos Informados Independientes
Por normativa clínica, el paciente o su acudiente toma una decisión autónoma en cada uno de los **3 bloques**:

1. **Consentimiento 3.1 — Ingreso a Hospitalización:**
   - Lea el texto oficial aprobado por Calidad.
   - Seleccione **ACEPTO (Autorizo)** o **NO ACEPTO (Rechazo)**.
   - Capture la **firma específica** de este consentimiento (puede usar el botón *"Reutilizar firma del paciente/acudiente"* para agilizar tras confirmar su decisión).
2. **Consentimiento 3.2 — Procedimientos de Enfermería:**
   - Seleccione **ACEPTO** o **NO ACEPTO** y registre la firma correspondiente.
3. **Consentimiento 3.3 — Presencia de Estudiantes en Prácticas (Docencia-Servicio):**
   - El paciente puede aceptar la hospitalización y los procedimientos de enfermería, pero **rechazar** la presencia de estudiantes sin que ello afecte su atención médica.
   - Seleccione **ACEPTO** o **NO ACEPTO** y registre la firma correspondiente.

### Paso 4: Inventario y Recibo de Pertenencias
1. Haga clic en **"+ Agregar Pertenencia"** para registrar cada elemento físico que trae el paciente.
2. Por cada ítem indique:
   - **Elemento / Artículo** (ej. *Teléfono celular*, *Prótesis dental*, *Pijama*).
   - **Descripción / Estado** (ej. *Apagado con forro negro*, *En estuche plástico*).
   - **Cantidad**.
   - **Clasificación Hospitalaria:**
     - `APTA (Queda con paciente)`: Elementos permitidos en la habitación (ej. útiles de aseo, pijama).
     - `NO_APTA (Devolver a familiar)`: Joyas, dinero, equipos electrónicos, armas u objetos no permitidos en el servicio.
3. Registre el **Dinero en Efectivo Reportado ($ COP)** y las **Observaciones Generales**.
4. Registre el nombre y firma de **Quien Entrega las Pertenencias** y de **Quien Recibe en Enfermería**.

### Paso 5: Acta de Devolución de Pertenencias No Aptas *(Automática)*
- Si en el inventario existe **al menos un (1) artículo marcado como `NO_APTA`**, el sistema despliega automáticamente la sección **"Acta de Devolución de Pertenencias No Aptas"**.
- No es posible guardar el formato sin antes registrar los datos del familiar/acudiente que recibe dichos elementos (**Nombre**, **Documento**, **Parentesco**, **Observaciones** y **Firma de Recibido a Conformidad**).

### Paso 6: Autorización de Tratamiento de Datos (Ley 1581 de 2012) y Guardado Inmutable
1. Verifique y marque la casilla obligatoria de **Autorización de Tratamiento de Datos Personales y Sensibles (Habeas Data)**.
2. Haga clic en **"Firmar y Guardar Formato Clínico Inmutable"**.
3. El sistema:
   - Valida que no falte ningún campo ni firma obligatoria.
   - Calcula un **Hash Criptográfico SHA-256** único sobre todo el contenido y firmas (Ley 527 de 1999).
   - Guarda el registro en **Supabase PostgreSQL** (y en caché local cifrada).
   - Abre inmediatamente la vista previa oficial lista para imprimir o guardar en PDF.

---

## 4. Búsqueda, Consulta e Impresión de PDF (Todos los Roles)

Diríjase a la pestaña **"2. Historial y Búsqueda"**:

1. **Búsqueda Instantánea:** Escriba en el buscador el **número de cédula/documento**, **nombre del paciente**, **nombre del acudiente** o el **consecutivo** (ej. `FOR-CLI-2026-0001`).
2. **Filtros Rápidos:**
   - **Por Sede / Servicio:** Filtre los consentimientos de un piso o servicio específico.
   - **Por Estado Legal:** Todos, Vigentes (`SIGNED`) o Anulados (`ANNULLED`).
3. **Ver / Exportar PDF Oficial:**
   - Haga clic en el botón azul **"Ver / Imprimir PDF"** de cualquier registro.
   - Se abrirá el formato institucional `FOR-ENF-HC-014` con encabezado de calidad, datos del paciente/acudiente, los 3 consentimientos con sus firmas, tabla de pertenencias, acta de devolución y pie de firma electrónica con el **Hash SHA-256**.
   - Presione **"Imprimir / Guardar como PDF"** para generar el archivo PDF tamaño Carta/A4.

---

## 5. Anulación Justificada de un Formato (Exclusivo Rol Administrador)

En cumplimiento de la **Resolución 1995 de 1999**, **ningún formato firmado puede editarse ni eliminarse físicamente** de la base de datos (la base de datos PostgreSQL en Supabase cuenta con un *trigger* que bloquea cualquier `DELETE` o modificación de datos clínicos).

Si se cometió un error en el diligenciamiento:
1. Ingrese con el usuario **Administrador** (`admin` / `Admin2026*`).
2. Vaya a **"2. Historial y Búsqueda"** y ubique el formato.
3. Haga clic en el botón rojo **"Anular Formato"**.
4. Ingrese el **Motivo de Anulación Auditable** (mínimo 15 caracteres, ej. *"Error en selección de tipo de documento del paciente; se genera nuevo consecutivo FOR-CLI-2026-0003"*).
5. Confirme la anulación. El formato quedará marcado con sello rojo **`ANULADO`** conservando intacto su historial para auditoría, y se deberá diligenciar un nuevo formato correcto.

---

## 6. Modo Sin Conexión (Offline-First) y Sincronización con Supabase

El aplicativo está diseñado para funcionar en tablets hospitalarias incluso cuando se pierde la señal Wi-Fi:

1. **Indicador de Estado de Red (Barra Superior):**
   - **Botón Verde (`En Línea (Wi-Fi / Red)`):** Todos los formatos se guardan en tiempo real en **Supabase Cloud**.
   - **Botón Ámbar (`Modo Tablet Offline`):** Si la tablet pierde conexión (o si usted pulsa el botón para simular modo sin red), los nuevos formatos se guardan cifrados localmente con estado **`Pendiente Sincronizar`**.
2. **Sincronización con 1 Clic:**
   - Al recuperar la conexión, verá el botón **"Sincronizar (N)"** en la barra superior.
   - Al pulsarlo, todos los formatos pendientes se suben a **Supabase PostgreSQL** y quedan marcados como **`Sincronizado`** con registro en la bitácora de auditoría.

---

## 7. Panel de Gobernanza, Plantillas y Copias de Seguridad (Rol Administrador)

En la pestaña **"3. Gobernanza y Plantillas"**, el Coordinador de Calidad / TI (`admin`) dispone de:

1. **Checklist de Gobernanza Institucional:** Verificación de avales de Comité de Calidad (SGC), Oficina Jurídica, Seguridad TI y homologación con formato físico.
2. **Editor de Textos Oficiales (`FOR-ENF-HC-014`):** Permite actualizar el nombre/NIT de la clínica, código de calidad, versión y los textos legales de los 3 consentimientos y Habeas Data. Al guardar, se actualiza directamente en Supabase para todas las terminales.
3. **Exportar Copia de Seguridad (JSON):** Descarga un archivo `.json` completo con la plantilla vigente, todos los formatos firmados y la bitácora de auditoría.
4. **Bitácora de Auditoría Legal Inmutable:** Tabla cronológica que registra quién creó, firmó, exportó, sincronizó o anuló cada formato con fecha y hora exacta.
