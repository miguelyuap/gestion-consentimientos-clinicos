'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  CloudOff,
  ExternalLink,
  FileSignature,
  Lock,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Wifi,
  X,
} from 'lucide-react';

export interface InteractiveUserManualModalProps {
  onClose: () => void;
}

type ManualCategory =
  | 'ALL'
  | 'ROLES'
  | 'FLUJO'
  | 'PERTENENCIAS'
  | 'HISTORIAL'
  | 'OFFLINE';

interface ManualSectionItem {
  id: string;
  category: Exclude<ManualCategory, 'ALL'>;
  badge: string;
  title: string;
  summary: string;
  bullets: string[];
  highlightNote?: {
    type: 'info' | 'warning' | 'success';
    text: string;
  };
}

const MANUAL_SECTIONS: ManualSectionItem[] = [
  {
    id: 'sec-roles',
    category: 'ROLES',
    badge: '1. Control de Acceso',
    title: 'Perfiles Institucionales y Credenciales de Acceso',
    summary:
      'El sistema aplica permisos diferenciados según el rol asistencial o administrativo del usuario.',
    bullets: [
      'Enfermería (usuario: enfermeria / clave: Enfermeria2026*): Diligencia y firma nuevos formatos, consulta el historial y exporta PDF. No tiene permiso para eliminar ni anular.',
      'Consulta y Auditoría (usuario: consulta / clave: Consulta2026*): Acceso de solo lectura para buscar por cédula, nombre o fecha, auditar hashes SHA-256 y descargar PDF.',
      'Administrador (usuario: admin / clave: Admin2026*): Acceso total, incluyendo anulación justificada (Res. 1995/1999), edición de textos de la plantilla FOR-ENF-HC-014 y copias de seguridad JSON.',
    ],
    highlightNote: {
      type: 'info',
      text: 'En la barra superior derecha puede alternar entre los 3 roles con un clic para realizar pruebas o capacitaciones.',
    },
  },
  {
    id: 'sec-flujo-paciente',
    category: 'FLUJO',
    badge: '2. Diligenciamiento Clínico',
    title: 'Identificación del Paciente y Regla Automática de Acudiente',
    summary:
      'Cómo registrar el ingreso en la pestaña "Diligenciar Formato" cumpliendo las validaciones legales.',
    bullets: [
      'Seleccione la Sede / Servicio Hospitalario donde ingresa el paciente.',
      'Complete Nombre Completo, Tipo de Documento (CC, TI, RC, CE, PPT, PA, MS, AS), Número, Edad y Diagnóstico.',
      'Si el paciente es menor de 18 años (Edad < 18) o se marca la casilla "Paciente con incapacidad para firmar", el sistema exige automáticamente los datos completos y firma del Acudiente o Representante Legal.',
      'Si el paciente es adulto capaz, traza su firma directamente en el panel táctil del paciente.',
    ],
    highlightNote: {
      type: 'success',
      text: 'Use los botones "Cargar Caso Adulto" o "Cargar Caso Pediátrico" en la esquina superior del formulario para practicar con datos precargados.',
    },
  },
  {
    id: 'sec-3-consentimientos',
    category: 'FLUJO',
    badge: '2. Consentimientos Independientes',
    title: 'Los Tres (3) Consentimientos Informados con Decisión y Firma Individual',
    summary:
      'Cada bloque requiere decisión expresa (ACEPTO / NO ACEPTO) y su propia firma digital independiente.',
    bullets: [
      'Consentimiento 3.1 — Ingreso a Hospitalización: Estancia, vigilancia continua y plan médico.',
      'Consentimiento 3.2 — Procedimientos de Enfermería: Canalización venosa, toma de muestras, administración de medicamentos, sondas y curaciones.',
      'Consentimiento 3.3 — Presencia de Estudiantes en Prácticas (Docencia-Servicio): El paciente puede rechazar la presencia de estudiantes sin afectar su atención médica.',
      'Puede utilizar el botón "Reutilizar firma del paciente/acudiente" en cada bloque después de confirmar su decisión.',
    ],
  },
  {
    id: 'sec-pertenencias',
    category: 'PERTENENCIAS',
    badge: '3. Custodia de Bienes',
    title: 'Recibo de Pertenencias (Aptas vs. No Aptas) y Acta de Devolución',
    summary:
      'Clasificación de objetos personales del paciente y generación obligatoria del acta de entrega a familiares.',
    bullets: [
      'APTA (Queda con paciente): Elementos permitidos en la habitación (útiles de aseo, pijama, calzado antideslizante, prótesis en estuche).',
      'NO_APTA (Devolver a familiar): Joyas, celulares, cargadores, computadores, sumas altas de dinero u objetos restringidos.',
      'Registre la firma de Quien Entrega las pertenencias y del Profesional/Auxiliar de Enfermería que Recibe.',
    ],
    highlightNote: {
      type: 'warning',
      text: 'Regla obligatoria: Si existe al menos un (1) ítem marcado como NO_APTA, se activa automáticamente el "Acta de Devolución de Pertenencias No Aptas" y el sistema exige la firma de quien retira dichos elementos antes de permitir guardar.',
    },
  },
  {
    id: 'sec-historial-anulacion',
    category: 'HISTORIAL',
    badge: '4. Custodia Legal (Res. 1995/1999)',
    title: 'Búsqueda Rápida, Exportación PDF y Anulación Justificada',
    summary:
      'Consulta en menos de 1 segundo e inmutabilidad estricta de los registros firmados.',
    bullets: [
      'Busque por número de cédula, nombre del paciente, acudiente o consecutivo (ej. FOR-CLI-2026-0001).',
      'Pulse "Ver / Imprimir PDF" para abrir el documento oficial FOR-ENF-HC-014 con todas las firmas y el código Hash SHA-256.',
      'Por Resolución 1995 de 1999, ningún registro firmado puede editarse ni borrarse físicamente (protegido por trigger en Supabase PostgreSQL).',
      'Si hubo un error al diligenciar, el rol Administrador debe pulsar "Anular Formato", escribir una justificación de mínimo 15 caracteres y diligenciar un nuevo consecutivo.',
    ],
    highlightNote: {
      type: 'warning',
      text: 'Un formato anulado conserva su trazabilidad íntegra con sello rojo "ANULADO" para auditorías de Calidad y Jurídica.',
    },
  },
  {
    id: 'sec-offline-supabase',
    category: 'OFFLINE',
    badge: '5. Continuidad Operativa',
    title: 'Sincronización con Supabase Cloud y Modo Tablet Offline',
    summary:
      'Operación ininterrumpida en habitaciones o servicios sin cobertura Wi-Fi.',
    bullets: [
      'En Línea (Sincronizado): Todos los formatos, anulaciones, plantillas y bitácoras se guardan en tiempo real en Supabase PostgreSQL.',
      'Modo Offline Activo: Si se pierde la red Wi-Fi, los formatos firmados se guardan cifrados localmente con estado "Pendiente Sincronizar".',
      'Al recuperar conexión, pulse el botón "Sincronizar (N)" en la barra superior para enviar los formatos pendientes a la nube en un clic.',
    ],
    highlightNote: {
      type: 'success',
      text: 'Desde la pestaña "Textos Oficiales, Copias y Auditoría", el Administrador también puede descargar un respaldo completo en formato JSON.',
    },
  },
];

export function InteractiveUserManualModal({
  onClose,
}: InteractiveUserManualModalProps) {
  const [activeCategory, setActiveCategory] = useState<ManualCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MANUAL_SECTIONS.filter((sec) => {
      const matchesCategory =
        activeCategory === 'ALL' || sec.category === activeCategory;
      const matchesSearch =
        !q ||
        sec.title.toLowerCase().includes(q) ||
        sec.summary.toLowerCase().includes(q) ||
        sec.bullets.some((b) => b.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6 print:hidden">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-white shadow-2xl">
        {/* Encabezado del Manual Interactivo */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold">
                  Manual de Usuario Interactivo — FOR-ENF-HC-014
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                  HTML Interactivo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Guía operativa para Enfermería, Auditoría Clínica y Administración de Calidad
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/manual-usuario.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-500"
              title="Abrir el manual HTML interactivo en una pestaña independiente"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir en Pestaña HTML
            </a>
            <button
              type="button"
              onClick={() => {
                window.open('/manual-usuario.html', '_blank', 'noopener,noreferrer');
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Printer className="h-3.5 w-3.5" />
              Versión Imprimible
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              title="Cerrar manual"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros Interactivos y Buscador */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL' as const, label: 'Todo el Manual' },
                { key: 'ROLES' as const, label: '1. Usuarios y Roles' },
                { key: 'FLUJO' as const, label: '2. Diligenciar y Firmar' },
                { key: 'PERTENENCIAS' as const, label: '3. Pertenencias' },
                { key: 'HISTORIAL' as const, label: '4. PDF y Anulación' },
                { key: 'OFFLINE' as const, label: '5. Offline y Supabase' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    activeCategory === tab.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[230px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en el manual (ej. acudiente, anular)..."
                className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Resumen rápido de flujo visual */}
          {activeCategory === 'ALL' && !searchQuery && (
            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:grid-cols-4">
              <div className="flex items-start gap-2.5">
                <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    1. Paciente / Acudiente
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Exige acudiente si es menor de 18 años o incapaz para firmar.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    2. Tres Consentimientos
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Hospitalización, Enfermería y Estudiantes con firma individual.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    3. Pertenencias y Acta
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Clasifica en Apta/No Apta y exige acta de devolución si hay No Aptas.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Lock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    4. Inmutabilidad SHA-256
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Guardado en Supabase sin borrado físico (solo anulación justificada).
                  </p>
                </div>
              </div>
            </div>
          )}

          {filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm font-bold text-slate-700">
                No se encontraron secciones que coincidan con &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                Mostrar todo el manual
              </button>
            </div>
          ) : (
            filteredSections.map((section) => (
              <article
                key={section.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    {section.badge}
                  </span>
                </div>
                <h3 className="mt-1.5 text-base font-extrabold text-slate-900">
                  {section.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600">{section.summary}</p>

                <ul className="mt-3 space-y-2">
                  {section.bullets.map((bullet, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {section.highlightNote && (
                  <div
                    className={`mt-3.5 flex items-start gap-2 rounded-xl border p-3 text-xs ${
                      section.highlightNote.type === 'warning'
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : section.highlightNote.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                          : 'border-blue-200 bg-blue-50 text-blue-900'
                    }`}
                  >
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="font-medium">{section.highlightNote.text}</span>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Pie del Modal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <Wifi className="h-3.5 w-3.5" />
              Supabase PostgreSQL Activo
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              <CloudOff className="h-3.5 w-3.5 text-amber-600" />
              Soporte Tablet Offline-First
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Entendido, volver al aplicativo
          </button>
        </div>
      </div>
    </div>
  );
}
