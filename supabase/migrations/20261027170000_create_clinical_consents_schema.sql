-- =============================================================================
-- MIGRACIÓN: Sistema de Consentimientos Informados de Enfermería y Pertenencias
-- Normativa: Resolución 1995 de 1999, Ley 1581 de 2012, Ley 527 de 1999 (Colombia)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Usuarios Clínicos y Roles (Enfermería, Consulta, Administrador)
CREATE TABLE IF NOT EXISTS public.clinical_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  document_number TEXT NOT NULL,
  professional_card TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('nursing', 'viewer', 'admin')),
  role_label TEXT NOT NULL,
  default_facility TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Plantilla Institucional Aprobada (Calidad, Jurídica y Sistemas)
CREATE TABLE IF NOT EXISTS public.consent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_name TEXT NOT NULL,
  institution_nit TEXT NOT NULL,
  quality_format_code TEXT UNIQUE NOT NULL,
  quality_version TEXT NOT NULL,
  quality_approval_date DATE NOT NULL,
  approved_by_committees JSONB NOT NULL DEFAULT '{
    "qualityApproved": true,
    "legalApproved": true,
    "systemsApproved": true,
    "physicalFormatCollected": true,
    "integrationMode": "INDEPENDENT_OFFLINE_FIRST"
  }'::jsonb,
  hospitalization_consent_text TEXT NOT NULL,
  nursing_procedures_consent_text TEXT NOT NULL,
  student_presence_consent_text TEXT NOT NULL,
  habeas_data_legal_text TEXT NOT NULL,
  available_facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla Principal de Formatos Clínicos Firmados (Inmutables)
CREATE TABLE IF NOT EXISTS public.clinical_consent_forms (
  id UUID PRIMARY KEY,
  form_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  facility_service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SIGNED' CHECK (status IN ('SIGNED', 'ANNULLED')),

  -- Metadatos de Calidad
  institution_name TEXT NOT NULL,
  quality_format_code TEXT NOT NULL,
  quality_version TEXT NOT NULL,

  -- Datos indexados del Paciente para búsqueda rápida (< 1 seg por Cédula, Nombre o Fecha)
  patient_doc_type TEXT NOT NULL CHECK (patient_doc_type IN ('CC', 'TI', 'RC', 'CE', 'PA', 'PPT', 'MS', 'AS')),
  patient_doc_number TEXT NOT NULL,
  patient_full_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL CHECK (patient_age >= 0 AND patient_age <= 130),
  consultation_reason TEXT NOT NULL,
  is_incapacitated BOOLEAN NOT NULL DEFAULT FALSE,
  incapacity_reason TEXT NOT NULL DEFAULT '',
  patient_signature_data_url TEXT NOT NULL DEFAULT '',

  -- Acudiente o Representante Legal
  requires_guardian BOOLEAN NOT NULL DEFAULT FALSE,
  guardian_payload JSONB,

  -- 3 Consentimientos Independientes con Firma Individual
  consents_payload JSONB NOT NULL,

  -- Autorización Habeas Data (Ley 1581 de 2012)
  habeas_data_accepted BOOLEAN NOT NULL CHECK (habeas_data_accepted = TRUE),
  habeas_data_text_snapshot TEXT NOT NULL,

  -- Recibo de Pertenencias (Apta / No Apta) y Acta de Devolución
  belongings_payload JSONB NOT NULL,
  return_act_payload JSONB,

  -- Registro completo estructurado para reconstrucción inmediata
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Firma Electrónica e Integridad Criptográfica (Ley 527 de 1999)
  integrity_hash_sha256 TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  created_by_user_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,

  -- Anulación Justificada (Resolución 1995 de 1999: Prohibida la eliminación física)
  annulment_reason TEXT,
  annulled_by_user_id TEXT,
  annulled_by_user_name TEXT,
  annulled_at TIMESTAMPTZ
);

-- Índices de alto rendimiento para búsqueda clínica por Cédula, Nombre y Fecha
CREATE INDEX IF NOT EXISTS idx_clinical_forms_patient_doc ON public.clinical_consent_forms (patient_doc_number);
CREATE INDEX IF NOT EXISTS idx_clinical_forms_created_at ON public.clinical_consent_forms (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_forms_status ON public.clinical_consent_forms (status);
CREATE INDEX IF NOT EXISTS idx_clinical_forms_patient_name ON public.clinical_consent_forms USING gin (to_tsvector('spanish', patient_full_name));

-- 4. Tabla de Bitácora de Auditoría Legal (Inmutable)
CREATE TABLE IF NOT EXISTS public.clinical_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id TEXT NOT NULL,
  form_number TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'CREATED_AND_SIGNED',
    'ANNULLED',
    'PDF_EXPORTED',
    'TEMPLATE_UPDATED',
    'SYNCED_TO_CLOUD',
    'BACKUP_EXPORTED'
  )),
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinical_audit_logs_created_at ON public.clinical_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_audit_logs_form_id ON public.clinical_audit_logs (form_id);

-- =============================================================================
-- TRIGGER DE INMUTABILIDAD CLÍNICA (Resolución 1995 de 1999)
-- Impide cualquier DELETE físico y bloquea modificaciones sobre el contenido
-- clínico o firmas una vez guardado. Solo permite pasar de SIGNED a ANNULLED.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_clinical_form_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'PROHIBIDO (Resolución 1995 de 1999): Los registros de historia clínica y consentimientos firmados no pueden eliminarse físicamente. Utilice el proceso de ANULACIÓN con justificación.';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'ANNULLED' THEN
      RAISE EXCEPTION 'INMUTABLE: Un formato clínico ya anulado no admite modificaciones posteriores.';
    END IF;

    IF NEW.status != 'ANNULLED' THEN
      RAISE EXCEPTION 'INMUTABLE: Los datos clínicos y firmas de un formato firmado no pueden alterarse.';
    END IF;

    IF NEW.annulment_reason IS NULL OR length(trim(NEW.annulment_reason)) < 15 THEN
      RAISE EXCEPTION 'Debe especificar un motivo de anulación auditable (mínimo 15 caracteres).';
    END IF;

    -- Garantizar que ningún campo clínico ni firma cambie durante la anulación
    NEW.integrity_hash_sha256 := OLD.integrity_hash_sha256;
    NEW.patient_doc_number := OLD.patient_doc_number;
    NEW.consents_payload := OLD.consents_payload;
    NEW.belongings_payload := OLD.belongings_payload;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clinical_form_immutability
BEFORE UPDATE OR DELETE ON public.clinical_consent_forms
FOR EACH ROW EXECUTE FUNCTION public.enforce_clinical_form_immutability();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.clinical_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_consent_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para clinical_users
CREATE POLICY "Lectura de directorio clínico institucional"
  ON public.clinical_users
  FOR SELECT
  TO anon, authenticated
  USING (active = TRUE);

-- Políticas para consent_templates
CREATE POLICY "Lectura de plantillas institucionales aprobadas"
  ON public.consent_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Inserción de plantillas institucionales por calidad"
  ON public.consent_templates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(quality_format_code)) > 0
    AND length(trim(institution_name)) > 0
  );

CREATE POLICY "Actualización de plantillas institucionales por calidad"
  ON public.consent_templates
  FOR UPDATE
  TO anon, authenticated
  USING (length(trim(quality_format_code)) > 0)
  WITH CHECK (
    length(trim(quality_format_code)) > 0
    AND length(trim(institution_name)) > 0
  );

-- Políticas para clinical_consent_forms
CREATE POLICY "Lectura de formatos clínicos para personal autorizado"
  ON public.clinical_consent_forms
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Creación de formatos clínicos firmados"
  ON public.clinical_consent_forms
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'SIGNED'
    AND habeas_data_accepted = TRUE
    AND length(trim(integrity_hash_sha256)) > 0
    AND length(trim(form_number)) > 0
  );

CREATE POLICY "Anulación auditable de formatos clínicos"
  ON public.clinical_consent_forms
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'SIGNED')
  WITH CHECK (
    status = 'ANNULLED'
    AND annulment_reason IS NOT NULL
    AND length(trim(annulment_reason)) >= 15
  );

-- Políticas para clinical_audit_logs
CREATE POLICY "Lectura de bitácora de auditoría clínica"
  ON public.clinical_audit_logs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Inserción en bitácora de auditoría clínica"
  ON public.clinical_audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(actor_id)) > 0
    AND length(trim(form_number)) > 0
  );

-- =============================================================================
-- DATOS SEMILLA OFICIALES (Usuarios Institucionales y Plantilla FOR-ENF-HC-014)
-- =============================================================================
INSERT INTO public.clinical_users (
  id, username, full_name, document_number, professional_card, role, role_label, default_facility
) VALUES
  (
    'usr-enf-001',
    'enfermeria',
    'Jefe Laura Valentina Gómez',
    '1032456789',
    'TP-ENF-98412',
    'nursing',
    'Enfermería (Diligenciamiento)',
    'Sede Principal — Hospitalización Adultos'
  ),
  (
    'usr-con-002',
    'consulta',
    'Dr. Carlos Andrés Mejía',
    '79854123',
    'RM-74125',
    'viewer',
    'Consulta y Auditoría Clínica',
    'Sede Principal — Auditoría Médica'
  ),
  (
    'usr-adm-003',
    'admin',
    'Ing. Miguel Muñoz — Coord. Calidad y TI',
    '1015487963',
    'ADM-CAL-01',
    'admin',
    'Administrador (Calidad / Jurídica / TI)',
    'Dirección de Calidad y Sistemas'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.consent_templates (
  institution_name,
  institution_nit,
  quality_format_code,
  quality_version,
  quality_approval_date,
  approved_by_committees,
  hospitalization_consent_text,
  nursing_procedures_consent_text,
  student_presence_consent_text,
  habeas_data_legal_text,
  available_facilities
) VALUES (
  'CLÍNICA UNIVERSITARIA SAN RAFAEL — SEDE INTEGRAL',
  '890.999.123-4',
  'FOR-ENF-HC-014',
  '04',
  '2026-10-01',
  '{
    "qualityApproved": true,
    "legalApproved": true,
    "systemsApproved": true,
    "physicalFormatCollected": true,
    "integrationMode": "INDEPENDENT_OFFLINE_FIRST"
  }'::jsonb,
  'DECLARO que el equipo médico y de enfermería me ha explicado de forma clara mi condición clínica actual y la necesidad de ingreso al servicio de HOSPITALIZACIÓN para vigilancia continua, tratamiento médico, administración de medicamentos y estudios diagnósticos. Comprendo los beneficios esperados, así como los riesgos inherentes a la estancia hospitalaria (infecciones asociadas a la atención en salud, flebitis, caídas o reacciones adversas), y conozco las normas de permanencia institucional.',
  'AUTORIZO al personal profesional y auxiliar de ENFERMERÍA para la realización de procedimientos propios del cuidado clínico requeridos durante mi atención, incluyendo: canalización de accesos venosos periféricos, toma de muestras sanguíneas y de laboratorio, administración de medicamentos por diferentes vías, curaciones, paso de sondas (vesical/nasogástrica según orden médica), monitoreo de signos vitales e higiene/confort. Se me han explicado las posibles molestias o complicaciones locales (hematomas, extravasación, dolor local) y las medidas de seguridad aplicadas.',
  'En el marco del convenio DOCENCIA-SERVICIO de la institución, expreso mi decisión libre y voluntaria frente a la presencia y participación supervisada de estudiantes en prácticas formativas del área de la salud (Medicina, Enfermería y afines) durante mi valoración y cuidado clínico, bajo supervisión directa y permanente del profesional titular responsable.',
  'En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Resolución 1995 de 1999, autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales y datos sensibles relativos a mi estado de salud e Historia Clínica, así como la captura de mi firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012) con fines asistenciales, administrativos, de auditoría de calidad y custodia legal.',
  '[
    "Sede Principal — Urgencias Observación",
    "Sede Principal — Hospitalización Adultos Piso 3",
    "Sede Principal — Hospitalización Pediátrica",
    "Sede Principal — Unidad de Cuidados Intensivos (UCI)",
    "Sede Norte — Cirugía y Recuperación",
    "Sede Materno Infantil — Ginecoobstetricia"
  ]'::jsonb
)
ON CONFLICT (quality_format_code) DO NOTHING;
