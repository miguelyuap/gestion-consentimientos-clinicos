'use client';

import React from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  FileCheck2,
  Printer,
  ShieldCheck,
  X,
  XCircle,
} from 'lucide-react';
import type { ClinicalConsentFormRecord } from '../types/consent.types';

export interface PrintableConsentPdfProps {
  record: ClinicalConsentFormRecord;
  onClose?: () => void;
  onExportLogged?: (record: ClinicalConsentFormRecord) => void;
}

export function PrintableConsentPdf({
  record,
  onClose,
  onExportLogged,
}: PrintableConsentPdfProps) {
  const nonSuitableItems = record.belongings.items.filter(
    (item) => item.suitability === 'NO_APTA'
  );

  const handlePrintPdf = () => {
    if (onExportLogged) {
      onExportLogged(record);
    }
    window.print();
  };

  const formatCopCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (iso: string): string => {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 p-2 sm:p-6 print:static print:bg-white print:p-0">
      {/* Barra de Acciones Flotante (Oculta al imprimir en PDF) */}
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white shadow-xl print:hidden">
        <div className="flex items-center gap-2.5">
          <FileCheck2 className="h-5 w-5 text-sky-400" />
          <div>
            <p className="text-sm font-semibold">
              Vista Oficial de Impresión / PDF — {record.formNumber}
            </p>
            <p className="text-xs text-slate-300">
              Diseño homologado con formato físico institucional (Resolución 1995 de 1999)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            <Printer className="h-4 w-4" />
            Imprimir / Guardar PDF
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Hoja Oficial del Formato Clínico */}
      <div className="mx-auto max-w-4xl rounded-lg border border-slate-300 bg-white p-5 text-slate-900 shadow-2xl sm:p-8 print:max-w-none print:rounded-none print:border-0 print:p-2 print:shadow-none">
        {/* Sello de ANULADO si aplica */}
        {record.status === 'ANNULLED' && record.annulment && (
          <div className="mb-4 rounded-lg border-2 border-red-600 bg-red-50 p-3 text-red-900">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wide text-red-700">
              <AlertOctagon className="h-5 w-5 shrink-0" />
              DOCUMENTO CLÍNICO ANULADO — SIN VALIDEZ ASISTENCIAL ACTIVA (CONSERVADO POR TRAZABILIDAD RES. 1995/1999)
            </div>
            <p className="mt-1 text-xs">
              <strong>Justificación de Anulación:</strong> {record.annulment.reason}
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              <strong>Anulado por:</strong> {record.annulment.annulledByUserName} |{' '}
              <strong>Fecha/Hora:</strong> {formatDateTime(record.annulment.annulledAt)}
            </p>
          </div>
        )}

        {/* 1. ENCABEZADO SISTEMA DE GESTIÓN DE CALIDAD */}
        <div className="grid grid-cols-12 border-2 border-slate-900 text-xs">
          <div className="col-span-12 flex flex-col justify-center border-b-2 border-slate-900 p-3 sm:col-span-4 sm:border-b-0 sm:border-r-2">
            <p className="font-bold uppercase tracking-tight text-slate-900">
              {record.institutionName}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-600">
              Sistema de Gestión de Calidad — Historia Clínica
            </p>
          </div>

          <div className="col-span-12 flex flex-col items-center justify-center border-b-2 border-slate-900 bg-slate-50 p-3 text-center sm:col-span-5 sm:border-b-0 sm:border-r-2">
            <h1 className="text-xs font-extrabold uppercase leading-tight text-slate-900 sm:text-sm">
              CONSENTIMIENTO INFORMADO INTEGRAL Y RECIBO DE PERTENENCIAS DE PACIENTE
            </h1>
            <span className="mt-1 inline-block rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-800">
              Sede / Servicio: {record.facilityService}
            </span>
          </div>

          <div className="col-span-12 flex flex-col justify-between p-2.5 text-[11px] sm:col-span-3">
            <div className="flex justify-between border-b border-slate-200 pb-1">
              <span className="font-semibold">N° Formato:</span>
              <span className="font-mono font-bold text-blue-800">{record.formNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 py-1">
              <span className="font-semibold">Código SGC:</span>
              <span>
                {record.qualityFormatCode} v{record.qualityVersion}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="font-semibold">Fecha/Hora:</span>
              <span>{formatDateTime(record.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 2. DATOS DEL PACIENTE */}
        <div className="mt-3 border border-slate-800">
          <div className="bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            1. Identificación del Paciente
          </div>
          <div className="grid grid-cols-12 gap-2 p-2.5 text-xs">
            <div className="col-span-12 sm:col-span-6">
              <span className="font-semibold text-slate-600">Nombre Completo: </span>
              <span className="font-bold text-slate-900">{record.patient.fullName}</span>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className="font-semibold text-slate-600">Documento: </span>
              <span className="font-bold text-slate-900">
                {record.patient.docType} {record.patient.docNumber}
              </span>
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className="font-semibold text-slate-600">Edad: </span>
              <span className="font-bold text-slate-900">{record.patient.age} años</span>
              {record.patient.age < 18 && (
                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                  MENOR DE EDAD
                </span>
              )}
            </div>
            <div className="col-span-12 border-t border-slate-200 pt-1.5">
              <span className="font-semibold text-slate-600">
                Motivo de Consulta / Diagnóstico de Ingreso:{' '}
              </span>
              <span className="text-slate-900">{record.patient.consultationReason}</span>
            </div>
            <div className="col-span-12 border-t border-slate-200 pt-1.5">
              <span className="font-semibold text-slate-600">
                Competencia para firmar:{' '}
              </span>
              {record.requiresGuardian ? (
                <span className="font-bold text-amber-800">
                  Requiere Acudiente Obligatorio (
                  {record.patient.age < 18
                    ? 'Paciente menor de 18 años'
                    : `Incapacidad clínica: ${record.patient.incapacityReason}`}
                  )
                </span>
              ) : (
                <span className="font-semibold text-emerald-800">
                  Paciente adulto consciente y autónomo — Firma en nombre propio
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. DATOS DEL ACUDIENTE (Si aplica o si fue registrado) */}
        <div className="mt-3 border border-slate-800">
          <div className="flex items-center justify-between bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <span>2. Identificación del Acudiente / Representante Legal</span>
            <span>
              {record.requiresGuardian ? 'OBLIGATORIO ACTIVADO' : 'NO REQUERIDO (PACIENTE CAPAZ)'}
            </span>
          </div>
          {record.guardian ? (
            <div className="grid grid-cols-12 items-center gap-2 p-2.5 text-xs">
              <div className="col-span-12 sm:col-span-8">
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <span className="font-semibold text-slate-600">Nombre Acudiente: </span>
                    <span className="font-bold">{record.guardian.fullName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Documento: </span>
                    <span className="font-bold">
                      {record.guardian.docType} {record.guardian.docNumber}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Parentesco: </span>
                    <span>{record.guardian.relationship}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Teléfono: </span>
                    <span>{record.guardian.phone}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-12 flex flex-col items-center border-t border-slate-200 pt-2 sm:col-span-4 sm:border-l sm:border-t-0 sm:pl-2 sm:pt-0">
                <img
                  src={record.guardian.signatureDataUrl}
                  alt="Firma Acudiente"
                  className="h-14 object-contain"
                />
                <span className="border-t border-slate-400 px-3 pt-0.5 text-[10px] font-semibold text-slate-700">
                  Firma del Acudiente Responsable
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 text-xs text-slate-600">
              <span>
                No aplica acudiente obligatorio. El paciente firma directamente sus consentimientos.
              </span>
              {record.patient.patientSignatureDataUrl && (
                <div className="flex flex-col items-center">
                  <img
                    src={record.patient.patientSignatureDataUrl}
                    alt="Firma Paciente"
                    className="h-12 object-contain"
                  />
                  <span className="border-t border-slate-400 px-2 text-[10px] font-semibold">
                    Firma de Identificación del Paciente
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. CONSENTIMIENTOS INDEPENDIENTES */}
        <div className="mt-3 border border-slate-800">
          <div className="bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            3. Declaraciones de Consentimientos Informados Independientes
          </div>

          <div className="divide-y divide-slate-300">
            {[
              {
                key: '3.1',
                data: record.consents.hospitalization,
              },
              {
                key: '3.2',
                data: record.consents.nursingProcedures,
              },
              {
                key: '3.3',
                data: record.consents.studentPresence,
              },
            ].map(({ key, data }) => (
              <div key={key} className="grid grid-cols-12 gap-3 p-3 text-xs">
                <div className="col-span-12 sm:col-span-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold uppercase text-slate-900">
                      {key} {data.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
                          data.decision === 'ACCEPTED'
                            ? 'border border-emerald-700 bg-emerald-100 text-emerald-900'
                            : 'text-slate-400'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        [{data.decision === 'ACCEPTED' ? 'X' : ' '}] ACEPTO
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${
                          data.decision === 'REJECTED'
                            ? 'border border-red-700 bg-red-100 text-red-900'
                            : 'text-slate-400'
                        }`}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        [{data.decision === 'REJECTED' ? 'X' : ' '}] RECHAZO
                      </span>
                    </div>
                  </div>
                  <p className="mt-1.5 text-justify text-[11px] leading-relaxed text-slate-700">
                    {data.officialText}
                  </p>
                </div>

                <div className="col-span-12 flex flex-col items-center justify-end border-t border-slate-200 pt-2 sm:col-span-4 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                  <img
                    src={data.signatureDataUrl}
                    alt={`Firma ${data.title}`}
                    className="h-14 object-contain"
                  />
                  <div className="w-full border-t border-slate-400 pt-1 text-center text-[10px]">
                    <p className="font-semibold text-slate-800">
                      Firma de quien {data.decision === 'ACCEPTED' ? 'Acepta' : 'Rechaza'}
                    </p>
                    <p className="text-slate-500">
                      {record.requiresGuardian && record.guardian
                        ? `${record.guardian.fullName} (Acudiente)`
                        : `${record.patient.fullName} (Paciente)`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. RECIBO DE PERTENENCIAS Y VALORES */}
        <div className="mt-3 border border-slate-800">
          <div className="bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            4. Recibo e Inventario de Pertenencias del Paciente
          </div>

          <div className="p-3 text-xs">
            {record.belongings.items.length > 0 ? (
              <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-400 px-2 py-1">#</th>
                    <th className="border border-slate-400 px-2 py-1">Ítem / Pertenencia</th>
                    <th className="border border-slate-400 px-2 py-1">Descripción y Estado</th>
                    <th className="border border-slate-400 px-2 py-1 text-center">Cant.</th>
                    <th className="border border-slate-400 px-2 py-1 text-center">
                      Clasificación Servicio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {record.belongings.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="border border-slate-300 px-2 py-1 font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-2 py-1 font-semibold">
                        {item.itemName}
                      </td>
                      <td className="border border-slate-300 px-2 py-1">{item.description}</td>
                      <td className="border border-slate-300 px-2 py-1 text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                            item.suitability === 'APTA'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.suitability === 'APTA'
                            ? 'APTA (Permanece)'
                            : 'NO APTA (Devolver)'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded border border-slate-200 bg-slate-50 p-2 text-center text-slate-600">
                El paciente ingresa sin pertenencias materiales registradas.
              </p>
            )}

            <div className="mt-2.5 grid grid-cols-12 gap-2 rounded border border-slate-300 bg-slate-50 p-2">
              <div className="col-span-12 sm:col-span-4">
                <span className="font-semibold text-slate-700">Monto de Dinero Declarado: </span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCopCurrency(record.belongings.cashAmount)}
                </span>
              </div>
              <div className="col-span-12 sm:col-span-8">
                <span className="font-semibold text-slate-700">Observaciones: </span>
                <span>
                  {record.belongings.observations || 'Sin observaciones adicionales.'}
                </span>
              </div>
            </div>

            {/* Firmas de Entrega y Recepción de Pertenencias */}
            <div className="mt-3 grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
              <div className="flex flex-col items-center rounded border border-slate-300 p-2">
                <img
                  src={record.belongings.deliveredBySignature}
                  alt="Firma Entrega"
                  className="h-14 object-contain"
                />
                <div className="w-full border-t border-slate-400 pt-1 text-center text-[10px]">
                  <p className="font-bold uppercase text-slate-800">
                    Firma de Quien Entrega Pertenencias
                  </p>
                  <p className="text-slate-600">{record.belongings.deliveredByName}</p>
                </div>
              </div>

              <div className="flex flex-col items-center rounded border border-slate-300 p-2">
                <img
                  src={record.belongings.receivedBySignature}
                  alt="Firma Recibe Enfermería"
                  className="h-14 object-contain"
                />
                <div className="w-full border-t border-slate-400 pt-1 text-center text-[10px]">
                  <p className="font-bold uppercase text-slate-800">
                    Firma de Quien Recibe (Enfermería)
                  </p>
                  <p className="text-slate-600">{record.belongings.receivedByName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. ACTA DE DEVOLUCIÓN DE PERTENENCIAS NO APTAS */}
        <div className="mt-3 border border-slate-800">
          <div className="flex items-center justify-between bg-amber-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <span>5. Acta de Devolución de Pertenencias No Aptas</span>
            <span>
              {nonSuitableItems.length > 0
                ? `${nonSuitableItems.length} ÍTEM(S) NO APTO(S) DEVUELTO(S)`
                : 'SIN ÍTEMS NO APTOS'}
            </span>
          </div>

          {nonSuitableItems.length > 0 && record.returnAct ? (
            <div className="grid grid-cols-12 items-center gap-3 p-3 text-xs">
              <div className="col-span-12 sm:col-span-8">
                <p className="text-[11px] text-slate-700">
                  Por medio de la presente acta se hace entrega formal y devolución inmediata de los
                  siguientes elementos clasificados como <strong>NO APTOS</strong> para permanecer en
                  el servicio de hospitalización:{' '}
                  <strong>
                    {nonSuitableItems
                      .map((item) => `${item.itemName} (x${item.quantity})`)
                      .join(', ')}
                  </strong>
                  .
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>
                    <span className="font-semibold text-slate-600">Recibe conforme: </span>
                    <span className="font-bold">{record.returnAct.receiverName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Documento: </span>
                    <span className="font-bold">{record.returnAct.receiverDoc}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Parentesco/Vínculo: </span>
                    <span>{record.returnAct.receiverRelationship}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Fecha/Hora Entrega: </span>
                    <span>{formatDateTime(record.returnAct.returnedAt)}</span>
                  </div>
                </div>
                {record.returnAct.notes && (
                  <p className="mt-1 text-[11px] text-slate-600">
                    <strong>Constancia:</strong> {record.returnAct.notes}
                  </p>
                )}
              </div>

              <div className="col-span-12 flex flex-col items-center border-t border-slate-200 pt-2 sm:col-span-4 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                <img
                  src={record.returnAct.signatureDataUrl}
                  alt="Firma Acta Devolución"
                  className="h-14 object-contain"
                />
                <div className="w-full border-t border-slate-400 pt-1 text-center text-[10px]">
                  <p className="font-bold uppercase text-slate-800">
                    Firma Acta de Devolución (Lo No Apto)
                  </p>
                  <p className="text-slate-600">
                    {record.returnAct.receiverName} — Doc: {record.returnAct.receiverDoc}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="p-2.5 text-xs text-slate-600">
              No se registraron elementos clasificados como &quot;No Aptos&quot; pendientes de
              devolución en este ingreso.
            </p>
          )}
        </div>

        {/* 7. PIE LEGAL: HABEAS DATA (LEY 1581) + FIRMA ELECTRÓNICA (LEY 527) */}
        <div className="mt-3 rounded border border-slate-300 bg-slate-50 p-2.5 text-[10px] leading-snug text-slate-600">
          <p>
            <strong>PROTECCIÓN DE DATOS PERSONALES Y SENSIBLES (LEY 1581 DE 2012):</strong>{' '}
            {record.habeasDataTextSnapshot}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-1.5 font-mono text-[10px] text-slate-700">
            <span className="inline-flex items-center gap-1 font-sans font-semibold text-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Diligenciado por: {record.createdByUserName} ({record.createdByRole})
            </span>
            <span>
              Sello Criptográfico SHA-256 (Ley 527/1999): {record.integrityHashSha256.slice(0, 32)}...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
