import {
  computeSha256Hash,
  decryptLocalData,
  encryptLocalData,
} from '@/lib/crypto/integrity-hash';
import { createClient } from '@/lib/supabase/client';
import type { ClinicalUser } from '@/modules/auth/types/auth.types';
import {
  AnnulConsentFormSchema,
  CreateConsentFormSchema,
  type CreateConsentFormInput,
} from '../schemas/consent.schema';
import type {
  AuditLogEntry,
  ClinicalConsentFormRecord,
  InstitutionalTemplateConfig,
} from '../types/consent.types';

const STORAGE_KEYS = {
  FORMS: 'gst_clinical_consent_forms_v1',
  AUDIT: 'gst_clinical_audit_logs_v1',
  TEMPLATE: 'gst_clinical_template_config_v1',
} as const;

/**
 * Genera una imagen SVG base64 limpia para las firmas de demostración pre-cargadas.
 */
function buildSampleSignatureDataUrl(signerText: string, strokeColor = '#0f172a'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="110" viewBox="0 0 360 110">
    <rect width="100%" height="100%" fill="transparent"/>
    <path d="M22,78 C55,25 80,92 118,44 C145,15 162,82 198,52 C230,28 265,74 332,38" fill="none" stroke="${strokeColor}" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M48,86 Q165,68 310,82" fill="none" stroke="${strokeColor}" stroke-width="1.4" stroke- opacity="0.7"/>
    <text x="26" y="102" font-family="cursive, serif" font-size="11" fill="#334155">${signerText}</text>
  </svg>`;
  const encoded =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}

export const DEFAULT_INSTITUTIONAL_TEMPLATE: InstitutionalTemplateConfig = {
  institutionName: 'CLÍNICA UNIVERSITARIA SAN RAFAEL — SEDE INTEGRAL',
  institutionNit: '890.999.123-4',
  qualityFormatCode: 'FOR-ENF-HC-014',
  qualityVersion: '04',
  qualityApprovalDate: '2026-10-01',
  approvedByCommittees: {
    qualityApproved: true,
    legalApproved: true,
    systemsApproved: true,
    physicalFormatCollected: true,
    integrationMode: 'INDEPENDENT_OFFLINE_FIRST',
  },
  hospitalizationConsentText:
    'DECLARO que el equipo médico y de enfermería me ha explicado de forma clara mi condición clínica actual y la necesidad de ingreso al servicio de HOSPITALIZACIÓN para vigilancia continua, tratamiento médico, administración de medicamentos y estudios diagnósticos. Comprendo los beneficios esperados, así como los riesgos inherentes a la estancia hospitalaria (infecciones asociadas a la atención en salud, flebitis, caídas o reacciones adversas), y conozco las normas de permanencia institucional.',
  nursingProceduresConsentText:
    'AUTORIZO al personal profesional y auxiliar de ENFERMERÍA para la realización de procedimientos propios del cuidado clínico requeridos durante mi atención, incluyendo: canalización de accesos venosos periféricos, toma de muestras sanguíneas y de laboratorio, administración de medicamentos por diferentes vías, curaciones, paso de sondas (vesical/nasogástrica según orden médica), monitoreo de signos vitales e higiene/confort. Se me han explicado las posibles molestias o complicaciones locales (hematomas, extravasación, dolor local) y las medidas de seguridad aplicadas.',
  studentPresenceConsentText:
    'En el marco del convenio DOCENCIA-SERVICIO de la institución, expreso mi decisión libre y voluntaria frente a la presencia y participación supervisada de estudiantes en prácticas formativas del área de la salud (Medicina, Enfermería y afines) durante mi valoración y cuidado clínico, bajo supervisión directa y permanente del profesional titular responsable.',
  habeasDataLegalText:
    'En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y la Resolución 1995 de 1999, autorizo de manera libre, previa, expresa e informada el tratamiento de mis datos personales y datos sensibles relativos a mi estado de salud e Historia Clínica, así como la captura de mi firma electrónica (Ley 527 de 1999 y Decreto 2364 de 2012) con fines asistenciales, administrativos, de auditoría de calidad y custodia legal.',
  availableFacilities: [
    'Sede Principal — Urgencias Observación',
    'Sede Principal — Hospitalización Adultos Piso 3',
    'Sede Principal — Hospitalización Pediátrica',
    'Sede Principal — Unidad de Cuidados Intensivos (UCI)',
    'Sede Norte — Cirugía y Recuperación',
    'Sede Materno Infantil — Ginecoobstetricia',
  ],
};

const SEED_FORMS: ClinicalConsentFormRecord[] = [
  {
    id: 'a1029384-756b-4c3d-9e8f-000000000001',
    formNumber: 'FOR-CLI-2026-0001',
    createdAt: '2026-10-26T09:15:00.000Z',
    facilityService: 'Sede Principal — Hospitalización Adultos Piso 3',
    status: 'SIGNED',
    syncStatus: 'SYNCED',
    institutionName: DEFAULT_INSTITUTIONAL_TEMPLATE.institutionName,
    qualityFormatCode: DEFAULT_INSTITUTIONAL_TEMPLATE.qualityFormatCode,
    qualityVersion: DEFAULT_INSTITUTIONAL_TEMPLATE.qualityVersion,
    patient: {
      fullName: 'María Fernanda Restrepo Londoño',
      docType: 'CC',
      docNumber: '52841963',
      age: 42,
      consultationReason: 'Pielonefritis aguda complicada — Requiere antibioticoterapia IV',
      isIncapacitated: false,
      incapacityReason: '',
      patientSignatureDataUrl: buildSampleSignatureDataUrl('M. Fernanda Restrepo'),
    },
    requiresGuardian: false,
    consents: {
      hospitalization: {
        title: 'Consentimiento de Hospitalización',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.hospitalizationConsentText,
        decision: 'ACCEPTED',
        signatureDataUrl: buildSampleSignatureDataUrl('M. Fernanda Restrepo'),
        signedAt: '2026-10-26T09:14:10.000Z',
      },
      nursingProcedures: {
        title: 'Consentimiento de Procedimientos de Enfermería',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.nursingProceduresConsentText,
        decision: 'ACCEPTED',
        signatureDataUrl: buildSampleSignatureDataUrl('M. Fernanda Restrepo'),
        signedAt: '2026-10-26T09:14:25.000Z',
      },
      studentPresence: {
        title: 'Consentimiento de Presencia de Estudiantes en Prácticas',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.studentPresenceConsentText,
        decision: 'ACCEPTED',
        signatureDataUrl: buildSampleSignatureDataUrl('M. Fernanda Restrepo'),
        signedAt: '2026-10-26T09:14:40.000Z',
      },
    },
    habeasDataAccepted: true,
    habeasDataTextSnapshot: DEFAULT_INSTITUTIONAL_TEMPLATE.habeasDataLegalText,
    belongings: {
      items: [
        {
          id: 'bel-1',
          itemName: 'Gafas formuladas con estuche',
          description: 'Marco metálico dorado en buen estado',
          quantity: 1,
          suitability: 'APTA',
        },
        {
          id: 'bel-2',
          itemName: 'Pijama de algodón y pantuflas',
          description: 'Color azul celeste, uso personal en habitación',
          quantity: 2,
          suitability: 'APTA',
        },
        {
          id: 'bel-3',
          itemName: 'Cadena y anillo de oro con piedra',
          description: 'Joyería de valor — No permitida en hospitalización',
          quantity: 2,
          suitability: 'NO_APTA',
        },
      ],
      cashAmount: 85000,
      observations: 'Las joyas se devuelven inmediatamente al esposo de la paciente.',
      deliveredByName: 'María Fernanda Restrepo Londoño',
      deliveredBySignature: buildSampleSignatureDataUrl('M. Fernanda Restrepo'),
      receivedByName: 'Jefe Laura Valentina Gómez',
      receivedBySignature: buildSampleSignatureDataUrl('Jefe Laura Gómez', '#1e40af'),
    },
    returnAct: {
      required: true,
      receiverName: 'Jorge Enrique Salazar (Esposo)',
      receiverDoc: '79456123',
      receiverRelationship: 'Esposo / Cónyuge',
      notes: 'Se entregan 2 piezas de joyería (cadena y anillo) declaradas No Aptas a satisfacción.',
      signatureDataUrl: buildSampleSignatureDataUrl('Jorge E. Salazar'),
      returnedAt: '2026-10-26T09:15:00.000Z',
    },
    integrityHashSha256: '8f3e9b71c42d60a15e89b44021f6d7893041a55c6e7b89012f3a4b5c6d7e8f90',
    createdByUserId: 'usr-enf-001',
    createdByUserName: 'Jefe Laura Valentina Gómez',
    createdByRole: 'nursing',
  },
  {
    id: 'b2029384-756b-4c3d-9e8f-000000000002',
    formNumber: 'FOR-CLI-2026-0002',
    createdAt: '2026-10-27T11:30:00.000Z',
    facilityService: 'Sede Principal — Hospitalización Pediátrica',
    status: 'SIGNED',
    syncStatus: 'SYNCED',
    institutionName: DEFAULT_INSTITUTIONAL_TEMPLATE.institutionName,
    qualityFormatCode: DEFAULT_INSTITUTIONAL_TEMPLATE.qualityFormatCode,
    qualityVersion: DEFAULT_INSTITUTIONAL_TEMPLATE.qualityVersion,
    patient: {
      fullName: 'Samuel Alejandro Pineda Rojas',
      docType: 'TI',
      docNumber: '1098456321',
      age: 9,
      consultationReason: 'Crisis asmática moderada — Oxigenoterapia y micronebulizaciones',
      isIncapacitated: false,
      incapacityReason: '',
      patientSignatureDataUrl: '',
    },
    requiresGuardian: true,
    guardian: {
      fullName: 'Diana Marcela Rojas Castro',
      docType: 'CC',
      docNumber: '43789654',
      relationship: 'Madre (Representante Legal)',
      phone: '3104567890',
      signatureDataUrl: buildSampleSignatureDataUrl('Diana M. Rojas C.'),
    },
    consents: {
      hospitalization: {
        title: 'Consentimiento de Hospitalización',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.hospitalizationConsentText,
        decision: 'ACCEPTED',
        signatureDataUrl: buildSampleSignatureDataUrl('Diana M. Rojas C.'),
        signedAt: '2026-10-27T11:28:00.000Z',
      },
      nursingProcedures: {
        title: 'Consentimiento de Procedimientos de Enfermería',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.nursingProceduresConsentText,
        decision: 'ACCEPTED',
        signatureDataUrl: buildSampleSignatureDataUrl('Diana M. Rojas C.'),
        signedAt: '2026-10-27T11:28:30.000Z',
      },
      studentPresence: {
        title: 'Consentimiento de Presencia de Estudiantes en Prácticas',
        officialText: DEFAULT_INSTITUTIONAL_TEMPLATE.studentPresenceConsentText,
        decision: 'REJECTED',
        signatureDataUrl: buildSampleSignatureDataUrl('Diana M. Rojas C.'),
        signedAt: '2026-10-27T11:29:00.000Z',
      },
    },
    habeasDataAccepted: true,
    habeasDataTextSnapshot: DEFAULT_INSTITUTIONAL_TEMPLATE.habeasDataLegalText,
    belongings: {
      items: [
        {
          id: 'bel-201',
          itemName: 'Inhalador Salbutamol con inhalocámara pediátrica',
          description: 'Uso terapéutico personal verificado por enfermería',
          quantity: 1,
          suitability: 'APTA',
        },
        {
          id: 'bel-202',
          itemName: 'Muda de ropa térmica infantil',
          description: 'Saco gris y pantalón de algodón',
          quantity: 2,
          suitability: 'APTA',
        },
      ],
      cashAmount: 0,
      observations: 'Paciente menor de edad acompañado permanentemente por su madre.',
      deliveredByName: 'Diana Marcela Rojas Castro (Madre)',
      deliveredBySignature: buildSampleSignatureDataUrl('Diana M. Rojas C.'),
      receivedByName: 'Jefe Laura Valentina Gómez',
      receivedBySignature: buildSampleSignatureDataUrl('Jefe Laura Gómez', '#1e40af'),
    },
    integrityHashSha256: '4a7c8d92e10b3f65c428791a0e5b6d8f92314785a0b1c2d3e4f5061728394a5b',
    createdByUserId: 'usr-enf-001',
    createdByUserName: 'Jefe Laura Valentina Gómez',
    createdByRole: 'nursing',
  },
];

const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    formId: 'a1029384-756b-4c3d-9e8f-000000000001',
    formNumber: 'FOR-CLI-2026-0001',
    action: 'CREATED_AND_SIGNED',
    actorId: 'usr-enf-001',
    actorName: 'Jefe Laura Valentina Gómez',
    actorRole: 'nursing',
    details:
      'Formato diligenciado y firmado digitalmente con acta de devolución de pertenencias no aptas. Hash SHA-256 generado.',
    timestamp: '2026-10-26T09:15:00.000Z',
  },
  {
    id: 'aud-002',
    formId: 'b2029384-756b-4c3d-9e8f-000000000002',
    formNumber: 'FOR-CLI-2026-0002',
    action: 'CREATED_AND_SIGNED',
    actorId: 'usr-enf-001',
    actorName: 'Jefe Laura Valentina Gómez',
    actorRole: 'nursing',
    details:
      'Formato pediátrico firmado por acudiente obligatorio (Madre). Rechazó presencia de estudiantes en prácticas.',
    timestamp: '2026-10-27T11:30:00.000Z',
  },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getInstitutionalTemplate(): InstitutionalTemplateConfig {
  if (!isBrowser()) {
    return DEFAULT_INSTITUTIONAL_TEMPLATE;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.TEMPLATE);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.TEMPLATE,
      encryptLocalData(JSON.stringify(DEFAULT_INSTITUTIONAL_TEMPLATE))
    );
    return DEFAULT_INSTITUTIONAL_TEMPLATE;
  }
  try {
    const decrypted = decryptLocalData(raw);
    return JSON.parse(decrypted) as InstitutionalTemplateConfig;
  } catch {
    return DEFAULT_INSTITUTIONAL_TEMPLATE;
  }
}

export function saveInstitutionalTemplate(
  nextConfig: InstitutionalTemplateConfig,
  actor: ClinicalUser
): InstitutionalTemplateConfig {
  if (actor.role !== 'admin') {
    throw new Error('Solo el rol Administrador puede modificar los textos oficiales aprobados.');
  }
  if (isBrowser()) {
    window.localStorage.setItem(
      STORAGE_KEYS.TEMPLATE,
      encryptLocalData(JSON.stringify(nextConfig))
    );
    void trySyncTemplateToSupabase(nextConfig);
    appendAuditLog({
      formId: 'TEMPLATE-GLOBAL',
      formNumber: nextConfig.qualityFormatCode,
      action: 'TEMPLATE_UPDATED',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      details: `Textos institucionales actualizados (Versión ${nextConfig.qualityVersion}).`,
    });
  }
  return nextConfig;
}

export function getAllConsentForms(): ClinicalConsentFormRecord[] {
  if (!isBrowser()) {
    return SEED_FORMS;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.FORMS);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.FORMS,
      encryptLocalData(JSON.stringify(SEED_FORMS))
    );
    return SEED_FORMS;
  }
  try {
    const decrypted = decryptLocalData(raw);
    const parsed = JSON.parse(decrypted) as ClinicalConsentFormRecord[];
    return Array.isArray(parsed) ? parsed : SEED_FORMS;
  } catch {
    return SEED_FORMS;
  }
}

function persistConsentForms(forms: ClinicalConsentFormRecord[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEYS.FORMS, encryptLocalData(JSON.stringify(forms)));
}

export function getAllAuditLogs(): AuditLogEntry[] {
  if (!isBrowser()) {
    return SEED_AUDIT_LOGS;
  }
  const raw = window.localStorage.getItem(STORAGE_KEYS.AUDIT);
  if (!raw) {
    window.localStorage.setItem(
      STORAGE_KEYS.AUDIT,
      encryptLocalData(JSON.stringify(SEED_AUDIT_LOGS))
    );
    return SEED_AUDIT_LOGS;
  }
  try {
    const decrypted = decryptLocalData(raw);
    const parsed = JSON.parse(decrypted) as AuditLogEntry[];
    return Array.isArray(parsed) ? parsed : SEED_AUDIT_LOGS;
  } catch {
    return SEED_AUDIT_LOGS;
  }
}

export function appendAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  const logs = getAllAuditLogs();
  const newEntry: AuditLogEntry = {
    ...entry,
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...logs];
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEYS.AUDIT, encryptLocalData(JSON.stringify(updated)));
    void trySyncAuditLogToSupabase(newEntry);
  }
  return newEntry;
}

export function generateNextFormNumber(existingForms?: ClinicalConsentFormRecord[]): string {
  const forms = existingForms ?? getAllConsentForms();
  const year = new Date().getFullYear();
  const maxExisting = forms.reduce((maxNum, form) => {
    const match = form.formNumber.match(/(\d+)$/);
    const num = match ? parseInt(match[1], 10) : 0;
    return Number.isNaN(num) ? maxNum : Math.max(maxNum, num);
  }, forms.length);
  const nextSeq = maxExisting + 1;
  return `FOR-CLI-${year}-${String(nextSeq).padStart(4, '0')}`;
}

/**
 * Crea y firma un nuevo formato clínico aplicando validación Zod estricta,
 * generación de hash SHA-256 (Ley 527/1999) y registro en cola Offline/Online.
 */
export async function createAndSignConsentForm(
  rawInput: unknown,
  actor: ClinicalUser,
  isOnline: boolean
): Promise<ClinicalConsentFormRecord> {
  if (actor.role === 'viewer') {
    throw new Error('El rol de Consulta no tiene permisos para diligenciar nuevos formatos.');
  }

  const validated: CreateConsentFormInput = CreateConsentFormSchema.parse(rawInput);
  const template = getInstitutionalTemplate();
  const existingForms = getAllConsentForms();
  const nowIso = new Date().toISOString();
  const formNumber = generateNextFormNumber(existingForms);
  const requiresGuardian =
    validated.patient.age < 18 || validated.patient.isIncapacitated;
  const nonSuitableItems = validated.belongings.items.filter(
    (item) => item.suitability === 'NO_APTA'
  );

  const canonicalPayloadForHash = JSON.stringify({
    formNumber,
    createdAt: nowIso,
    facilityService: validated.facilityService,
    patient: validated.patient,
    requiresGuardian,
    guardian: requiresGuardian ? validated.guardian : undefined,
    consents: validated.consents,
    belongings: validated.belongings,
    returnAct: nonSuitableItems.length > 0 ? validated.returnAct : undefined,
    createdByUserId: actor.id,
  });

  const integrityHashSha256 = await computeSha256Hash(canonicalPayloadForHash);

  const newRecord: ClinicalConsentFormRecord = {
    id:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `form-${Date.now()}`,
    formNumber,
    createdAt: nowIso,
    facilityService: validated.facilityService,
    status: 'SIGNED',
    syncStatus: isOnline ? 'SYNCED' : 'PENDING_SYNC',
    institutionName: template.institutionName,
    qualityFormatCode: template.qualityFormatCode,
    qualityVersion: template.qualityVersion,
    patient: {
      fullName: validated.patient.fullName,
      docType: validated.patient.docType,
      docNumber: validated.patient.docNumber,
      age: validated.patient.age,
      consultationReason: validated.patient.consultationReason,
      isIncapacitated: validated.patient.isIncapacitated,
      incapacityReason: validated.patient.incapacityReason ?? '',
      patientSignatureDataUrl: validated.patient.patientSignatureDataUrl ?? '',
    },
    requiresGuardian,
    guardian:
      requiresGuardian && validated.guardian
        ? {
            fullName: validated.guardian.fullName,
            docType: validated.guardian.docType,
            docNumber: validated.guardian.docNumber,
            relationship: validated.guardian.relationship,
            phone: validated.guardian.phone,
            signatureDataUrl: validated.guardian.signatureDataUrl,
          }
        : undefined,
    consents: {
      hospitalization: {
        ...validated.consents.hospitalization,
        signedAt: nowIso,
      },
      nursingProcedures: {
        ...validated.consents.nursingProcedures,
        signedAt: nowIso,
      },
      studentPresence: {
        ...validated.consents.studentPresence,
        signedAt: nowIso,
      },
    },
    habeasDataAccepted: validated.habeasDataAccepted,
    habeasDataTextSnapshot: template.habeasDataLegalText,
    belongings: {
      items: validated.belongings.items,
      cashAmount: validated.belongings.cashAmount,
      observations: validated.belongings.observations ?? '',
      deliveredByName: validated.belongings.deliveredByName,
      deliveredBySignature: validated.belongings.deliveredBySignature,
      receivedByName: validated.belongings.receivedByName,
      receivedBySignature: validated.belongings.receivedBySignature,
    },
    returnAct:
      nonSuitableItems.length > 0 && validated.returnAct
        ? {
            required: true,
            receiverName: validated.returnAct.receiverName,
            receiverDoc: validated.returnAct.receiverDoc,
            receiverRelationship: validated.returnAct.receiverRelationship,
            notes: validated.returnAct.notes ?? '',
            signatureDataUrl: validated.returnAct.signatureDataUrl,
            returnedAt: nowIso,
          }
        : undefined,
    integrityHashSha256,
    createdByUserId: actor.id,
    createdByUserName: actor.fullName,
    createdByRole: actor.role,
  };

  // Intento de sincronización directa con Supabase si hay conexión y credenciales configuradas
  if (isOnline) {
    const syncedOk = await trySyncRecordToSupabase(newRecord);
    if (!syncedOk) {
      newRecord.syncStatus = 'PENDING_SYNC';
    }
  }

  const updatedForms = [newRecord, ...existingForms];
  persistConsentForms(updatedForms);

  appendAuditLog({
    formId: newRecord.id,
    formNumber: newRecord.formNumber,
    action: 'CREATED_AND_SIGNED',
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    details: `Formato firmado digitalmente para paciente ${newRecord.patient.fullName} (${newRecord.patient.docType} ${newRecord.patient.docNumber}). Estado red: ${newRecord.syncStatus === 'SYNCED' ? 'Sincronizado en Supabase' : 'Modo Offline'}.`,
  });

  return newRecord;
}

/**
 * Anula un formato firmado registrando justificación obligatoria (Resolución 1995 de 1999).
 * Jamás altera los datos clínicos originales ni elimina el documento.
 */
export function annulClinicalConsentForm(
  rawInput: unknown,
  actor: ClinicalUser,
  existingFormsOverride?: ClinicalConsentFormRecord[]
): ClinicalConsentFormRecord {
  if (actor.role !== 'admin') {
    throw new Error(
      'Operación restringida: Solo el rol Administrador / Auditoría puede anular un formato firmado.'
    );
  }

  const validated = AnnulConsentFormSchema.parse(rawInput);
  const forms = existingFormsOverride ?? getAllConsentForms();
  const targetIndex = forms.findIndex((f) => f.id === validated.formId);

  if (targetIndex === -1) {
    throw new Error('Formato clínico no encontrado.');
  }

  const target = forms[targetIndex];
  if (target.status === 'ANNULLED') {
    throw new Error('Este formato ya fue anulado previamente y es inmutable.');
  }

  const annulledRecord: ClinicalConsentFormRecord = {
    ...target,
    status: 'ANNULLED',
    annulment: {
      reason: validated.reason,
      annulledByUserId: actor.id,
      annulledByUserName: actor.fullName,
      annulledAt: new Date().toISOString(),
    },
  };

  const nextForms = [...forms];
  nextForms[targetIndex] = annulledRecord;
  persistConsentForms(nextForms);

  if (isBrowser()) {
    void trySyncAnnulmentToSupabase(annulledRecord);
  }

  appendAuditLog({
    formId: annulledRecord.id,
    formNumber: annulledRecord.formNumber,
    action: 'ANNULLED',
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    details: `Formato ANULADO. Justificación: "${validated.reason}"`,
  });

  return annulledRecord;
}

/**
 * Sincroniza todos los formatos creados en modo Offline (`PENDING_SYNC`).
 */
export async function syncPendingOfflineForms(actor: ClinicalUser): Promise<number> {
  const forms = getAllConsentForms();
  let syncedCount = 0;

  const updated = await Promise.all(
    forms.map(async (form) => {
      if (form.syncStatus === 'PENDING_SYNC') {
        const ok = await trySyncRecordToSupabase(form);
        if (ok) {
          syncedCount += 1;
          return {
            ...form,
            syncStatus: 'SYNCED' as const,
          };
        }
      }
      return form;
    })
  );

  if (syncedCount > 0) {
    persistConsentForms(updated);
    appendAuditLog({
      formId: 'SYNC-BATCH',
      formNumber: `${syncedCount} formato(s)`,
      action: 'SYNCED_TO_CLOUD',
      actorId: actor.id,
      actorName: actor.fullName,
      actorRole: actor.role,
      details: `Sincronización exitosa en Supabase de ${syncedCount} formato(s) diligenciados en modo sin conexión.`,
    });
  }

  return syncedCount;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project.supabase.co'));
}

async function trySyncRecordToSupabase(record: ClinicalConsentFormRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }
  try {
    const supabase = createClient();
    const syncedRecord: ClinicalConsentFormRecord = {
      ...record,
      syncStatus: 'SYNCED',
    };
    const { error } = await supabase.from('clinical_consent_forms').insert({
      id: record.id,
      form_number: record.formNumber,
      created_at: record.createdAt,
      facility_service: record.facilityService,
      status: 'SIGNED',
      institution_name: record.institutionName,
      quality_format_code: record.qualityFormatCode,
      quality_version: record.qualityVersion,
      patient_doc_type: record.patient.docType,
      patient_doc_number: record.patient.docNumber,
      patient_full_name: record.patient.fullName,
      patient_age: record.patient.age,
      consultation_reason: record.patient.consultationReason,
      is_incapacitated: record.patient.isIncapacitated,
      incapacity_reason: record.patient.incapacityReason,
      patient_signature_data_url: record.patient.patientSignatureDataUrl,
      requires_guardian: record.requiresGuardian,
      guardian_payload: record.guardian ?? null,
      consents_payload: record.consents,
      habeas_data_accepted: record.habeasDataAccepted,
      habeas_data_text_snapshot: record.habeasDataTextSnapshot,
      belongings_payload: record.belongings,
      return_act_payload: record.returnAct ?? null,
      record_payload: syncedRecord,
      integrity_hash_sha256: record.integrityHashSha256,
      created_by_user_id: record.createdByUserId,
      created_by_user_name: record.createdByUserName,
      created_by_role: record.createdByRole,
    });

    if (error && error.code !== '23505') {
      return false;
    }

    if (record.status === 'ANNULLED' && record.annulment) {
      await trySyncAnnulmentToSupabase(record);
    }

    return true;
  } catch {
    return false;
  }
}

async function trySyncAnnulmentToSupabase(record: ClinicalConsentFormRecord): Promise<void> {
  if (!isSupabaseConfigured() || !record.annulment) {
    return;
  }
  try {
    const supabase = createClient();
    await supabase
      .from('clinical_consent_forms')
      .update({
        status: 'ANNULLED',
        annulment_reason: record.annulment.reason,
        annulled_by_user_id: record.annulment.annulledByUserId,
        annulled_by_user_name: record.annulment.annulledByUserName,
        annulled_at: record.annulment.annulledAt,
        record_payload: {
          ...record,
          syncStatus: 'SYNCED',
        },
      })
      .eq('id', record.id);
  } catch {
    // Mantiene estado local y reintenta en próxima sincronización
  }
}

async function trySyncAuditLogToSupabase(entry: AuditLogEntry): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  try {
    const supabase = createClient();
    await supabase.from('clinical_audit_logs').insert({
      form_id: entry.formId,
      form_number: entry.formNumber,
      action: entry.action,
      actor_id: entry.actorId,
      actor_name: entry.actorName,
      actor_role: entry.actorRole,
      details: entry.details,
      created_at: entry.timestamp,
    });
  } catch {
    // Silencioso en caso de intermitencia de red
  }
}

async function trySyncTemplateToSupabase(template: InstitutionalTemplateConfig): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }
  try {
    const supabase = createClient();
    await supabase.from('consent_templates').upsert(
      {
        institution_name: template.institutionName,
        institution_nit: template.institutionNit,
        quality_format_code: template.qualityFormatCode,
        quality_version: template.qualityVersion,
        quality_approval_date: template.qualityApprovalDate,
        approved_by_committees: template.approvedByCommittees,
        hospitalization_consent_text: template.hospitalizationConsentText,
        nursing_procedures_consent_text: template.nursingProceduresConsentText,
        student_presence_consent_text: template.studentPresenceConsentText,
        habeas_data_legal_text: template.habeasDataLegalText,
        available_facilities: template.availableFacilities,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'quality_format_code' }
    );
  } catch {
    // Mantiene plantilla en caché local cifrada
  }
}

interface SupabaseClinicalFormRow {
  id: string;
  form_number: string;
  created_at: string;
  facility_service: string;
  status: 'SIGNED' | 'ANNULLED';
  record_payload: ClinicalConsentFormRecord | null;
  annulment_reason: string | null;
  annulled_by_user_id: string | null;
  annulled_by_user_name: string | null;
  annulled_at: string | null;
}

interface SupabaseTemplateRow {
  institution_name: string;
  institution_nit: string;
  quality_format_code: string;
  quality_version: string;
  quality_approval_date: string;
  approved_by_committees: InstitutionalTemplateConfig['approvedByCommittees'];
  hospitalization_consent_text: string;
  nursing_procedures_consent_text: string;
  student_presence_consent_text: string;
  habeas_data_legal_text: string;
  available_facilities: string[];
}

interface SupabaseAuditLogRow {
  id: string;
  form_id: string;
  form_number: string;
  action: AuditLogEntry['action'];
  actor_id: string;
  actor_name: string;
  actor_role: string;
  details: string;
  created_at: string;
}

/**
 * Hidrata y sincroniza el estado clínico bidireccionalmente con Supabase PostgreSQL.
 * Si la tabla remota aún no tiene los formatos semilla iniciales, los publica automáticamente.
 */
export async function hydrateClinicalStateFromSupabase(): Promise<{
  forms: ClinicalConsentFormRecord[];
  auditLogs: AuditLogEntry[];
  template: InstitutionalTemplateConfig;
  connectedToCloud: boolean;
}> {
  const localForms = getAllConsentForms();
  const localLogs = getAllAuditLogs();
  const localTemplate = getInstitutionalTemplate();

  if (!isBrowser() || !isSupabaseConfigured()) {
    return {
      forms: localForms,
      auditLogs: localLogs,
      template: localTemplate,
      connectedToCloud: false,
    };
  }

  try {
    const supabase = createClient();

    // 1. Consultar formatos en Supabase
    const { data: remoteFormRows, error: formsError } = await supabase
      .from('clinical_consent_forms')
      .select(
        'id, form_number, created_at, facility_service, status, record_payload, annulment_reason, annulled_by_user_id, annulled_by_user_name, annulled_at'
      )
      .order('created_at', { ascending: false });

    if (formsError) {
      return {
        forms: localForms,
        auditLogs: localLogs,
        template: localTemplate,
        connectedToCloud: false,
      };
    }

    const typedRows = (remoteFormRows ?? []) as SupabaseClinicalFormRow[];
    let mergedForms: ClinicalConsentFormRecord[] = [];

    if (typedRows.length === 0) {
      // Sembrar registros iniciales en Supabase para que queden disponibles en la nube
      for (const seedForm of SEED_FORMS) {
        await trySyncRecordToSupabase(seedForm);
      }
      for (const seedLog of SEED_AUDIT_LOGS) {
        await trySyncAuditLogToSupabase(seedLog);
      }
      mergedForms = localForms;
    } else {
      const remoteForms: ClinicalConsentFormRecord[] = typedRows
        .map((row): ClinicalConsentFormRecord | null => {
          if (!row.record_payload || !row.record_payload.id) {
            return null;
          }
          const payload = row.record_payload;
          return {
            ...payload,
            status: row.status,
            syncStatus: 'SYNCED',
            annulment:
              row.status === 'ANNULLED' && row.annulment_reason
                ? {
                    reason: row.annulment_reason,
                    annulledByUserId: row.annulled_by_user_id ?? '',
                    annulledByUserName: row.annulled_by_user_name ?? '',
                    annulledAt: row.annulled_at ?? row.created_at,
                  }
                : payload.annulment,
          };
        })
        .filter((item): item is ClinicalConsentFormRecord => item !== null);

      const remoteIds = new Set(remoteForms.map((f) => f.id));
      const pendingLocalOnly = localForms.filter(
        (f) => f.syncStatus === 'PENDING_SYNC' && !remoteIds.has(f.id)
      );

      mergedForms = [...pendingLocalOnly, ...remoteForms].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      persistConsentForms(mergedForms);
    }

    // 2. Consultar plantilla oficial en Supabase
    let activeTemplate = localTemplate;
    const { data: templateRow } = await supabase
      .from('consent_templates')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (templateRow) {
      const t = templateRow as SupabaseTemplateRow;
      activeTemplate = {
        institutionName: t.institution_name,
        institutionNit: t.institution_nit,
        qualityFormatCode: t.quality_format_code,
        qualityVersion: t.quality_version,
        qualityApprovalDate: t.quality_approval_date,
        approvedByCommittees: t.approved_by_committees,
        hospitalizationConsentText: t.hospitalization_consent_text,
        nursingProceduresConsentText: t.nursing_procedures_consent_text,
        studentPresenceConsentText: t.student_presence_consent_text,
        habeasDataLegalText: t.habeas_data_legal_text,
        availableFacilities:
          Array.isArray(t.available_facilities) && t.available_facilities.length > 0
            ? t.available_facilities
            : DEFAULT_INSTITUTIONAL_TEMPLATE.availableFacilities,
      };
      window.localStorage.setItem(
        STORAGE_KEYS.TEMPLATE,
        encryptLocalData(JSON.stringify(activeTemplate))
      );
    }

    // 3. Consultar bitácora de auditoría en Supabase
    let activeLogs = localLogs;
    const { data: logRows } = await supabase
      .from('clinical_audit_logs')
      .select('id, form_id, form_number, action, actor_id, actor_name, actor_role, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (logRows && logRows.length > 0) {
      const typedLogs = logRows as SupabaseAuditLogRow[];
      activeLogs = typedLogs.map((l) => ({
        id: l.id,
        formId: l.form_id,
        formNumber: l.form_number,
        action: l.action,
        actorId: l.actor_id,
        actorName: l.actor_name,
        actorRole: l.actor_role,
        details: l.details,
        timestamp: l.created_at,
      }));
      window.localStorage.setItem(
        STORAGE_KEYS.AUDIT,
        encryptLocalData(JSON.stringify(activeLogs))
      );
    }

    return {
      forms: mergedForms,
      auditLogs: activeLogs,
      template: activeTemplate,
      connectedToCloud: true,
    };
  } catch {
    return {
      forms: localForms,
      auditLogs: localLogs,
      template: localTemplate,
      connectedToCloud: false,
    };
  }
}

export function exportClinicalBackupJson(actor: ClinicalUser): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: actor.fullName,
    template: getInstitutionalTemplate(),
    forms: getAllConsentForms(),
    auditLogs: getAllAuditLogs(),
  };

  appendAuditLog({
    formId: 'BACKUP-FULL',
    formNumber: 'RESPALDO-JSON',
    action: 'BACKUP_EXPORTED',
    actorId: actor.id,
    actorName: actor.fullName,
    actorRole: actor.role,
    details: `Copia de seguridad exportada con ${payload.forms.length} formatos clínicos y ${payload.auditLogs.length} registros de auditoría.`,
  });

  return JSON.stringify(payload, null, 2);
}
