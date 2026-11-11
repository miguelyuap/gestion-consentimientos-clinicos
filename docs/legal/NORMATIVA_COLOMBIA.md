# Marco Legal y Cumplimiento Normativo en Salud (Colombia)

Este documento detalla cómo la arquitectura de **Gestión de Consentimientos Clínicos** da cumplimiento técnico y jurídico a la normativa colombiana vigente:

---

## 1. Ley 1581 de 2012 y Decreto 1377 de 2013 (Protección de Datos Personales y Datos Sensibles)
- **Categoría de Datos:** Los datos de salud e historia clínica son **Datos Sensibles** (Art. 5, Ley 1581 de 2012).
- **Implementación en el Sistema:**
  - Inclusión de cláusula explícita de autorización de tratamiento de datos personales y sensibles en el formato.
  - Control de acceso basado en roles (**RBAC**) y políticas **Row Level Security (RLS)** en base de datos.
  - Cifrado en tránsito (TLS 1.3) y en reposo (AES-256 en Supabase PostgreSQL).

## 2. Resolución 1995 de 1999 y Ley 2015 de 2020 (Manejo y Conservación de Historia Clínica)
- **Características Obligatorias:** Integralidad, Secuencialidad, Racionalidad Científica, Disponibilidad y Oportunidad.
- **Intangibilidad / Inmutabilidad:** Los anexos de la historia clínica (como los consentimientos informados) no pueden tener tachones, enmendaduras ni modificaciones posteriores a su diligenciamiento.
- **Implementación en el Sistema:**
  - Consecutivo único secuencial y fecha/hora automática inalterable.
  - Bloqueo total de edición una vez firmado el formato.
  - Anulación justificada sin borrado físico (`DELETE` prohibido por políticas RLS y triggers de base de datos), conservando el documento anulado en el historial clínico del paciente para trazabilidad legal.

## 3. Ley 527 de 1999 y Decreto 2364 de 2012 (Validez de la Firma Electrónica)
- **Requisitos de Confiabilidad y Apropiabilidad (Art. 4, Decreto 2364 de 2012):**
  1. Los datos de creación de la firma corresponden exclusivamente al firmante.
  2. Es posible detectar cualquier alteración no autorizada del mensaje de datos hecha después del momento de la firma.
- **Implementación en el Sistema:**
  - Captura del grafo biométrico (trazo en lienzo digital), fecha y hora exacta (ISO-8601), usuario autenticado que asiste el proceso, rol e identificación del firmante (paciente, acudiente o funcionario).
  - Generación de **Huella Digital Criptográfica (Hash SHA-256)** impresa en el pie de página del PDF y almacenada en base de datos, permitiendo verificar matemáticamente que ningún carácter del consentimiento o del inventario de pertenencias fue modificado tras la firma.
