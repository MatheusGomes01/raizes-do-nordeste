/**
 * Perfis/Roles do sistema.
 * Cada perfil tem permissões específicas nos endpoints.
 */
const Roles = Object.freeze({
  ADMIN: 'ADMIN',
  GERENTE: 'GERENTE',
  ATENDENTE: 'ATENDENTE',
  COZINHA: 'COZINHA',
  CLIENTE: 'CLIENTE'
});

const ROLES_VALIDOS = Object.values(Roles);

module.exports = { Roles, ROLES_VALIDOS };
