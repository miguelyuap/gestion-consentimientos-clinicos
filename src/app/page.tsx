'use client';

import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  CloudOff,
  FilePlus2,
  KeyRound,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Stethoscope,
  Wifi,
} from 'lucide-react';
import {
  authenticateClinicalUser,
  DEMO_CLINICAL_USERS,
  getRolePermissions,
} from '@/modules/auth/services/auth-service';
import type { ClinicalUser } from '@/modules/auth/types/auth.types';
import { AdminPanel } from '@/modules/consents/components/AdminPanel';
import { ConsentFormWizard } from '@/modules/consents/components/ConsentFormWizard';
import { ConsentHistoryList } from '@/modules/consents/components/ConsentHistoryList';
import { PrintableConsentPdf } from '@/modules/consents/components/PrintableConsentPdf';
import {
  annulClinicalConsentForm,
  appendAuditLog,
  DEFAULT_INSTITUTIONAL_TEMPLATE,
  generateNextFormNumber,
  getAllAuditLogs,
  getAllConsentForms,
  getInstitutionalTemplate,
  hydrateClinicalStateFromSupabase,
  syncPendingOfflineForms,
} from '@/modules/consents/services/consent-storage.service';
import type {
  AuditLogEntry,
  ClinicalConsentFormRecord,
  InstitutionalTemplateConfig,
} from '@/modules/consents/types/consent.types';

type ActiveTab = 'CREATE' | 'HISTORY' | 'ADMIN';

export default function ClinicalConsentsPlatformPage() {
  const [currentUser, setCurrentUser] = useState<ClinicalUser | null>(
    DEMO_CLINICAL_USERS[0]
  );
  const [loginUsername, setLoginUsername] = useState('enfermeria');
  const [loginPassword, setLoginPassword] = useState('Enfermeria2026*');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<ActiveTab>('CREATE');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [forms, setForms] = useState<ClinicalConsentFormRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [template, setTemplate] = useState<InstitutionalTemplateConfig>(
    DEFAULT_INSTITUTIONAL_TEMPLATE
  );
  const [printingRecord, setPrintingRecord] =
    useState<ClinicalConsentFormRecord | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string>('');

  const refreshData = () => {
    setForms(getAllConsentForms());
    setAuditLogs(getAllAuditLogs());
    setTemplate(getInstitutionalTemplate());
  };

  useEffect(() => {
    refreshData();
    void hydrateClinicalStateFromSupabase().then((cloudState) => {
      if (cloudState.connectedToCloud) {
        setForms(cloudState.forms);
        setAuditLogs(cloudState.auditLogs);
        setTemplate(cloudState.template);
      }
    });
    if (typeof window !== 'undefined') {
      setIsOnline(window.navigator.onLine);
      const onOnline = () => {
        setIsOnline(true);
        void hydrateClinicalStateFromSupabase().then((cloudState) => {
          if (cloudState.connectedToCloud) {
            setForms(cloudState.forms);
            setAuditLogs(cloudState.auditLogs);
            setTemplate(cloudState.template);
          }
        });
      };
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }
  }, []);

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const res = authenticateClinicalUser(loginUsername, loginPassword);
    if (!res.success) {
      setLoginError(res.error);
      return;
    }
    setLoginError('');
    setCurrentUser(res.user);
    setActiveTab(res.user.role === 'viewer' ? 'HISTORY' : 'CREATE');
  };

  const handleQuickRoleSwitch = (user: ClinicalUser) => {
    setCurrentUser(user);
    if (user.role === 'viewer' && activeTab === 'CREATE') {
      setActiveTab('HISTORY');
    }
  };

  const handleSyncOfflineQueue = async () => {
    if (!currentUser) return;
    const count = await syncPendingOfflineForms(currentUser);
    refreshData();
    setBannerMessage(
      count > 0
        ? `Se sincronizaron exitosamente ${count} formato(s) pendientes con el servidor central.`
        : 'Todos los formatos están sincronizados.'
    );
    setTimeout(() => setBannerMessage(''), 4000);
  };

  const handleAnnulForm = (formId: string, reason: string) => {
    if (!currentUser) return;
    annulClinicalConsentForm({ formId, reason }, currentUser);
    refreshData();
    setBannerMessage('Formato anulado con justificación y registrado en auditoría.');
    setTimeout(() => setBannerMessage(''), 4000);
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900">
                Consentimientos y Pertenencias HC
              </h1>
              <p className="text-xs text-slate-500">
                Acceso Cifrado y Trazabilidad Clínica — GST-SOFTWARE
              </p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Usuario Institucional
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">Contraseña</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </div>

            {loginError && (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-600">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow hover:bg-blue-500"
            >
              <KeyRound className="h-4 w-4" />
              Ingresar al Sistema Clínico
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <p className="font-bold text-slate-700">
              Cuentas Institucionales de Prueba (Clic para autocompletar):
            </p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('enfermeria');
                  setLoginPassword('Enfermeria2026*');
                }}
                className="rounded-lg border border-slate-300 bg-white p-1.5 font-semibold text-slate-700 hover:bg-blue-50"
              >
                Enfermería
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('consulta');
                  setLoginPassword('Consulta2026*');
                }}
                className="rounded-lg border border-slate-300 bg-white p-1.5 font-semibold text-slate-700 hover:bg-blue-50"
              >
                Consulta
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginUsername('admin');
                  setLoginPassword('Admin2026*');
                }}
                className="rounded-lg border border-slate-300 bg-white p-1.5 font-semibold text-slate-700 hover:bg-blue-50"
              >
                Administrador
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const permissions = getRolePermissions(currentUser.role);
  const pendingOfflineCount = forms.filter((f) => f.syncStatus === 'PENDING_SYNC').length;
  const nextFormNumber = generateNextFormNumber(forms);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Modal de Vista PDF Imprimible */}
      {printingRecord && (
        <PrintableConsentPdf
          record={printingRecord}
          onClose={() => setPrintingRecord(null)}
          onExportLogged={(rec) => {
            appendAuditLog({
              formId: rec.id,
              formNumber: rec.formNumber,
              action: 'PDF_EXPORTED',
              actorId: currentUser.id,
              actorName: currentUser.fullName,
              actorRole: currentUser.role,
              details: `Generación de vista PDF / Impresión del formato ${rec.formNumber}.`,
            });
            refreshData();
          }}
        />
      )}

      {/* Barra Superior Institucional (Oculta al imprimir) */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900 text-white shadow-md print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight">
                  Consentimientos Clínicos y Pertenencias
                </h1>
                <span className="hidden rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-300 sm:inline-block">
                  Ley 1581 • Res. 1995 • Ley 527
                </span>
              </div>
              <p className="text-xs text-slate-300">{template.institutionName}</p>
            </div>
          </div>

          {/* Controles de Red Offline/Online y Cambio Rápido de Rol */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Simulador / Indicador de Modo Offline */}
            <button
              type="button"
              onClick={() => setIsOnline((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                isOnline
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-amber-500 text-slate-950 shadow'
              }`}
              title="Haga clic para simular desconexión o reconexión de internet en la tablet"
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5" />
                  En Línea (Sincronizado)
                </>
              ) : (
                <>
                  <CloudOff className="h-3.5 w-3.5" />
                  Modo Offline Activo
                </>
              )}
            </button>

            {pendingOfflineCount > 0 && isOnline && (
              <button
                type="button"
                onClick={handleSyncOfflineQueue}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow hover:bg-sky-400"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Sincronizar ({pendingOfflineCount})
              </button>
            )}

            {/* Selector rápido de Rol para Pruebas */}
            <div className="flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1 text-xs">
              {DEMO_CLINICAL_USERS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickRoleSwitch(u)}
                  className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                    currentUser.id === u.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {u.role === 'nursing'
                    ? 'Enfermería'
                    : u.role === 'viewer'
                      ? 'Consulta'
                      : 'Admin'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCurrentUser(null)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Cerrar sesión"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Sub-barra de Navegación y Usuario Activo */}
        <div className="border-t border-slate-800 bg-slate-950/60 px-4 py-2">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <nav className="flex flex-wrap items-center gap-1.5">
              {permissions.canCreateForm && (
                <button
                  type="button"
                  onClick={() => setActiveTab('CREATE')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    activeTab === 'CREATE'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FilePlus2 className="h-4 w-4" />
                  Diligenciar Formato ({nextFormNumber})
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveTab('HISTORY')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === 'HISTORY'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Historial y Búsqueda de Pacientes ({forms.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ADMIN')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === 'ADMIN'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Settings className="h-4 w-4" />
                Textos Oficiales, Copias y Auditoría ({auditLogs.length})
              </button>
            </nav>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>
                Sesión activa: <strong>{currentUser.fullName}</strong> ({currentUser.roleLabel})
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal (Oculto cuando está abierta la vista de impresión y se manda a imprimir) */}
      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 py-6 ${
          printingRecord ? 'print:hidden' : ''
        }`}
      >
        {bannerMessage && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900 shadow-sm">
            <span>{bannerMessage}</span>
            <button
              type="button"
              onClick={() => setBannerMessage('')}
              className="text-emerald-700 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {activeTab === 'CREATE' && permissions.canCreateForm && (
          <ConsentFormWizard
            currentUser={currentUser}
            template={template}
            nextFormNumber={nextFormNumber}
            isOnline={isOnline}
            onSuccessCreated={(newRecord) => {
              refreshData();
              setPrintingRecord(newRecord);
              setActiveTab('HISTORY');
              setBannerMessage(
                `Formato ${newRecord.formNumber} firmado y sellado criptográficamente con éxito.`
              );
            }}
          />
        )}

        {activeTab === 'HISTORY' && (
          <ConsentHistoryList
            forms={forms}
            currentUser={currentUser}
            onSelectForPrint={(record) => setPrintingRecord(record)}
            onAnnulForm={handleAnnulForm}
          />
        )}

        {activeTab === 'ADMIN' && (
          <AdminPanel
            currentUser={currentUser}
            template={template}
            auditLogs={auditLogs}
            onTemplateSaved={(updated) => {
              setTemplate(updated);
              refreshData();
            }}
            onBackupTriggered={() => refreshData()}
          />
        )}
      </main>
    </div>
  );
}
