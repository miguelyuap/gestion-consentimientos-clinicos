export type IdentificationDocType =
  | 'CC'
  | 'TI'
  | 'RC'
  | 'CE'
  | 'PA'
  | 'PPT'
  | 'MS'
  | 'AS';

export type ConsentDecision = 'ACCEPTED' | 'REJECTED';

export type BelongingSuitability = 'APTA' | 'NO_APTA';

export type FormLegalStatus = 'SIGNED' | 'ANNULLED';

export type SyncStatus = 'SYNCED' | 'PENDING_SYNC';

export interface BelongingItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  suitability: BelongingSuitability;
}

export interface IndependentConsentSection {
  title: string;
  officialText: string;
  decision: ConsentDecision;
  signatureDataUrl: string;
  signedAt: string;
}

export interface PatientInfo {
  fullName: string;
  docType: IdentificationDocType;
  docNumber: string;
  age: number;
  consultationReason: string;
  isIncapacitated: boolean;
  incapacityReason: string;
  patientSignatureDataUrl: string;
}

export interface GuardianInfo {
  fullName: string;
  docType: IdentificationDocType;
  docNumber: string;
  relationship: string;
  phone: string;
  signatureDataUrl: string;
}

export interface BelongingsReceiptSection {
  items: BelongingItem[];
  cashAmount: number;
  observations: string;
  deliveredByName: string;
  deliveredBySignature: string;
  receivedByName: string;
  receivedBySignature: string;
}

export interface NonSuitableReturnAct {
  required: boolean;
  receiverName: string;
  receiverDoc: string;
  receiverRelationship: string;
  notes: string;
  signatureDataUrl: string;
  returnedAt: string;
}

export interface InstitutionalTemplateConfig {
  institutionName: string;
  institutionNit: string;
  qualityFormatCode: string;
  qualityVersion: string;
  qualityApprovalDate: string;
  approvedByCommittees: {
    qualityApproved: boolean;
    legalApproved: boolean;
    systemsApproved: boolean;
    physicalFormatCollected: boolean;
    integrationMode: 'INDEPENDENT_OFFLINE_FIRST' | 'HIS_INTEGRATED';
  };
  hospitalizationConsentText: string;
  nursingProceduresConsentText: string;
  studentPresenceConsentText: string;
  habeasDataLegalText: string;
  availableFacilities: string[];
}

export interface ClinicalConsentFormRecord {
  id: string;
  formNumber: string;
  createdAt: string;
  facilityService: string;
  status: FormLegalStatus;
  syncStatus: SyncStatus;

  // Datos de calidad del formato
  institutionName: string;
  qualityFormatCode: string;
  qualityVersion: string;

  // Paciente y Acudiente
  patient: PatientInfo;
  requiresGuardian: boolean;
  guardian?: GuardianInfo;

  // 3 Consentimientos Independientes
  consents: {
    hospitalization: IndependentConsentSection;
    nursingProcedures: IndependentConsentSection;
    studentPresence: IndependentConsentSection;
  };

  // Ley 1581 de 2012
  habeasDataAccepted: boolean;
  habeasDataTextSnapshot: string;

  // Recibo de Pertenencias y Acta de Devolución de lo No Apto
  belongings: BelongingsReceiptSection;
  returnAct?: NonSuitableReturnAct;

  // Trazabilidad, Firma Electrónica (Ley 527/1999) y Anulación (Res. 1995/1999)
  integrityHashSha256: string;
  createdByUserId: string;
  createdByUserName: string;
  createdByRole: string;

  annulment?: {
    reason: string;
    annulledByUserId: string;
    annulledByUserName: string;
    annulledAt: string;
  };
}

export interface AuditLogEntry {
  id: string;
  formId: string;
  formNumber: string;
  action:
    | 'CREATED_AND_SIGNED'
    | 'ANNULLED'
    | 'PDF_EXPORTED'
    | 'TEMPLATE_UPDATED'
    | 'SYNCED_TO_CLOUD'
    | 'BACKUP_EXPORTED';
  actorId: string;
  actorName: string;
  actorRole: string;
  details: string;
  timestamp: string;
}
