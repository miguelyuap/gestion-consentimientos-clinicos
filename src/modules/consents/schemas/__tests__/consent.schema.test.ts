import { describe, expect, it } from 'vitest';
import {
  computeSha256Hash,
  decryptLocalData,
  encryptLocalData,
} from '@/lib/crypto/integrity-hash';
import { DEMO_CLINICAL_USERS } from '@/modules/auth/services/auth-service';
import {
  CreateConsentFormSchema,
  type CreateConsentFormInput,
} from '../consent.schema';
import { annulClinicalConsentForm } from '../../services/consent-storage.service';

const VALID_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function buildBaseValidInput(): CreateConsentFormInput {
  return {
    facilityService: 'Sede Principal — Hospitalización Adultos',
    patient: {
      fullName: 'Carlos Alberto Valderrama',
      docType: 'CC',
      docNumber: '79123456',
      age: 45,
      consultationReason: 'Observación clínica por dolor torácico en estudio',
      isIncapacitated: false,
      incapacityReason: '',
      patientSignatureDataUrl: VALID_SIGNATURE,
    },
    guardian: {
      fullName: '',
      docType: 'CC',
      docNumber: '',
      relationship: '',
      phone: '',
      signatureDataUrl: '',
    },
    consents: {
      hospitalization: {
        title: 'Consentimiento de Hospitalización',
        officialText: 'Texto oficial aprobado de hospitalización con más de veinte caracteres.',
        decision: 'ACCEPTED',
        signatureDataUrl: VALID_SIGNATURE,
      },
      nursingProcedures: {
        title: 'Procedimientos de Enfermería',
        officialText: 'Texto oficial aprobado de enfermería con más de veinte caracteres.',
        decision: 'ACCEPTED',
        signatureDataUrl: VALID_SIGNATURE,
      },
      studentPresence: {
        title: 'Presencia de Estudiantes',
        officialText: 'Texto oficial aprobado de docencia-servicio con más de veinte caracteres.',
        decision: 'REJECTED',
        signatureDataUrl: VALID_SIGNATURE,
      },
    },
    habeasDataAccepted: true,
    belongings: {
      items: [
        {
          id: 'item-1',
          itemName: 'Pijama de algodón',
          description: 'Azul oscuro en buen estado',
          quantity: 1,
          suitability: 'APTA',
        },
      ],
      cashAmount: 20000,
      observations: 'Entrega voluntaria',
      deliveredByName: 'Carlos Alberto Valderrama',
      deliveredBySignature: VALID_SIGNATURE,
      receivedByName: 'Jefe Laura Valentina Gómez',
      receivedBySignature: VALID_SIGNATURE,
    },
    returnAct: {
      receiverName: '',
      receiverDoc: '',
      receiverRelationship: '',
      notes: '',
      signatureDataUrl: '',
    },
  };
}

describe('Validaciones Clínicas y Legales — Consentimientos y Pertenencias', () => {
  it('aprueba un formato válido de paciente adulto consciente sin ítems no aptos', () => {
    const input = buildBaseValidInput();
    const result = CreateConsentFormSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('exige acudiente obligatorio cuando el paciente es menor de 18 años', () => {
    const input = buildBaseValidInput();
    input.patient.age = 12;
    input.patient.docType = 'TI';

    const failedResult = CreateConsentFormSchema.safeParse(input);
    expect(failedResult.success).toBe(false);

    // Al completar los datos y firma del acudiente, debe aprobar
    input.guardian = {
      fullName: 'Martha Lucía Pérez',
      docType: 'CC',
      docNumber: '52456789',
      relationship: 'Madre',
      phone: '3109876543',
      signatureDataUrl: VALID_SIGNATURE,
    };
    const passedResult = CreateConsentFormSchema.safeParse(input);
    expect(passedResult.success).toBe(true);
  });

  it('exige acudiente obligatorio y causa cuando el paciente adulto está incapacitado', () => {
    const input = buildBaseValidInput();
    input.patient.isIncapacitated = true;
    input.patient.incapacityReason = 'Paciente bajo sedación profunda en UCI';

    const failedWithoutGuardian = CreateConsentFormSchema.safeParse(input);
    expect(failedWithoutGuardian.success).toBe(false);

    input.guardian = {
      fullName: 'Andrés Felipe Valderrama',
      docType: 'CC',
      docNumber: '80123987',
      relationship: 'Hijo',
      phone: '3152345678',
      signatureDataUrl: VALID_SIGNATURE,
    };
    const passedWithGuardian = CreateConsentFormSchema.safeParse(input);
    expect(passedWithGuardian.success).toBe(true);
  });

  it('exige el Acta de Devolución firmada cuando existe al menos una pertenencia "NO_APTA"', () => {
    const input = buildBaseValidInput();
    input.belongings.items.push({
      id: 'item-joya',
      itemName: 'Reloj metálico y cadena',
      description: 'Objetos de valor no aptos en hospitalización',
      quantity: 2,
      suitability: 'NO_APTA',
    });

    const failedWithoutReturnAct = CreateConsentFormSchema.safeParse(input);
    expect(failedWithoutReturnAct.success).toBe(false);

    input.returnAct = {
      receiverName: 'Elena María Valderrama',
      receiverDoc: '51987654',
      receiverRelationship: 'Hermana',
      notes: 'Recibe reloj y cadena en perfecto estado',
      signatureDataUrl: VALID_SIGNATURE,
    };

    const passedWithReturnAct = CreateConsentFormSchema.safeParse(input);
    expect(passedWithReturnAct.success).toBe(true);
  });

  it('impide que roles distintos a Administrador anulen formatos y exige justificación >= 15 caracteres', () => {
    const nursingUser = DEMO_CLINICAL_USERS[0];
    const adminUser = DEMO_CLINICAL_USERS[2];

    expect(() =>
      annulClinicalConsentForm(
        {
          formId: 'a1029384-756b-4c3d-9e8f-000000000001',
          reason: 'Motivo suficientemente largo para la prueba legal.',
        },
        nursingUser
      )
    ).toThrow(/Solo el rol Administrador/);

    expect(() =>
      annulClinicalConsentForm(
        {
          formId: 'a1029384-756b-4c3d-9e8f-000000000001',
          reason: 'Muy corto',
        },
        adminUser
      )
    ).toThrow();
  });

  it('cifra/descifra datos locales (Ley 1581) y genera hash SHA-256 determinista (Ley 527)', async () => {
    const sampleSecret = JSON.stringify({ paciente: 'Juan Pérez', doc: '10203040' });
    const encrypted = encryptLocalData(sampleSecret);
    expect(encrypted.startsWith('ENCv1:')).toBe(true);
    expect(encrypted).not.toContain('Juan Pérez');

    const decrypted = decryptLocalData(encrypted);
    expect(decrypted).toBe(sampleSecret);

    const hashA = await computeSha256Hash(sampleSecret);
    const hashB = await computeSha256Hash(sampleSecret);
    expect(hashA).toBe(hashB);
    expect(hashA.length).toBeGreaterThanOrEqual(16);
  });
});
