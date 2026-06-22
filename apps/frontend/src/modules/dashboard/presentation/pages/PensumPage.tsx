import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';
import { PensumFlowEditor } from '@/modules/reactflow-editor/PensumFlowEditor';
import { PensumViewer3D } from '@/modules/threejs-viewer/PensumViewer3D';
import {
  PensumGridViewer,
  toGridSemesters,
  toGridSubjects,
} from '@/modules/reactflow-editor/components/PensumGridViewer';
import { usePensumFlow } from '@/modules/reactflow-editor/hooks/usePensumFlow';
import { useCurriculumSelector } from '@/modules/curriculum/application/hooks/useCurriculumSelector';

type View = 'grid' | '2d' | '3d';

const TABS: { id: View; label: string }[] = [
  { id: 'grid', label: '📋 Contenidos' },
  { id: '2d', label: '🔗 Prerrequisitos' },
  { id: '3d', label: '🌐 Vista 3D' },
];

// Inner component — only rendered when curriculumId is set
function PensumContent({
  curriculumId,
  curriculumName,
}: {
  curriculumId: string;
  curriculumName: string;
}) {
  const [view, setView] = useState<View>('grid');
  const [downloading, setDownloading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfIncludeContent, setPdfIncludeContent] = useState(true);
  const queryClient = useQueryClient();
  const { semesters, subjects, isLoading } = usePensumFlow(curriculumId);

  // Exit fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  async function downloadMallaExcel() {
    setDownloadingExcel(true);
    try {
      const response = await apiClient.get(`/curricula/${curriculumId}/malla-excel`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(
        new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `malla-${curriculumName || curriculumId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating malla Excel:', e);
    } finally {
      setDownloadingExcel(false);
    }
  }

  async function downloadMalla() {
    setDownloading(true);
    try {
      const response = await apiClient.get(`/curricula/${curriculumId}/malla-pdf`, {
        responseType: 'blob',
        params: { includeContent: pdfIncludeContent ? 'true' : 'false' },
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `malla-${curriculumName || curriculumId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating malla PDF:', e);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Cargando pensum…
      </div>
    );
  }

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-white'
          : 'flex flex-col h-full'
      }
    >
      {/* Inner toolbar with view tabs + PDF download + fullscreen */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-3 shrink-0">
        <h2 className="font-semibold text-gray-700 text-sm truncate max-w-xs mr-2">
          {curriculumName}
        </h2>
        <div className="flex rounded-md overflow-hidden border text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-3 py-1.5 transition-colors ${
                view === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Excel download */}
        <button
          onClick={downloadMallaExcel}
          disabled={downloadingExcel}
          title="Descargar malla curricular en Excel"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {downloadingExcel ? (
            <><span className="animate-spin text-sm">⏳</span>Generando…</>
          ) : (
            <>📊 Malla Excel</>
          )}
        </button>

        {/* PDF download + content toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={downloadMalla}
            disabled={downloading}
            title="Descargar malla curricular en PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-md border border-indigo-200 text-xs text-indigo-600 hover:bg-indigo-50 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? (
              <><span className="animate-spin text-sm">⏳</span>Generando…</>
            ) : (
              <>📄 Malla PDF</>
            )}
          </button>
          <label
            title={pdfIncludeContent ? 'Con contenido (desactivar para PDF más compacto)' : 'Sin contenido (activar para incluir descripciones)'}
            className="flex items-center gap-1 px-2 py-1.5 rounded-r-md border border-l-0 border-indigo-200 text-xs text-indigo-500 hover:bg-indigo-50 cursor-pointer select-none transition-colors"
          >
            <input
              type="checkbox"
              checked={pdfIncludeContent}
              onChange={e => setPdfIncludeContent(e.target.checked)}
              className="accent-indigo-600 w-3 h-3"
            />
            <span>Contenido</span>
          </label>
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen((v) => !v)}
          title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
          className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base leading-none"
        >
          {isFullscreen ? '⊠' : '⛶'}
        </button>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden">
        {view === 'grid' && (
          <PensumGridViewer
            curriculumId={curriculumId}
            semesters={toGridSemesters(semesters)}
            subjects={toGridSubjects(subjects)}
            editable
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['semesters', curriculumId] });
              queryClient.invalidateQueries({ queryKey: ['subjects-all'] });
            }}
          />
        )}
        {view === '2d' && (
          <PensumFlowEditor curriculumId={curriculumId} curriculumName={curriculumName} />
        )}
        {view === '3d' && (
          <PensumViewer3D curriculumId={curriculumId} curriculumName={curriculumName} />
        )}
      </div>
    </div>
  );
}

export function PensumPage() {
  const { curriculumId, curriculumName, clear } = useCurriculumSelector();

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <header className="bg-white border-b px-4 h-14 flex items-center justify-between shrink-0 gap-4">
        <p className="font-semibold text-gray-800 text-sm">Visor de Pensum</p>

        <div className="flex items-center gap-2 min-w-0">
          {curriculumId ? (
            <>
              <span className="text-xs text-gray-400">Seleccionado:</span>
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                {curriculumName || curriculumId}
              </span>
              <button
                onClick={clear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-1"
                title="Quitar selección"
              >
                ✕
              </button>
            </>
          ) : (
            <Link to="/datos" className="text-xs text-indigo-600 hover:underline">
              Ir a Datos para seleccionar un pensum →
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden">
        {!curriculumId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-sm text-gray-400">
            <p className="text-lg">No hay pensum seleccionado</p>
            <Link
              to="/datos"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Ir a Gestión de Datos
            </Link>
            <p className="text-xs text-gray-300">
              Navega hasta la carrera, selecciona un pensum y haz clic en él.
            </p>
          </div>
        ) : (
          <PensumContent curriculumId={curriculumId} curriculumName={curriculumName} />
        )}
      </main>
    </div>
  );
}
