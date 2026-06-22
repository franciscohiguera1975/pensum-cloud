import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { universityApi } from '@/modules/university/infrastructure/university.api';
import { facultyApi } from '@/modules/faculty/infrastructure/faculty.api';
import { careerApi } from '@/modules/career/infrastructure/career.api';
import { curriculumApi } from '@/modules/curriculum/infrastructure/curriculum.api';
import { useCurriculumSelector } from '@/modules/curriculum/application/hooks/useCurriculumSelector';
import { Modal } from '@/shared/components/Modal';
import type {
  UniversityResponse,
  FacultyResponse,
  CareerResponse,
  CurriculumResponse,
} from '@/shared/types/api.types';

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

// ─── Breadcrumb ────────────────────────────────────────────────────────────────
interface Crumb { label: string; onClick: () => void; }

function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 mx-0.5">›</span>}
          <button
            onClick={c.onClick}
            className={`transition-colors font-medium ${
              i === crumbs.length - 1
                ? 'text-gray-800 cursor-default'
                : 'text-gray-400 hover:text-indigo-600'
            }`}
          >
            {c.label}
          </button>
        </span>
      ))}
    </nav>
  );
}

// ─── Visual drill card ─────────────────────────────────────────────────────────
interface DrillCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  primaryAction?: React.ReactNode;
}

function DrillCard({
  icon, title, subtitle, badge, badgeColor = 'bg-gray-100 text-gray-600',
  onClick, onEdit, onDelete, primaryAction,
}: DrillCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border border-gray-200 p-5 transition-all group ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200' : ''
      }`}
    >
      {/* Icon */}
      <div className="text-4xl mb-3 select-none">{icon}</div>

      {/* Title & subtitle */}
      <h3 className="font-semibold text-gray-800 leading-snug pr-12">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}

      {/* Status badge */}
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block font-medium ${badgeColor}`}>
          {badge}
        </span>
      )}

      {/* Primary action (e.g. "Ver Pensum") */}
      {primaryAction && <div className="mt-3" onClick={(e) => e.stopPropagation()}>{primaryAction}</div>}

      {/* Hover actions: edit + delete */}
      <div
        className="absolute top-3 right-3 hidden group-hover:flex gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          title="Editar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-sm"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          title="Eliminar"
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      {/* Chevron */}
      {onClick && (
        <div className="absolute bottom-4 right-4 text-gray-200 group-hover:text-indigo-300 text-lg transition-colors select-none">
          ›
        </div>
      )}
    </div>
  );
}

// ─── Level header ─────────────────────────────────────────────────────────────
function LevelHeader({ title, subtitle, onAdd }: { title: string; subtitle?: string; onAdd: () => void }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <button
        onClick={onAdd}
        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
      >
        + Agregar
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-30">📭</div>
      <p className="text-gray-400 text-sm mb-4">No hay {label} todavía.</p>
      <button
        onClick={onAdd}
        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        + Agregar {label}
      </button>
    </div>
  );
}

// ─── Confirm delete dialog ────────────────────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="Confirmar eliminación" onClose={onCancel}>
      <p className="text-sm text-gray-600 mb-4">
        ¿Deseas eliminar <strong>{name}</strong>? Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button onClick={onConfirm} className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
          Eliminar
        </button>
      </div>
    </Modal>
  );
}

// ─── Input helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, required, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
    </label>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
        Cancelar
      </button>
      <button type="submit" className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
        Guardar
      </button>
    </div>
  );
}

// ─── Forms ────────────────────────────────────────────────────────────────────
function UniversityForm({ initial, onSubmit, onCancel }: {
  initial?: UniversityResponse;
  onSubmit: (data: { name: string; code: string; country: string; website: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [country, setCountry] = useState(initial?.country ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, code, country, website }); }} className="space-y-3">
      <Field label="Nombre" value={name} onChange={setName} required placeholder="Ej: Universidad Nacional" />
      <Field label="Código" value={code} onChange={setCode} required placeholder="Ej: UNAL" />
      <Field label="País" value={country} onChange={setCountry} placeholder="Ecuador" />
      <Field label="Sitio web" value={website} onChange={setWebsite} placeholder="https://..." />
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function FacultyForm({ initial, onSubmit, onCancel }: {
  initial?: FacultyResponse;
  onSubmit: (data: { name: string; code: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, code }); }} className="space-y-3">
      <Field label="Nombre" value={name} onChange={setName} required placeholder="Ej: Facultad de Ingeniería" />
      <Field label="Código" value={code} onChange={setCode} required placeholder="Ej: FING" />
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function CareerForm({ initial, onSubmit, onCancel }: {
  initial?: CareerResponse;
  onSubmit: (data: { name: string; code: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, code, description }); }} className="space-y-3">
      <Field label="Nombre" value={name} onChange={setName} required placeholder="Ej: Ing. en Desarrollo de Software" />
      <Field label="Código" value={code} onChange={setCode} required placeholder="Ej: IDS" />
      <Field label="Descripción" value={description} onChange={setDescription} placeholder="Descripción opcional" />
      <FormActions onCancel={onCancel} />
    </form>
  );
}

function CurriculumForm({ initial, onSubmit, onCancel }: {
  initial?: CurriculumResponse;
  onSubmit: (data: { version: string; name: string; description: string; status: string }) => void;
  onCancel: () => void;
}) {
  const [version, setVersion] = useState(initial?.version ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>(initial?.status ?? 'DRAFT');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ version, name, description, status }); }} className="space-y-3">
      <Field label="Versión" value={version} onChange={setVersion} required placeholder="Ej: 2024-1" />
      <Field label="Nombre" value={name} onChange={setName} required placeholder="Ej: Pensum V1" />
      <Field label="Descripción" value={description} onChange={setDescription} placeholder="Descripción opcional" />
      <label className="block">
        <span className="text-xs font-medium text-gray-600">Estado</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')}
          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="DRAFT">Borrador</option>
          <option value="ACTIVE">Activo</option>
          <option value="ARCHIVED">Archivado</option>
        </select>
      </label>
      <FormActions onCancel={onCancel} />
    </form>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function BrowsePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { setCurriculum } = useCurriculumSelector();

  // Selection state
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityResponse | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyResponse | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerResponse | null>(null);

  // Modal state
  type ModalType =
    | 'add-university' | 'edit-university' | 'delete-university'
    | 'add-faculty' | 'edit-faculty' | 'delete-faculty'
    | 'add-career' | 'edit-career' | 'delete-career'
    | 'add-curriculum' | 'edit-curriculum' | 'delete-curriculum'
    | null;

  const [modal, setModal] = useState<ModalType>(null);
  const [target, setTarget] = useState<
    UniversityResponse | FacultyResponse | CareerResponse | CurriculumResponse | null
  >(null);

  const closeModal = () => { setModal(null); setTarget(null); };

  // ── Universities ──
  const { data: universities = [], isLoading: loadingUnis } = useQuery({
    queryKey: ['universities'],
    queryFn: universityApi.getAll,
  });
  const createUni = useMutation({
    mutationFn: universityApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['universities'] }); closeModal(); },
  });
  const updateUni = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof universityApi.update>[1] }) =>
      universityApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['universities'] }); closeModal(); },
  });
  const deleteUni = useMutation({
    mutationFn: universityApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['universities'] });
      if (selectedUniversity?.id === (target as UniversityResponse)?.id) {
        setSelectedUniversity(null); setSelectedFaculty(null); setSelectedCareer(null);
      }
      closeModal();
    },
  });

  // ── Faculties ──
  const { data: faculties = [], isLoading: loadingFacs } = useQuery({
    queryKey: ['faculties', selectedUniversity?.id],
    queryFn: () => facultyApi.listByUniversity(selectedUniversity!.id),
    enabled: !!selectedUniversity,
  });
  const createFac = useMutation({
    mutationFn: (data: Parameters<typeof facultyApi.create>[1]) =>
      facultyApi.create(selectedUniversity!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['faculties', selectedUniversity?.id] }); closeModal(); },
  });
  const updateFac = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof facultyApi.update>[2] }) =>
      facultyApi.update(selectedUniversity!.id, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['faculties', selectedUniversity?.id] }); closeModal(); },
  });
  const deleteFac = useMutation({
    mutationFn: (id: string) => facultyApi.delete(selectedUniversity!.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['faculties', selectedUniversity?.id] });
      if (selectedFaculty?.id === (target as FacultyResponse)?.id) {
        setSelectedFaculty(null); setSelectedCareer(null);
      }
      closeModal();
    },
  });

  // ── Careers ──
  const { data: careers = [], isLoading: loadingCareers } = useQuery({
    queryKey: ['careers', selectedFaculty?.id],
    queryFn: () => careerApi.listByFaculty(selectedFaculty!.id),
    enabled: !!selectedFaculty,
  });
  const createCareer = useMutation({
    mutationFn: (data: Parameters<typeof careerApi.create>[1]) =>
      careerApi.create(selectedFaculty!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['careers', selectedFaculty?.id] }); closeModal(); },
  });
  const updateCareer = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof careerApi.update>[2] }) =>
      careerApi.update(selectedFaculty!.id, id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['careers', selectedFaculty?.id] }); closeModal(); },
  });
  const deleteCareer = useMutation({
    mutationFn: (id: string) => careerApi.delete(selectedFaculty!.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['careers', selectedFaculty?.id] });
      if (selectedCareer?.id === (target as CareerResponse)?.id) setSelectedCareer(null);
      closeModal();
    },
  });

  // ── Curricula ──
  const { data: curricula = [], isLoading: loadingCurricula } = useQuery({
    queryKey: ['curricula', selectedCareer?.id],
    queryFn: () => curriculumApi.listByCareer(selectedCareer!.id),
    enabled: !!selectedCareer,
  });
  const createCurriculum = useMutation({
    mutationFn: (data: Parameters<typeof curriculumApi.create>[1]) =>
      curriculumApi.create(selectedCareer!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['curricula', selectedCareer?.id] }); closeModal(); },
  });
  const updateCurriculum = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof curriculumApi.update>[1] }) =>
      curriculumApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['curricula', selectedCareer?.id] }); closeModal(); },
  });
  const deleteCurriculum = useMutation({
    mutationFn: curriculumApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['curricula', selectedCareer?.id] }); closeModal(); },
  });

  // ── Level & breadcrumb ──
  const level = selectedCareer ? 3 : selectedFaculty ? 2 : selectedUniversity ? 1 : 0;

  const crumbs: Crumb[] = [
    {
      label: 'Universidades',
      onClick: () => { setSelectedUniversity(null); setSelectedFaculty(null); setSelectedCareer(null); },
    },
    ...(selectedUniversity ? [{ label: selectedUniversity.name, onClick: () => { setSelectedFaculty(null); setSelectedCareer(null); } }] : []),
    ...(selectedFaculty ? [{ label: selectedFaculty.name, onClick: () => setSelectedCareer(null) }] : []),
    ...(selectedCareer ? [{ label: selectedCareer.name, onClick: () => {} }] : []),
  ];

  const cardGrid = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Gestión de Datos</h1>
      <p className="text-sm text-gray-500 mb-5">Navega y administra la estructura académica.</p>

      <Breadcrumb crumbs={crumbs} />

      {/* ── Level 0: Universities ── */}
      {level === 0 && (
        <section>
          <LevelHeader
            title="Universidades"
            subtitle="Selecciona una universidad para ver sus facultades"
            onAdd={() => setModal('add-university')}
          />
          {loadingUnis ? (
            <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>
          ) : universities.length === 0 ? (
            <EmptyState label="universidades" onAdd={() => setModal('add-university')} />
          ) : (
            <div className={cardGrid}>
              {universities.map((u) => (
                <DrillCard
                  key={u.id}
                  icon="🏛️"
                  title={u.name}
                  subtitle={`${u.code}${u.country ? ` · ${u.country}` : ''}`}
                  onClick={() => { setSelectedUniversity(u); setSelectedFaculty(null); setSelectedCareer(null); }}
                  onEdit={() => { setTarget(u); setModal('edit-university'); }}
                  onDelete={() => { setTarget(u); setModal('delete-university'); }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Level 1: Faculties ── */}
      {level === 1 && selectedUniversity && (
        <section>
          <LevelHeader
            title="Facultades"
            subtitle={`de ${selectedUniversity.name}`}
            onAdd={() => setModal('add-faculty')}
          />
          {loadingFacs ? (
            <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>
          ) : faculties.length === 0 ? (
            <EmptyState label="facultades" onAdd={() => setModal('add-faculty')} />
          ) : (
            <div className={cardGrid}>
              {faculties.map((f) => (
                <DrillCard
                  key={f.id}
                  icon="🏢"
                  title={f.name}
                  subtitle={f.code}
                  onClick={() => { setSelectedFaculty(f); setSelectedCareer(null); }}
                  onEdit={() => { setTarget(f); setModal('edit-faculty'); }}
                  onDelete={() => { setTarget(f); setModal('delete-faculty'); }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Level 2: Careers ── */}
      {level === 2 && selectedFaculty && (
        <section>
          <LevelHeader
            title="Carreras"
            subtitle={`de ${selectedFaculty.name}`}
            onAdd={() => setModal('add-career')}
          />
          {loadingCareers ? (
            <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>
          ) : careers.length === 0 ? (
            <EmptyState label="carreras" onAdd={() => setModal('add-career')} />
          ) : (
            <div className={cardGrid}>
              {careers.map((c) => (
                <DrillCard
                  key={c.id}
                  icon="🎓"
                  title={c.name}
                  subtitle={c.description ?? c.code}
                  onClick={() => setSelectedCareer(c)}
                  onEdit={() => { setTarget(c); setModal('edit-career'); }}
                  onDelete={() => { setTarget(c); setModal('delete-career'); }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Level 3: Curricula ── */}
      {level === 3 && selectedCareer && (
        <section>
          <LevelHeader
            title="Pensums"
            subtitle={`de ${selectedCareer.name}`}
            onAdd={() => setModal('add-curriculum')}
          />
          {loadingCurricula ? (
            <div className="text-sm text-gray-400 py-8 text-center">Cargando...</div>
          ) : curricula.length === 0 ? (
            <EmptyState label="pensums" onAdd={() => setModal('add-curriculum')} />
          ) : (
            <div className={cardGrid}>
              {(curricula as CurriculumResponse[]).map((curr) => (
                <DrillCard
                  key={curr.id}
                  icon="📋"
                  title={curr.name}
                  subtitle={`Versión ${curr.version}`}
                  badge={STATUS_LABELS[curr.status] ?? curr.status}
                  badgeColor={STATUS_COLORS[curr.status]}
                  onEdit={() => { setTarget(curr); setModal('edit-curriculum'); }}
                  onDelete={() => { setTarget(curr); setModal('delete-curriculum'); }}
                  primaryAction={
                    <button
                      onClick={() => { setCurriculum(curr.id, curr.name); navigate('/pensum'); }}
                      className="w-full text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                    >
                      Ver Pensum →
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── MODALS ─── */}
      {modal === 'add-university' && (
        <Modal title="Nueva Universidad" onClose={closeModal}>
          <UniversityForm onSubmit={(data) => createUni.mutate(data)} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'edit-university' && target && (
        <Modal title="Editar Universidad" onClose={closeModal}>
          <UniversityForm initial={target as UniversityResponse} onSubmit={(data) => updateUni.mutate({ id: target.id, data })} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'delete-university' && target && (
        <ConfirmDelete name={(target as UniversityResponse).name} onConfirm={() => deleteUni.mutate(target.id)} onCancel={closeModal} />
      )}

      {modal === 'add-faculty' && (
        <Modal title="Nueva Facultad" onClose={closeModal}>
          <FacultyForm onSubmit={(data) => createFac.mutate(data)} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'edit-faculty' && target && (
        <Modal title="Editar Facultad" onClose={closeModal}>
          <FacultyForm initial={target as FacultyResponse} onSubmit={(data) => updateFac.mutate({ id: target.id, data })} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'delete-faculty' && target && (
        <ConfirmDelete name={(target as FacultyResponse).name} onConfirm={() => deleteFac.mutate(target.id)} onCancel={closeModal} />
      )}

      {modal === 'add-career' && (
        <Modal title="Nueva Carrera" onClose={closeModal}>
          <CareerForm onSubmit={(data) => createCareer.mutate(data)} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'edit-career' && target && (
        <Modal title="Editar Carrera" onClose={closeModal}>
          <CareerForm initial={target as CareerResponse} onSubmit={(data) => updateCareer.mutate({ id: target.id, data })} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'delete-career' && target && (
        <ConfirmDelete name={(target as CareerResponse).name} onConfirm={() => deleteCareer.mutate(target.id)} onCancel={closeModal} />
      )}

      {modal === 'add-curriculum' && (
        <Modal title="Nuevo Pensum" onClose={closeModal}>
          <CurriculumForm onSubmit={(data) => createCurriculum.mutate(data)} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'edit-curriculum' && target && (
        <Modal title="Editar Pensum" onClose={closeModal}>
          <CurriculumForm initial={target as CurriculumResponse} onSubmit={(data) => updateCurriculum.mutate({ id: target.id, data })} onCancel={closeModal} />
        </Modal>
      )}
      {modal === 'delete-curriculum' && target && (
        <ConfirmDelete name={(target as CurriculumResponse).name} onConfirm={() => deleteCurriculum.mutate(target.id)} onCancel={closeModal} />
      )}
    </div>
  );
}
