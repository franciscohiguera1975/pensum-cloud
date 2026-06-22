import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/modules/auth/infrastructure/auth.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { publicApi } from '@/modules/public/infrastructure/public.api';

const loginSchema = z.object({
  tenantSlug: z.string().min(1, 'Selecciona una institución'),
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  // Fetch available tenants for the dropdown
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['public-tenants'],
    queryFn: () => publicApi.getTenants(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      authApi.login(data.email, data.password, data.tenantSlug),
    onSuccess: (tokens, variables) => {
      login({ ...tokens, tenantId: variables.tenantSlug });
      navigate('/');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <p className="text-3xl mb-2">🏛️</p>
          <h1 className="text-2xl font-bold text-gray-900">Pensum Cloud</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión curricular universitaria</p>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Tenant select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institución
            </label>
            {loadingTenants ? (
              <div className="w-full border rounded-md px-3 py-2 text-sm text-gray-400 bg-gray-50">
                Cargando instituciones…
              </div>
            ) : (
              <select
                {...register('tenantSlug')}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                defaultValue=""
              >
                <option value="" disabled>
                  — Selecciona tu institución —
                </option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            {errors.tenantSlug && (
              <p className="text-xs text-red-500 mt-1">{errors.tenantSlug.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="admin@universidad.edu"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              {...register('password')}
              type="password"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {mutation.isError && (
            <p className="text-xs text-red-500 text-center">
              Credenciales inválidas. Verifica el email y la contraseña.
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || loadingTenants}
            className="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {mutation.isPending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
