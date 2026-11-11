export type ClinicalRole = 'nursing' | 'viewer' | 'admin';

export interface ClinicalUser {
  id: string;
  username: string;
  fullName: string;
  documentNumber: string;
  professionalCard: string;
  role: ClinicalRole;
  roleLabel: string;
  defaultFacility: string;
}

export interface RolePermissions {
  canCreateForm: boolean;
  canSearchAndView: boolean;
  canPrintPdf: boolean;
  canAnnulForm: boolean;
  canManageTemplates: boolean;
  canManageBackups: boolean;
}
