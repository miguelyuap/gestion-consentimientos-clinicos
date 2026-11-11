'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  CloudOff,
  FileSearch,
  Lock,
  Printer,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from 'lucide-react';
import type { ClinicalUser } from '@/modules/auth/types/auth.types';
import { getRolePermissions } from '@/modules/auth/services/auth-service';
import type { ClinicalConsentFormRecord } from '../types/consent.types';

export interface ConsentHistoryListProps {
  forms: ClinicalConsentFormRecord[];
  currentUser: ClinicalUser;
  onSelectForPrint: (record: ClinicalConsentFormRecord) => void;
  onAnnulForm: (formId: string, reason: string) => void;
}

export function ConsentHistoryList({
  forms,
  currentUser,
  onSelectForPrint,
  onAnnulForm,
}: ConsentHistoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SIGNED' | 'ANNULLED'>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');

  // Estado del modal de anulación justificada
  const [annullingRecord, setAnnullingRecord] = useState<ClinicalConsentFormRecord | null>(
    null
  );
  const [annulmentReason, setAnnulmentReason] = useState('');
  const [annulmentError, setAnnulmentError] = useState('');

  const permissions = getRolePermissions(currentUser.role);

  const uniqueFacilities = useMemo(() => {
    const set = new Set(forms.map((f) => f.facilityService));
    return Array.from(set);
  }, [forms]);

  const filteredForms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return forms.filter((record) => {
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      const matchesFacility =
        facilityFilter === 'ALL' || record.facilityService === facilityFilter;
      const matchesQuery =
        !q ||
        record.patient.fullName.toLowerCase().includes(q) ||
        record.patient.docNumber.toLowerCase().includes(q) ||
        record.formNumber.toLowerCase().includes(q) ||
        (record.guardian?.fullName.toLowerCase().includes(q) ?? false);

      return matchesStatus && matchesFacility && matchesQuery;
    });
  }, [forms, searchQuery, statusFilter, facilityFilter]);

  const handleConfirmAnnulment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!annullingRecord) return;
    if (annulmentReason.trim().length < 15) {
      setAnnulmentError(
        'Por Resolución 1995 de 1999, la justificación debe tener mínimo 15 caracteres.'
      );
      return;
    }
    try {
      onAnnulForm(annullingRecord.id, annulmentReason.trim());
      setAnnullingRecord(null);
      setAnnulmentReason('');
      setAnnulmentError('');
    } catch (err) {
      setAnnulmentError(
        err instanceof Error ? err.message : 'No fue posible anular el formato.'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* Barra de Búsqueda y Filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-6">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre del paciente, documento, consecutivo o acudiente..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todas las sedes / servicios</option>
              {uniqueFacilities.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'SIGNED' | 'ANNULLED')
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              <option value="ALL">Todos los estados ({forms.length})</option>
              <option value="SIGNED">Firmados Vigentes</option>
              <option value="ANNULLED">Anulados con Justificación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Formatos e Historial por Paciente */}
      {filteredForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <FileSearch className="h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            No se encontraron formatos clínicos
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            Verifique el número de documento o nombre del paciente en el buscador, o cambie los
            filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((record) => {
            const nonSuitableCount = record.belongings.items.filter(
              (i) => i.suitability === 'NO_APTA'
            ).length;

            return (
              <div
                key={record.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                  record.status === 'ANNULLED'
                    ? 'border-red-300 bg-red-50/20'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-blue-900">
                        {record.formNumber}
                      </span>

                      {record.status === 'SIGNED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                          <Lock className="h-3 w-3" />
                          FIRMADO E INMUTABLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900">
                          <AlertOctagon className="h-3 w-3" />
                          ANULADO CON JUSTIFICACIÓN
                        </span>
                      )}

                      {record.syncStatus === 'PENDING_SYNC' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                          <CloudOff className="h-3 w-3" />
                          Guardado Offline (Pendiente Sincronizar)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          Sincronizado
                        </span>
                      )}
                    </div>

                    <h3 className="mt-1.5 flex items-center gap-2 text-base font-bold text-slate-900">
                      <User className="h-4 w-4 text-blue-600" />
                      {record.patient.fullName}{' '}
                      <span className="text-sm font-normal text-slate-600">
                        ({record.patient.docType} {record.patient.docNumber} •{' '}
                        {record.patient.age} años)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      <strong>Servicio:</strong> {record.facilityService} |{' '}
                      <strong>Motivo:</strong> {record.patient.consultationReason}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectForPrint(record)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-500"
                    >
                      <Printer className="h-4 w-4" />
                      Ver Formato / Imprimir PDF
                    </button>

                    {record.status === 'SIGNED' && permissions.canAnnulForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setAnnullingRecord(record);
                          setAnnulmentReason('');
                          setAnnulmentError('');
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <AlertOctagon className="h-4 w-4" />
                        Anular con Justificación
                      </button>
                    )}
                  </div>
                </div>

                {/* Resumen de los 3 consentimientos y pertenencias */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Hospitalización', c: record.consents.hospitalization },
                    { label: 'Proc. Enfermería', c: record.consents.nursingProcedures },
                    { label: 'Estudiantes Práctica', c: record.consents.studentPresence },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-slate-700">{item.label}:</span>
                      {item.c.decision === 'ACCEPTED' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Aceptado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-red-700">
                          <XCircle className="h-3.5 w-3.5" /> Rechazado
                        </span>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                    <span className="font-semibold text-slate-700">Pertenencias:</span>
                    <span className="font-bold text-slate-900">
                      {record.belongings.items.length} ítem(s) ({nonSuitableCount} No Apta)
                    </span>
                  </div>
                </div>

                {record.annulment && (
                  <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-900">
                    <strong>Justificación de Anulación:</strong> {record.annulment.reason} —{' '}
                    <span className="text-red-700">
                      Por {record.annulment.annulledByUserName}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    Diligenciado por: <strong>{record.createdByUserName}</strong> |{' '}
                    {record.requiresGuardian && record.guardian
                      ? `Firmó Acudiente: ${record.guardian.fullName} (${record.guardian.relationship})`
                      : 'Firmó Paciente Titular'}
                  </span>
                  <span className="font-mono">
                    SHA-256: {record.integrityHashSha256.slice(0, 24)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Anulación con Justificación Obligatoria */}
      {annullingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <form
            onSubmit={handleConfirmAnnulment}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2.5 text-red-700">
              <AlertOctagon className="h-6 w-6" />
              <h3 className="text-lg font-bold">
                Anular Formato Clínico {annullingRecord.formNumber}
              </h3>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              De acuerdo con la <strong>Resolución 1995 de 1999</strong>, un formato firmado no
              puede editarse ni eliminarse. Al anularlo, el documento se conservará íntegro en el
              historial con sello de anulación y quedará registrado en la pista de auditoría.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-800">
                Justificación Obligatoria de Anulación (Mínimo 15 caracteres) *
              </label>
              <textarea
                rows={3}
                value={annulmentReason}
                onChange={(e) => setAnnulmentReason(e.target.value)}
                placeholder="Ej. Error en número de documento de identidad reportado por admisiones; se genera nuevo consecutivo..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-red-600 focus:outline-none"
              />
              {annulmentError && (
                <p className="mt-1 text-xs font-semibold text-red-600">{annulmentError}</p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAnnullingRecord(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-500"
              >
                Confirmar Anulación Inmutable
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
