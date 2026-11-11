'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  History,
  Lock,
  Save,
  ShieldCheck,
} from 'lucide-react';
import type { ClinicalUser } from '@/modules/auth/types/auth.types';
import {
  exportClinicalBackupJson,
  saveInstitutionalTemplate,
} from '../services/consent-storage.service';
import type {
  AuditLogEntry,
  InstitutionalTemplateConfig,
} from '../types/consent.types';

export interface AdminPanelProps {
  currentUser: ClinicalUser;
  template: InstitutionalTemplateConfig;
  auditLogs: AuditLogEntry[];
  onTemplateSaved: (updated: InstitutionalTemplateConfig) => void;
  onBackupTriggered: () => void;
}

export function AdminPanel({
  currentUser,
  template,
  auditLogs,
  onTemplateSaved,
  onBackupTriggered,
}: AdminPanelProps) {
  const [draft, setDraft] = useState<InstitutionalTemplateConfig>(template);
  const [savedNotice, setSavedNotice] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const handleSaveTemplate = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isAdmin) return;
    const saved = saveInstitutionalTemplate(draft, currentUser);
    onTemplateSaved(saved);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleDownloadBackup = () => {
    const jsonContent = exportClinicalBackupJson(currentUser);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respaldo-consentimientos-clinicos-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onBackupTriggered();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. CHECKLIST DE GOBERNANZA INSTITUCIONAL ("ANTES DE DESARROLLAR / SALIR A PRODUCCIÓN") */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              Gobernanza Clínica y Autorizaciones Institucionales
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Estado de Requisitos Previos Institucionales (Calidad, Jurídica y Sistemas)
            </h2>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800"
          >
            <Download className="h-4 w-4" />
            Exportar Copia de Seguridad (JSON)
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            {
              key: 'qualityApproved' as const,
              title: 'Aval de Comité de Calidad (SGC)',
              desc: 'Código de formato, versión y estructura de campos validados.',
            },
            {
              key: 'legalApproved' as const,
              title: 'Aval de Oficina Jurídica',
              desc: 'Cumplimiento Ley 1581/2012, Res. 1995/1999 y Firma Ley 527/1999.',
            },
            {
              key: 'systemsApproved' as const,
              title: 'Aval de Sistemas / Seguridad TI',
              desc: 'Cifrado local, políticas RLS en Supabase y copias de seguridad.',
            },
            {
              key: 'physicalFormatCollected' as const,
              title: 'Homologación con Formato Físico Oficial',
              desc: 'Textos oficiales y diseño de PDF alineados con el formato impreso.',
            },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs"
            >
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={draft.approvedByCommittees[item.key]}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    approvedByCommittees: {
                      ...draft.approvedByCommittees,
                      [item.key]: e.target.checked,
                    },
                  })
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <div>
                <span className="font-bold text-slate-900">{item.title}</span>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* 2. PARAMETRIZACIÓN DE TEXTOS OFICIALES DE LOS CONSENTIMIENTOS */}
      <form
        onSubmit={handleSaveTemplate}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              <FileText className="h-3.5 w-3.5" />
              Textos Oficiales Aprobados por la Institución
            </span>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Configuración de Encabezado SGC y Textos Legales de Consentimientos
            </h2>
          </div>

          {!isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              <Lock className="h-3.5 w-3.5" />
              Modo Lectura (Solo Administrador puede editar textos oficiales)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Nombre de la Institución (IPS / Clínica)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={draft.institutionName}
              onChange={(e) => setDraft({ ...draft, institutionName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Código Oficial del Formato (SGC)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={draft.qualityFormatCode}
              onChange={(e) => setDraft({ ...draft, qualityFormatCode: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Versión Vigente
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={draft.qualityVersion}
              onChange={(e) => setDraft({ ...draft, qualityVersion: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800">
              1. Texto Oficial — Consentimiento de Hospitalización
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={draft.hospitalizationConsentText}
              onChange={(e) =>
                setDraft({ ...draft, hospitalizationConsentText: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800">
              2. Texto Oficial — Consentimiento de Procedimientos de Enfermería
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={draft.nursingProceduresConsentText}
              onChange={(e) =>
                setDraft({ ...draft, nursingProceduresConsentText: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800">
              3. Texto Oficial — Consentimiento de Presencia de Estudiantes en Prácticas
            </label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={draft.studentPresenceConsentText}
              onChange={(e) =>
                setDraft({ ...draft, studentPresenceConsentText: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800">
              4. Cláusula de Protección de Datos Sensibles (Ley 1581 de 2012 y Firma Ley 527 de 1999)
            </label>
            <textarea
              rows={2}
              disabled={!isAdmin}
              value={draft.habeasDataLegalText}
              onChange={(e) => setDraft({ ...draft, habeasDataLegalText: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed disabled:bg-slate-100"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="mt-4 flex items-center justify-end gap-3">
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Textos institucionales actualizados y registrados en auditoría
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-500"
            >
              <Save className="h-4 w-4" />
              Guardar Textos Oficiales
            </button>
          </div>
        )}
      </form>

      {/* 3. BITÁCORA INMUTABLE DE AUDITORÍA Y TRAZABILIDAD */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <History className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Bitácora de Auditoría y Trazabilidad Clínica ({auditLogs.length} eventos)
            </h2>
            <p className="text-xs text-slate-500">
              Registro inalterable de quién creó, firmó, exportó o anuló cada formato
            </p>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-3 py-2">Fecha / Hora</th>
                <th className="px-3 py-2">Formato</th>
                <th className="px-3 py-2">Acción</th>
                <th className="px-3 py-2">Usuario / Rol</th>
                <th className="px-3 py-2">Detalle de Trazabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px] text-slate-500">
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono font-bold text-blue-800">
                    {log.formNumber}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-800">
                    {log.actorName} ({log.actorRole})
                  </td>
                  <td className="px-3 py-2 text-slate-600">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
