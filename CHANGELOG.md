# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

## [1.0.0] - 2026-10-27

### Added
- Inicialización del proyecto desde `gst-template-nextjs` de `gst-software-platform`.
- Esquema de validación clínica con **Zod** incluyendo regla automática de acudiente obligatorio para menores de 18 años o pacientes incapaces/inconscientes.
- Tres consentimientos informados independientes (Hospitalización, Procedimientos de Enfermería, Presencia de Estudiantes en Prácticas) con textos parametrizables, aceptación/rechazo y firma individual.
- Módulo de Recibo de Pertenencias con lista dinámica, clasificación "Apta" / "No Apta", monto en efectivo y generación automática de Acta de Devolución para elementos no aptos.
- Componente de captura de firma digital táctil (`SignaturePad`) compatible con dedo, lápiz óptico y mouse.
- Motor de almacenamiento Offline-First con cola de sincronización y generación de hash de integridad SHA-256.
- Vista imprimible y exportable a PDF con diseño de formato hospitalario oficial.
- Control de roles (Enfermería, Consulta, Administrador), bitácora de trazabilidad y anulación con justificación obligatoria (prohibida la edición post-firma).
- Migración SQL para Supabase PostgreSQL con políticas Row Level Security (RLS).
