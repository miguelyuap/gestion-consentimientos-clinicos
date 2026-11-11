import type { ClinicalRole, ClinicalUser, RolePermissions } from '../types/auth.types';

export const DEMO_CLINICAL_USERS: readonly ClinicalUser[] = [
  {
    id: 'usr-enf-001',
    username: 'enfermeria',
    fullName: 'Jefe Laura Valentina Gómez',
    documentNumber: '1032456789',
    professionalCard: 'TP-ENF-98412',
    role: 'nursing',
    roleLabel: 'Enfermería (Diligenciamiento)',
    defaultFacility: 'Sede Principal — Hospitalización Adultos',
  },
  {
    id: 'usr-con-002',
    username: 'consulta',
    fullName: 'Dr. Carlos Andrés Mejía',
    documentNumber: '79854123',
    professionalCard: 'RM-74125',
    role: 'viewer',
    roleLabel: 'Consulta y Auditoría Clínica',
    defaultFacility: 'Sede Principal — Auditoría Médica',
  },
  {
    id: 'usr-adm-003',
    username: 'admin',
    fullName: 'Ing. Miguel Muñoz — Coord. Calidad y TI',
    documentNumber: '1015487963',
    professionalCard: 'ADM-CAL-01',
    role: 'admin',
    roleLabel: 'Administrador (Calidad / Jurídica / TI)',
    defaultFacility: 'Dirección de Calidad y Sistemas',
  },
] as const;

const PASSWORDS_BY_USERNAME: Record<string, string> = {
  enfermeria: 'Enfermeria2026*',
  consulta: 'Consulta2026*',
  admin: 'Admin2026*',
};

export function getRolePermissions(role: ClinicalRole): RolePermissions {
  switch (role) {
    case 'nursing':
      return {
        canCreateForm: true,
        canSearchAndView: true,
        canPrintPdf: true,
        canAnnulForm: false,
        canManageTemplates: false,
        canManageBackups: false,
      };
    case 'viewer':
      return {
        canCreateForm: false,
        canSearchAndView: true,
        canPrintPdf: true,
        canAnnulForm: false,
        canManageTemplates: false,
        canManageBackups: false,
      };
    case 'admin':
      return {
        canCreateForm: true,
        canSearchAndView: true,
        canPrintPdf: true,
        canAnnulForm: true,
        canManageTemplates: true,
        canManageBackups: true,
      };
  }
}

export function authenticateClinicalUser(
  usernameInput: string,
  passwordInput: string
): { success: true; user: ClinicalUser } | { success: false; error: string } {
  const normalizedUsername = usernameInput.trim().toLowerCase();
  const expectedPassword = PASSWORDS_BY_USERNAME[normalizedUsername];

  if (!expectedPassword || expectedPassword !== passwordInput) {
    return {
      success: false,
      error: 'Credenciales inválidas. Verifique su usuario y contraseña institucional.',
    };
  }

  const foundUser = DEMO_CLINICAL_USERS.find((u) => u.username === normalizedUsername);
  if (!foundUser) {
    return {
      success: false,
      error: 'Usuario no encontrado en el directorio clínico.',
    };
  }

  return {
    success: true,
    user: foundUser,
  };
}
