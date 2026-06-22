import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/modules/users/infrastructure/users.api';
import { Modal } from '@/shared/components/Modal';
import type { UserResponse } from '@/shared/types/api.types';

const ALL_ROLES = ['ADMIN', 'COORDINATOR', 'VIEWER'] as const;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordinador',
  VIEWER: 'Lector',
};

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}

function RolePicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  const toggle = (role: string) =>
    onChange(selected.includes(role) ? selected.filter((r) => r !== role) : [...selected, role]);

  return (
    <div>
      <span className="text-xs font-medium text-gray-600">
        Roles <span className="text-red-400">*</span>
      </span>
      <div className="flex gap-2 mt-1 flex-wrap">
        {ALL_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              selected.includes(r)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400'
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>
      {selected.length === 0 && (
        <p className="text-xs text-red-400 mt-1">Selecciona al menos un rol</p>
      )}
    </div>
  );
}

// ── CreateUserForm ────────────────────────────────────────────────────────────
function CreateUserForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { email: string; password: string; firstName: string; lastName: string; roleNames: string[] }) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roles, setRoles] = useState<string[]>(['VIEWER']);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (roles.length === 0) return;
        onSubmit({ email, password, firstName, lastName, roleNames: roles });
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" value={firstName} onChange={setFirstName} required placeholder="Juan" />
        <Field label="Apellido" value={lastName} onChange={setLastName} required placeholder="Pérez" />
      </div>
      <Field label="Correo electrónico" value={email} onChange={setEmail} required type="email" placeholder="usuario@ejemplo.edu" />
      <Field label="Contraseña" value={password} onChange={setPassword} required type="password" placeholder="Mín. 8 caracteres" />
      <RolePicker selected={roles} onChange={setRoles} />
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" disabled={roles.length === 0} className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">Crear usuario</button>
      </div>
    </form>
  );
}

// ── EditUserForm ──────────────────────────────────────────────────────────────
function EditUserForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: UserResponse;
  onSubmit: (data: { firstName: string; lastName: string }) => void;
  onCancel: () => void;
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit({ firstName, lastName }); }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre" value={firstName} onChange={setFirstName} required />
        <Field label="Apellido" value={lastName} onChange={setLastName} required />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Guardar</button>
      </div>
    </form>
  );
}

// ── RolesForm ─────────────────────────────────────────────────────────────────
function RolesForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: UserResponse;
  onSubmit: (roles: string[]) => void;
  onCancel: () => void;
}) {
  const [roles, setRoles] = useState<string[]>(initial.roles);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (roles.length === 0) return; onSubmit(roles); }}
      className="space-y-4"
    >
      <p className="text-sm text-gray-500">
        Asignando roles a <strong>{initial.firstName} {initial.lastName}</strong>
      </p>
      <RolePicker selected={roles} onChange={setRoles} />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" disabled={roles.length === 0} className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">Guardar roles</button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function UsersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'add' | 'edit' | 'roles' | 'deactivate' | null>(null);
  const [target, setTarget] = useState<UserResponse | null>(null);
  const closeModal = () => { setModal(null); setTarget(null); };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const createUser = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { firstName?: string; lastName?: string } }) =>
      usersApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
  });

  const assignRoles = useMutation({
    mutationFn: ({ id, roleNames }: { id: string; roleNames: string[] }) =>
      usersApi.assignRoles(id, roleNames),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
  });

  const deactivateUser = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona los usuarios y sus roles de acceso.</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Nuevo usuario
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Cargando...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No hay usuarios registrados.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Roles</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${idx < users.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length > 0 ? u.roles.map((r) => (
                        <span key={r} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      )) : <span className="text-xs text-gray-400 italic">Sin roles</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setTarget(u); setModal('edit'); }} className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 transition-colors">Editar</button>
                      <button onClick={() => { setTarget(u); setModal('roles'); }} className="text-xs text-purple-500 hover:text-purple-700 px-2 py-1 rounded hover:bg-purple-50 transition-colors">Roles</button>
                      {u.isActive && (
                        <button onClick={() => { setTarget(u); setModal('deactivate'); }} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">Desactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'add' && (
        <Modal title="Nuevo Usuario" onClose={closeModal}>
          <CreateUserForm onSubmit={(data) => createUser.mutate(data)} onCancel={closeModal} />
        </Modal>
      )}

      {modal === 'edit' && target && (
        <Modal title="Editar Usuario" onClose={closeModal}>
          <EditUserForm
            initial={target}
            onSubmit={(data) => updateUser.mutate({ id: target.id, data })}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === 'roles' && target && (
        <Modal title="Gestionar Roles" onClose={closeModal}>
          <RolesForm
            initial={target}
            onSubmit={(roleNames) => assignRoles.mutate({ id: target.id, roleNames })}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modal === 'deactivate' && target && (
        <Modal title="Desactivar Usuario" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-4">
            ¿Desactivar a <strong>{target.firstName} {target.lastName}</strong>? No podrá iniciar sesión hasta que sea reactivado.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={() => deactivateUser.mutate(target.id)} className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Desactivar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
