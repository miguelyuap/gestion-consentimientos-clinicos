# Requerimientos, Historias de Usuario y Definition of Ready (DoR)

Este documento consolida los requisitos funcionales, no funcionales, legales y la lista de chequeo previa al despliegue institucional.

---

## 1. Lista de Chequeo Pre-Despliegue Institucional ("Antes de Desarrollar / Salir a Producción")

- [ ] **Autorización Institucional:** Aval formal de los comités de **Calidad**, **Jurídica** y **Sistemas / TI** para el tratamiento de datos sensibles de pacientes.
- [ ] **Formato Físico y Textos Oficiales:** Carga en el módulo de Administración de los textos definitivos aprobados por Calidad/Jurídica y código/versión vigente del formato físico en el Sistema de Gestión de Calidad (SGC).
- [ ] **Estrategia de Integración HIS:** Operación inicial en modo **Independiente (Supabase + Offline Sync)** con contratos de datos listos para futura interoperabilidad vía API REST / HL7 FHIR.

---

## 2. Historias de Usuario Principales (Formato GST-SOFTWARE DoR)

### HU-01: Diligenciamiento de Formato con Validación de Paciente y Acudiente
- **Como** profesional o auxiliar de Enfermería,
- **Quiero** registrar los datos del paciente y que el sistema active obligatoriamente los campos del acudiente cuando el paciente sea menor de 18 años o incapaz de firmar,
- **Para** garantizar la validez jurídica del consentimiento informado.
- **Criterios de Aceptación:**
  - *Dado* que la edad ingresada es `< 18` o se activa el interruptor `"Paciente incapaz / sin competencia para firmar"`, *cuando* intento guardar el formato sin nombre, documento, parentesco, teléfono o firma del acudiente, *entonces* el validador Zod impide el guardado y señala los campos faltantes.

### HU-02: Consentimientos Informados Independientes
- **Como** paciente o acudiente responsable,
- **Quiero** leer, aceptar o rechazar de manera independiente la Hospitalización, los Procedimientos de Enfermería y la Presencia de Estudiantes en Prácticas, firmando cada decisión,
- **Para** ejercer mi autonomía sobre cada acto asistencial y docente.

### HU-03: Recibo de Pertenencias y Acta de Devolución de Elementos No Aptos
- **Como** personal de Enfermería,
- **Quiero** inventariar las pertenencias del paciente clasificándolas como `"Apta"` o `"No Apta"`, registrar dinero en efectivo y generar el acta de devolución para los ítems `"No Aptos"`,
- **Para** dejar constancia firmada por quien entrega y quien recibe, previniendo pérdidas o reclamos.

### HU-04: Inmutabilidad, Trazabilidad y Anulación Justificada
- **Como** Auditor de Calidad / Administrador Clínico,
- **Quiero** que ningún formato firmado pueda ser editado ni eliminado, permitiendo únicamente su anulación con motivo justificado y huella de auditoría,
- **Para** cumplir con la Resolución 1995 de 1999 sobre intangibilidad e integridad de la Historia Clínica.
