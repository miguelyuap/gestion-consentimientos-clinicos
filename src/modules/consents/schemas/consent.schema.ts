import { z } from 'zod';

export const DocTypeSchema = z.enum([
  'CC',
  'TI',
  'RC',
  'CE',
  'PA',
  'PPT',
  'MS',
  'AS',
]);

export const SignatureDataUrlSchema = z
  .string()
  .min(30, 'La firma digital es obligatoria.')
  .refine(
    (val) => val.startsWith('data:image/'),
    'Formato de firma digital inválido (debe ser trazo digital capturado).'
  );

export const BelongingItemSchema = z.object({
  id: z.string().min(1),
  itemName: z.string().trim().min(2, 'Ingrese el nombre del ítem o pertenencia.'),
  description: z.string().trim().min(2, 'Ingrese la descripción/estado del ítem.'),
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1.'),
  suitability: z.enum(['APTA', 'NO_APTA']),
});

export const IndependentConsentInputSchema = z.object({
  title: z.string().min(3),
  officialText: z.string().min(20),
  decision: z.enum(['ACCEPTED', 'REJECTED'], {
    required_error: 'Debe seleccionar Aceptar o Rechazar en este consentimiento.',
  }),
  signatureDataUrl: SignatureDataUrlSchema,
});

export const CreateConsentFormSchema = z
  .object({
    facilityService: z.string().trim().min(3, 'Seleccione la sede o servicio clínico.'),
    patient: z.object({
      fullName: z.string().trim().min(3, 'El nombre completo del paciente es obligatorio.'),
      docType: DocTypeSchema,
      docNumber: z
        .string()
        .trim()
        .min(4, 'El número de documento del paciente debe tener al menos 4 caracteres.'),
      age: z
        .number({ invalid_type_error: 'Ingrese una edad válida.' })
        .int('La edad debe ser un número entero.')
        .min(0, 'La edad no puede ser negativa.')
        .max(130, 'Edad fuera de rango válido.'),
      consultationReason: z
        .string()
        .trim()
        .min(5, 'El motivo de consulta o diagnóstico de ingreso es obligatorio.'),
      isIncapacitated: z.boolean(),
      incapacityReason: z.string().trim().optional().default(''),
      patientSignatureDataUrl: z.string().optional().default(''),
    }),
    guardian: z
      .object({
        fullName: z.string().trim().optional().default(''),
        docType: DocTypeSchema.optional().default('CC'),
        docNumber: z.string().trim().optional().default(''),
        relationship: z.string().trim().optional().default(''),
        phone: z.string().trim().optional().default(''),
        signatureDataUrl: z.string().optional().default(''),
      })
      .optional(),
    consents: z.object({
      hospitalization: IndependentConsentInputSchema,
      nursingProcedures: IndependentConsentInputSchema,
      studentPresence: IndependentConsentInputSchema,
    }),
    habeasDataAccepted: z.literal(true, {
      errorMap: () => ({
        message:
          'Es obligatorio autorizar el tratamiento de datos sensibles (Ley 1581 de 2012) para el registro clínico.',
      }),
    }),
    belongings: z.object({
      items: z.array(BelongingItemSchema),
      cashAmount: z
        .number({ invalid_type_error: 'Ingrese un monto numérico válido (0 si no entrega dinero).' })
        .min(0, 'El monto de dinero no puede ser negativo.'),
      observations: z.string().trim().optional().default(''),
      deliveredByName: z
        .string()
        .trim()
        .min(3, 'Indique el nombre de quien entrega las pertenencias.'),
      deliveredBySignature: SignatureDataUrlSchema,
      receivedByName: z
        .string()
        .trim()
        .min(3, 'Indique el nombre del personal de enfermería que recibe.'),
      receivedBySignature: SignatureDataUrlSchema,
    }),
    returnAct: z
      .object({
        receiverName: z.string().trim().optional().default(''),
        receiverDoc: z.string().trim().optional().default(''),
        receiverRelationship: z.string().trim().optional().default(''),
        notes: z.string().trim().optional().default(''),
        signatureDataUrl: z.string().optional().default(''),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const requiresGuardian = data.patient.age < 18 || data.patient.isIncapacitated;

    if (data.patient.isIncapacitated && (!data.patient.incapacityReason || data.patient.incapacityReason.length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['patient', 'incapacityReason'],
        message: 'Especifique la condición clínica por la cual el paciente no puede firmar.',
      });
    }

    if (requiresGuardian) {
      if (!data.guardian?.fullName || data.guardian.fullName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian', 'fullName'],
          message:
            'El nombre del acudiente es obligatorio porque el paciente es menor de edad o incapaz.',
        });
      }
      if (!data.guardian?.docNumber || data.guardian.docNumber.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian', 'docNumber'],
          message: 'El documento del acudiente es obligatorio.',
        });
      }
      if (!data.guardian?.relationship || data.guardian.relationship.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian', 'relationship'],
          message: 'El parentesco del acudiente es obligatorio.',
        });
      }
      if (!data.guardian?.phone || data.guardian.phone.length < 7) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian', 'phone'],
          message: 'El teléfono de contacto del acudiente es obligatorio.',
        });
      }
      if (
        !data.guardian?.signatureDataUrl ||
        !data.guardian.signatureDataUrl.startsWith('data:image/')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian', 'signatureDataUrl'],
          message: 'La firma digital del acudiente responsable es obligatoria.',
        });
      }
    } else {
      // Si el paciente es mayor de edad y capaz, debe firmar su identificación
      if (
        !data.patient.patientSignatureDataUrl ||
        !data.patient.patientSignatureDataUrl.startsWith('data:image/')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['patient', 'patientSignatureDataUrl'],
          message: 'La firma del paciente es obligatoria (es mayor de edad y capaz).',
        });
      }
    }

    // Regla del Acta de Devolución de lo No Apto
    const nonSuitableItems = data.belongings.items.filter(
      (item) => item.suitability === 'NO_APTA'
    );

    if (nonSuitableItems.length > 0) {
      if (!data.returnAct?.receiverName || data.returnAct.receiverName.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['returnAct', 'receiverName'],
          message:
            'Existen pertenencias "No Aptas": debe registrar el nombre de quien recibe la devolución.',
        });
      }
      if (!data.returnAct?.receiverDoc || data.returnAct.receiverDoc.length < 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['returnAct', 'receiverDoc'],
          message: 'Ingrese el documento de quien retira los elementos no aptos.',
        });
      }
      if (
        !data.returnAct?.receiverRelationship ||
        data.returnAct.receiverRelationship.length < 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['returnAct', 'receiverRelationship'],
          message: 'Indique el parentesco de quien retira los elementos no aptos.',
        });
      }
      if (
        !data.returnAct?.signatureDataUrl ||
        !data.returnAct.signatureDataUrl.startsWith('data:image/')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['returnAct', 'signatureDataUrl'],
          message:
            'La firma en el Acta de Devolución de pertenencias no aptas es obligatoria.',
        });
      }
    }
  });

export const AnnulConsentFormSchema = z.object({
  formId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(
      15,
      'Por normativa clínica (Resolución 1995/1999), la justificación de anulación debe tener al menos 15 caracteres detallando el motivo.'
    ),
});

export type CreateConsentFormInput = z.infer<typeof CreateConsentFormSchema>;
export type AnnulConsentFormInput = z.infer<typeof AnnulConsentFormSchema>;
