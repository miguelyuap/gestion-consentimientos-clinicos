'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Backpack,
  Building2,
  CalendarClock,
  CheckCircle2,
  CopyCheck,
  FileSignature,
  Hash,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { SignaturePad } from '@/components/ui/SignaturePad';
import type { ClinicalUser } from '@/modules/auth/types/auth.types';
import { CreateConsentFormSchema } from '../schemas/consent.schema';
import { createAndSignConsentForm } from '../services/consent-storage.service';
import type {
  BelongingItem,
  ClinicalConsentFormRecord,
  ConsentDecision,
  IdentificationDocType,
  InstitutionalTemplateConfig,
} from '../types/consent.types';

export interface ConsentFormWizardProps {
  currentUser: ClinicalUser;
  template: InstitutionalTemplateConfig;
  nextFormNumber: string;
  isOnline: boolean;
  onSuccessCreated: (record: ClinicalConsentFormRecord) => void;
}

const DOC_TYPES: { value: IdentificationDocType; label: string }[] = [
  { value: 'CC', label: 'CC — Cédula de Ciudadanía' },
  { value: 'TI', label: 'TI — Tarjeta de Identidad' },
  { value: 'RC', label: 'RC — Registro Civil' },
  { value: 'CE', label: 'CE — Cédula de Extranjería' },
  { value: 'PPT', label: 'PPT — Permiso por Protección Temporal' },
  { value: 'PA', label: 'PA — Pasaporte' },
  { value: 'MS', label: 'MS — Menor sin Identificación' },
  { value: 'AS', label: 'AS — Adulto sin Identificación' },
];

export function ConsentFormWizard({
  currentUser,
  template,
  nextFormNumber,
  isOnline,
  onSuccessCreated,
}: ConsentFormWizardProps) {
  const [currentTimestamp, setCurrentTimestamp] = useState<string>('');

  // 1. Encabezado
  const [facilityService, setFacilityService] = useState<string>(
    template.availableFacilities[0] ?? currentUser.defaultFacility
  );

  // 2. Paciente
  const [patientFullName, setPatientFullName] = useState('');
  const [patientDocType, setPatientDocType] = useState<IdentificationDocType>('CC');
  const [patientDocNumber, setPatientDocNumber] = useState('');
  const [patientAge, setPatientAge] = useState<number>(34);
  const [consultationReason, setConsultationReason] = useState('');
  const [isIncapacitated, setIsIncapacitated] = useState(false);
  const [incapacityReason, setIncapacityReason] = useState('');
  const [patientSignature, setPatientSignature] = useState('');

  // 3. Acudiente (Obligatorio si edad < 18 o incapaz)
  const [guardianFullName, setGuardianFullName] = useState('');
  const [guardianDocType, setGuardianDocType] = useState<IdentificationDocType>('CC');
  const [guardianDocNumber, setGuardianDocNumber] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianSignature, setGuardianSignature] = useState('');

  // 4. Consentimientos Independientes
  const [hospDecision, setHospDecision] = useState<ConsentDecision>('ACCEPTED');
  const [hospSignature, setHospSignature] = useState('');

  const [nursingDecision, setNursingDecision] = useState<ConsentDecision>('ACCEPTED');
  const [nursingSignature, setNursingSignature] = useState('');

  const [studentsDecision, setStudentsDecision] = useState<ConsentDecision>('ACCEPTED');
  const [studentsSignature, setStudentsSignature] = useState('');

  // 5. Recibo de Pertenencias
  const [belongingItems, setBelongingItems] = useState<BelongingItem[]>([
    {
      id: 'item-init-1',
      itemName: 'Teléfono celular y cargador',
      description: 'Equipo apagado con forro protector negro',
      quantity: 1,
      suitability: 'NO_APTA',
    },
    {
      id: 'item-init-2',
      itemName: 'Útiles de aseo personal y pijama',
      description: 'Bolso pequeño de tela con elementos básicos',
      quantity: 1,
      suitability: 'APTA',
    },
  ]);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [belongingsObservations, setBelongingsObservations] = useState('');
  const [deliveredByName, setDeliveredByName] = useState('');
  const [deliveredBySignature, setDeliveredBySignature] = useState('');
  const [receivedByName, setReceivedByName] = useState(currentUser.fullName);
  const [receivedBySignature, setReceivedBySignature] = useState('');

  // 6. Acta de Devolución de lo No Apto
  const [returnReceiverName, setReturnReceiverName] = useState('');
  const [returnReceiverDoc, setReturnReceiverDoc] = useState('');
  const [returnReceiverRelationship, setReturnReceiverRelationship] = useState('');
  const [returnNotes, setReturnNotes] = useState(
    'Se devuelven los elementos clasificados como No Aptos para custodia familiar.'
  );
  const [returnSignature, setReturnSignature] = useState('');

  // 7. Habeas Data y Estado de Envío
  const [habeasDataAccepted, setHabeasDataAccepted] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requiresGuardian = patientAge < 18 || isIncapacitated;
  const nonSuitableItems = belongingItems.filter((item) => item.suitability === 'NO_APTA');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTimestamp(
        new Intl.DateTimeFormat('es-CO', {
          dateStyle: 'full',
          timeStyle: 'medium',
        }).format(new Date())
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sincronizar automáticamente sugerencia de nombre de quien entrega pertenencias
  useEffect(() => {
    if (requiresGuardian && guardianFullName && !deliveredByName) {
      setDeliveredByName(guardianFullName);
    } else if (!requiresGuardian && patientFullName && !deliveredByName) {
      setDeliveredByName(patientFullName);
    }
  }, [requiresGuardian, guardianFullName, patientFullName, deliveredByName]);

  const handleAddBelongingItem = () => {
    setBelongingItems((prev) => [
      ...prev,
      {
        id: `bel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        itemName: '',
        description: '',
        quantity: 1,
        suitability: 'APTA',
      },
    ]);
  };

  const handleRemoveBelongingItem = (id: string) => {
    setBelongingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateBelongingItem = <K extends keyof BelongingItem>(
    id: string,
    field: K,
    value: BelongingItem[K]
  ) => {
    setBelongingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const primarySignerSignature = requiresGuardian ? guardianSignature : patientSignature;
  const primarySignerName = requiresGuardian
    ? guardianFullName || 'Acudiente Responsable'
    : patientFullName || 'Paciente Titular';

  const handleCopyPrimarySignatureToConsents = () => {
    if (!primarySignerSignature) return;
    setHospSignature(primarySignerSignature);
    setNursingSignature(primarySignerSignature);
    setStudentsSignature(primarySignerSignature);
    if (!deliveredBySignature) {
      setDeliveredBySignature(primarySignerSignature);
    }
  };

  const handleFillPediatricDemo = () => {
    setPatientFullName('Mateo Nicolás Vargas Pineda');
    setPatientDocType('TI');
    setPatientDocNumber('1104859632');
    setPatientAge(11);
    setConsultationReason('Apendicitis aguda — Ingreso para manejo quirúrgico y hospitalización');
    setIsIncapacitated(false);
    setGuardianFullName('Claudia Patricia Pineda Gómez');
    setGuardianDocType('CC');
    setGuardianDocNumber('52963852');
    setGuardianRelationship('Madre');
    setGuardianPhone('3158964712');
    setDeliveredByName('Claudia Patricia Pineda Gómez');
    setReturnReceiverName('Claudia Patricia Pineda Gómez');
    setReturnReceiverDoc('52963852');
    setReturnReceiverRelationship('Madre');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setValidationErrors([]);

    const payload = {
      facilityService,
      patient: {
        fullName: patientFullName,
        docType: patientDocType,
        docNumber: patientDocNumber,
        age: Number(patientAge),
        consultationReason,
        isIncapacitated,
        incapacityReason,
        patientSignatureDataUrl: patientSignature,
      },
      guardian: {
        fullName: guardianFullName,
        docType: guardianDocType,
        docNumber: guardianDocNumber,
        relationship: guardianRelationship,
        phone: guardianPhone,
        signatureDataUrl: guardianSignature,
      },
      consents: {
        hospitalization: {
          title: 'Consentimiento de Hospitalización',
          officialText: template.hospitalizationConsentText,
          decision: hospDecision,
          signatureDataUrl: hospSignature,
        },
        nursingProcedures: {
          title: 'Consentimiento de Procedimientos de Enfermería',
          officialText: template.nursingProceduresConsentText,
          decision: nursingDecision,
          signatureDataUrl: nursingSignature,
        },
        studentPresence: {
          title: 'Consentimiento de Presencia de Estudiantes en Prácticas',
          officialText: template.studentPresenceConsentText,
          decision: studentsDecision,
          signatureDataUrl: studentsSignature,
        },
      },
      habeasDataAccepted,
      belongings: {
        items: belongingItems,
        cashAmount: Number(cashAmount),
        observations: belongingsObservations,
        deliveredByName,
        deliveredBySignature,
        receivedByName,
        receivedBySignature,
      },
      returnAct: {
        receiverName: returnReceiverName,
        receiverDoc: returnReceiverDoc,
        receiverRelationship: returnReceiverRelationship,
        notes: returnNotes,
        signatureDataUrl: returnSignature,
      },
    };

    const parsed = CreateConsentFormSchema.safeParse(payload);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((issue) => issue.message);
      setValidationErrors(Array.from(new Set(messages)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsSubmitting(true);
      const createdRecord = await createAndSignConsentForm(
        parsed.data,
        currentUser,
        isOnline
      );
      onSuccessCreated(createdRecord);
    } catch (err) {
      setValidationErrors([
        err instanceof Error ? err.message : 'Error inesperado al firmar el formato.',
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Banner de Errores de Validación Zod */}
      {validationErrors.length > 0 && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-4 text-red-900 shadow-md">
          <div className="flex items-center gap-2 font-bold text-red-800">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            Por favor complete los siguientes requisitos obligatorios antes de firmar y cerrar el
            formato:
          </div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs font-medium text-red-800">
            {validationErrors.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SECCIÓN 1: ENCABEZADO AUTOMÁTICO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Paso 1 de 6 — Encabezado Clínico Automático
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Datos de Trazabilidad del Formato Institucional
            </h2>
          </div>

          <button
            type="button"
            onClick={handleFillPediatricDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Cargar Ejemplo Paciente Menor (11 años)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
              <Hash className="h-3.5 w-3.5 text-blue-600" />
              Número de Formato (Autogenerado)
            </label>
            <p className="mt-1 font-mono text-base font-extrabold text-blue-900">
              {nextFormNumber}
            </p>
            <p className="text-[11px] text-slate-500">
              Código SGC: {template.qualityFormatCode} (v{template.qualityVersion})
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">
              <CalendarClock className="h-3.5 w-3.5 text-blue-600" />
              Fecha y Hora (Autogeneradas)
            </label>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {currentTimestamp || 'Sincronizando reloj clínico...'}
            </p>
            <p className="text-[11px] text-slate-500">
              Estampado cronológico inalterable (Res. 1995/1999)
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-700">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Sede / Servicio Hospitalario *
            </label>
            <select
              value={facilityService}
              onChange={(e) => setFacilityService(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              {template.availableFacilities.map((facility) => (
                <option key={facility} value={facility}>
                  {facility}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: IDENTIFICACIÓN DEL PACIENTE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-slate-100 pb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Paso 2 de 6 — Datos del Paciente
          </span>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Identificación del Paciente y Competencia Legal
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700">
              Nombre Completo del Paciente *
            </label>
            <input
              type="text"
              value={patientFullName}
              onChange={(e) => setPatientFullName(e.target.value)}
              placeholder="Ej. Juan Carlos Rodríguez Pérez"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-700">
              Tipo de Documento *
            </label>
            <select
              value={patientDocType}
              onChange={(e) => setPatientDocType(e.target.value as IdentificationDocType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              N° de Documento *
            </label>
            <input
              type="text"
              value={patientDocNumber}
              onChange={(e) => setPatientDocNumber(e.target.value)}
              placeholder="Ej. 1020304050"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Edad (Años) *
            </label>
            <input
              type="number"
              min={0}
              max={130}
              value={patientAge}
              onChange={(e) => setPatientAge(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-12">
            <label className="block text-xs font-semibold text-slate-700">
              Motivo de Consulta / Diagnóstico de Ingreso *
            </label>
            <input
              type="text"
              value={consultationReason}
              onChange={(e) => setConsultationReason(e.target.value)}
              placeholder="Describa el motivo de ingreso u hospitalización..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Interruptor de Incapacidad / Alteración de Conciencia */}
          <div className="md:col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-start gap-2.5">
                <input
                  id="patient-incapacitated"
                  type="checkbox"
                  checked={isIncapacitated}
                  onChange={(e) => setIsIncapacitated(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="patient-incapacitated" className="text-xs text-slate-700">
                  <strong className="block text-sm text-slate-900">
                    ¿El paciente presenta incapacidad física, neurológica o alteración del estado de
                    conciencia para firmar?
                  </strong>
                  Si se activa esta casilla (o si la edad es menor a 18 años), el sistema exigirá
                  obligatoriamente los datos y firma del Acudiente Responsable.
                </label>
              </div>

              {patientAge < 18 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  <ShieldAlert className="h-4 w-4" />
                  Menor de edad ({patientAge} años): Acudiente Obligatorio Activo
                </span>
              )}
            </div>

            {isIncapacitated && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-amber-900">
                  Especifique la causa clínica de incapacidad para firmar *
                </label>
                <input
                  type="text"
                  value={incapacityReason}
                  onChange={(e) => setIncapacityReason(e.target.value)}
                  placeholder="Ej. Paciente bajo sedación, deterioro neurológico, trauma en miembro superior dominante..."
                  className="mt-1 w-full rounded-lg border border-amber-400 bg-amber-50/40 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Firma del Paciente (Solo si NO requiere acudiente obligatorio) */}
          {!requiresGuardian && (
            <div className="md:col-span-12">
              <SignaturePad
                label="Firma de Identificación del Paciente Titular *"
                signerName={patientFullName || 'Paciente Adulto Capaz'}
                sublabel="El paciente es mayor de edad y competente para firmar por sí mismo"
                value={patientSignature}
                onChange={setPatientSignature}
              />
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN 3: ACUDIENTE / REPRESENTANTE LEGAL */}
      <section
        className={`rounded-2xl border-2 p-5 shadow-sm transition ${
          requiresGuardian
            ? 'border-amber-400 bg-amber-50/30'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                requiresGuardian
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Paso 3 de 6 — Datos del Acudiente{' '}
              {requiresGuardian ? '(OBLIGATORIO POR REGLA CLÍNICA)' : '(Opcional — Paciente Capaz)'}
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Acudiente o Representante Legal Responsable
            </h2>
          </div>

          {requiresGuardian && (
            <div className="rounded-lg border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
              Activado automáticamente: {patientAge < 18 ? 'Paciente menor de 18 años' : 'Paciente incapaz'}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700">
              Nombre Completo del Acudiente {requiresGuardian && '*'}
            </label>
            <input
              type="text"
              value={guardianFullName}
              onChange={(e) => setGuardianFullName(e.target.value)}
              placeholder="Nombre y apellidos del acudiente"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Tipo Doc. {requiresGuardian && '*'}
            </label>
            <select
              value={guardianDocType}
              onChange={(e) => setGuardianDocType(e.target.value as IdentificationDocType)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              {DOC_TYPES.slice(0, 6).map((dt) => (
                <option key={dt.value} value={dt.value}>
                  {dt.value}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              N° Documento {requiresGuardian && '*'}
            </label>
            <input
              type="text"
              value={guardianDocNumber}
              onChange={(e) => setGuardianDocNumber(e.target.value)}
              placeholder="Documento"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Parentesco {requiresGuardian && '*'}
            </label>
            <input
              type="text"
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              placeholder="Madre, Padre, Hijo/a..."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">
              Teléfono {requiresGuardian && '*'}
            </label>
            <input
              type="tel"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="Ej. 3101234567"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-12">
            <SignaturePad
              label={`Firma Digital del Acudiente ${requiresGuardian ? '*' : '(Opcional)'}`}
              signerName={guardianFullName || 'Acudiente'}
              sublabel="Representante del paciente ante los consentimientos clínicos y entrega de pertenencias"
              value={guardianSignature}
              onChange={setGuardianSignature}
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: TRES CONSENTIMIENTOS INDEPENDIENTES */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <FileSignature className="h-3.5 w-3.5" />
              Paso 4 de 6 — Consentimientos Informados Independientes
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Aceptación o Rechazo Individual con Firma por cada Acto Clínico
            </h2>
          </div>

          {primarySignerSignature && (
            <button
              type="button"
              onClick={handleCopyPrimarySignatureToConsents}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              <CopyCheck className="h-4 w-4" />
              Aplicar firma de {primarySignerName} en los 3 consentimientos
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* 4.1 Hospitalización */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                4.1 Consentimiento Informado de Hospitalización *
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHospDecision('ACCEPTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    hospDecision === 'ACCEPTED'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  ACEPTO HOSPITALIZACIÓN
                </button>
                <button
                  type="button"
                  onClick={() => setHospDecision('REJECTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    hospDecision === 'REJECTED'
                      ? 'bg-red-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  RECHAZO / DISENTIMIENTO
                </button>
              </div>
            </div>
            <p className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 text-justify text-xs leading-relaxed text-slate-700">
              {template.hospitalizationConsentText}
            </p>
            <div className="mt-3">
              <SignaturePad
                label="Firma del Consentimiento de Hospitalización *"
                signerName={primarySignerName}
                value={hospSignature}
                onChange={setHospSignature}
              />
            </div>
          </div>

          {/* 4.2 Procedimientos de Enfermería */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                4.2 Consentimiento de Procedimientos de Enfermería *
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNursingDecision('ACCEPTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    nursingDecision === 'ACCEPTED'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  ACEPTO PROCEDIMIENTOS
                </button>
                <button
                  type="button"
                  onClick={() => setNursingDecision('REJECTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    nursingDecision === 'REJECTED'
                      ? 'bg-red-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  RECHAZO / DISENTIMIENTO
                </button>
              </div>
            </div>
            <p className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 text-justify text-xs leading-relaxed text-slate-700">
              {template.nursingProceduresConsentText}
            </p>
            <div className="mt-3">
              <SignaturePad
                label="Firma del Consentimiento de Procedimientos de Enfermería *"
                signerName={primarySignerName}
                value={nursingSignature}
                onChange={setNursingSignature}
              />
            </div>
          </div>

          {/* 4.3 Presencia de Estudiantes en Prácticas */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">
                4.3 Consentimiento de Presencia de Estudiantes en Prácticas *
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudentsDecision('ACCEPTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    studentsDecision === 'ACCEPTED'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  ACEPTO ESTUDIANTES
                </button>
                <button
                  type="button"
                  onClick={() => setStudentsDecision('REJECTED')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    studentsDecision === 'REJECTED'
                      ? 'bg-red-600 text-white shadow'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  RECHAZO ESTUDIANTES
                </button>
              </div>
            </div>
            <p className="mt-2.5 rounded-lg border border-slate-200 bg-white p-3 text-justify text-xs leading-relaxed text-slate-700">
              {template.studentPresenceConsentText}
            </p>
            <div className="mt-3">
              <SignaturePad
                label="Firma del Consentimiento de Presencia de Estudiantes *"
                signerName={primarySignerName}
                value={studentsSignature}
                onChange={setStudentsSignature}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: RECIBO DE PERTENENCIAS Y ACTA DE DEVOLUCIÓN DE LO NO APTO */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <Backpack className="h-3.5 w-3.5" />
              Paso 5 de 6 — Recibo de Pertenencias y Acta de Devolución
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Inventario Dinámico de Pertenencias (&quot;Apta&quot; / &quot;No Apta&quot;) y Efectivo
            </h2>
          </div>

          <button
            type="button"
            onClick={handleAddBelongingItem}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Agregar Pertenencia
          </button>
        </div>

        {/* Lista dinámica de pertenencias */}
        <div className="space-y-3">
          {belongingItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              El paciente no registra pertenencias físicas. Pulse &quot;Agregar Pertenencia&quot; si
              desea inventariar objetos.
            </div>
          ) : (
            belongingItems.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 md:grid-cols-12"
              >
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Ítem #{idx + 1} *
                  </label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      handleUpdateBelongingItem(item.id, 'itemName', e.target.value)
                    }
                    placeholder="Ej. Prótesis dental, Reloj, Ropa..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Descripción / Estado *
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleUpdateBelongingItem(item.id, 'description', e.target.value)
                    }
                    placeholder="Color, marca, estado físico observado..."
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-600">Cant. *</label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateBelongingItem(item.id, 'quantity', Number(e.target.value))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-center text-xs font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Clasificación en Servicio *
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateBelongingItem(item.id, 'suitability', 'APTA')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        item.suitability === 'APTA'
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      Apta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateBelongingItem(item.id, 'suitability', 'NO_APTA')}
                      className={`rounded-lg py-1.5 text-xs font-bold transition ${
                        item.suitability === 'NO_APTA'
                          ? 'bg-amber-600 text-white'
                          : 'border border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      No Apta
                    </button>
                  </div>
                </div>

                <div className="flex justify-end md:col-span-1">
                  <button
                    type="button"
                    onClick={() => handleRemoveBelongingItem(item.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100"
                    title="Eliminar ítem"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Monto de dinero y observaciones */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700">
              Monto de Dinero en Efectivo ($ COP) *
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={cashAmount}
              onChange={(e) => setCashAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-8">
            <label className="block text-xs font-semibold text-slate-700">
              Observaciones del Inventario de Pertenencias
            </label>
            <input
              type="text"
              value={belongingsObservations}
              onChange={(e) => setBelongingsObservations(e.target.value)}
              placeholder="Anotaciones adicionales sobre custodia o estado de objetos..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Firmas de Entrega y Recepción */}
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nombre de Quien Entrega las Pertenencias *
            </label>
            <input
              type="text"
              value={deliveredByName}
              onChange={(e) => setDeliveredByName(e.target.value)}
              placeholder="Paciente o familiar que entrega"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
            <SignaturePad
              label="Firma de Quien Entrega Pertenencias *"
              signerName={deliveredByName}
              value={deliveredBySignature}
              onChange={setDeliveredBySignature}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nombre de Quien Recibe (Personal de Enfermería) *
            </label>
            <input
              type="text"
              value={receivedByName}
              onChange={(e) => setReceivedByName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            />
            <SignaturePad
              label="Firma de Quien Recibe (Enfermería) *"
              signerName={receivedByName}
              value={receivedBySignature}
              onChange={setReceivedBySignature}
            />
          </div>
        </div>

        {/* SUBSECCIÓN AUTOMÁTICA: ACTA DE DEVOLUCIÓN DE PERTENENCIAS NO APTAS */}
        {nonSuitableItems.length > 0 && (
          <div className="mt-6 rounded-2xl border-2 border-amber-500 bg-amber-50/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                  Acta de Devolución Obligatoria ({nonSuitableItems.length} ítem(s) &quot;No Apto&quot;)
                </span>
                <h3 className="mt-1 text-base font-bold text-amber-950">
                  Acta de Devolución Inmediata de Elementos No Aptos para Hospitalización
                </h3>
              </div>
            </div>

            <div className="mb-3 rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-slate-700">
              <strong>Elementos objeto de devolución en esta acta: </strong>
              {nonSuitableItems
                .map((item) => `${item.itemName || 'Ítem sin nombre'} (Cant: ${item.quantity})`)
                .join(' • ')}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Nombre de Quien Recibe la Devolución *
                </label>
                <input
                  type="text"
                  value={returnReceiverName}
                  onChange={(e) => setReturnReceiverName(e.target.value)}
                  placeholder="Familiar / Acudiente que retira lo no apto"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Documento de Identidad *
                </label>
                <input
                  type="text"
                  value={returnReceiverDoc}
                  onChange={(e) => setReturnReceiverDoc(e.target.value)}
                  placeholder="Número de documento"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Parentesco / Vínculo *
                </label>
                <input
                  type="text"
                  value={returnReceiverRelationship}
                  onChange={(e) => setReturnReceiverRelationship(e.target.value)}
                  placeholder="Esposo/a, Madre, Hijo/a..."
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Constancia de Entrega de Elementos No Aptos
                </label>
                <input
                  type="text"
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <SignaturePad
                  label="Firma Exclusiva del Acta de Devolución de lo No Apto *"
                  signerName={returnReceiverName || 'Receptor de Devolución'}
                  sublabel="Certifica que recibe a satisfacción los objetos clasificados como No Aptos"
                  value={returnSignature}
                  onChange={setReturnSignature}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 6: AUTORIZACIÓN LEY 1581 DE 2012 Y CIERRE INMUTABLE */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            <UserCheck className="h-3.5 w-3.5" />
            Paso 6 de 6 — Cumplimiento Legal Colombia (Ley 1581/2012, Ley 527/1999, Res. 1995/1999)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <input
              id="habeas-data-check"
              type="checkbox"
              checked={habeasDataAccepted}
              onChange={(e) => setHabeasDataAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="habeas-data-check" className="text-xs leading-relaxed text-slate-700">
              <strong className="block text-sm text-slate-900">
                Autorización de Tratamiento de Datos Personales y Sensibles de Salud (Ley 1581 de
                2012) y Firma Electrónica (Ley 527 de 1999) *
              </strong>
              {template.habeasDataLegalText}
            </label>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700">
              Advertencia de Inmutabilidad (Resolución 1995 de 1999):
            </p>
            <p>
              Una vez firmado y guardado este formato, quedará bloqueado contra edición y se
              generará su sello SHA-256.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
          >
            <FileSignature className="h-5 w-5" />
            {isSubmitting
              ? 'Sellando criptográficamente...'
              : 'Firmar, Sellar y Generar Formato Oficial'}
          </button>
        </div>
      </section>
    </form>
  );
}
