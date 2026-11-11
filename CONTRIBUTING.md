# Guía de Contribución — GST-SOFTWARE

1. **Ramas:** Seguir `GIT_STANDARD.md` (`feature/`, `fix/`, `chore/`).
2. **Commits Convencionales:** `feat:`, `fix:`, `docs:`, `test:`.
3. **Verificación previa a Merge Request:**
   - `npm run typecheck` (Cero errores TypeScript, prohibido `any`).
   - `npm run lint` (Cumplimiento ESLint).
   - `npm run test` (100% de tests unitarios pasando en Vitest).
4. **Reglas Clínicas y Legales:** Ningún cambio puede permitir la edición o borrado físico (`DELETE`) de un consentimiento firmado ni omitir el registro en la tabla de auditoría.
