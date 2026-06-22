import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type NodeTypes,
  type EdgeTypes,
  type FitViewOptions,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQueryClient } from '@tanstack/react-query';

import { SubjectNode } from './components/SubjectNode';
import { SemesterHeaderNode } from './components/SemesterHeaderNode';
import { DeletableEdge } from './components/DeletableEdge';
import { SubjectModal } from '@/shared/components/SubjectModal';
import { SemesterModal } from '@/shared/components/SemesterModal';
import { usePensumFlow } from './hooks/usePensumFlow';
import { prerequisiteApi } from '@/modules/prerequisite/infrastructure/prerequisite.api';
import type { SubjectNodeData } from './utils/buildFlowGraph';

interface PensumFlowEditorProps {
  curriculumId: string;
  curriculumName: string;
}

const nodeTypes: NodeTypes = {
  subject: SubjectNode as NodeTypes[string],
  semesterHeader: SemesterHeaderNode as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  deletable: DeletableEdge,
};

const fitViewOptions: FitViewOptions = { padding: 0.2 };

type SubjectTarget = {
  id: string; name: string; code: string; credits: number;
  hoursTheory: number; hoursPractice: number; description: string | null; semesterId: string;
};
type SemesterTarget = { id: string; number: number; name: string | null };

export function PensumFlowEditor({ curriculumId }: PensumFlowEditorProps) {
  const queryClient = useQueryClient();
  const { nodes: fetchedNodes, edges: fetchedEdges, semesters, isLoading } = usePensumFlow(curriculumId);

  const [nodes, setNodes, onNodesChange] = useNodesState(fetchedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(fetchedEdges);
  const [subjectTarget, setSubjectTarget] = useState<SubjectTarget | null>(null);
  const [semesterTarget, setSemesterTarget] = useState<SemesterTarget | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddSemester, setShowAddSemester] = useState(false);

  useEffect(() => { setNodes(fetchedNodes); }, [fetchedNodes, setNodes]);
  useEffect(() => { setEdges(fetchedEdges); }, [fetchedEdges, setEdges]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['semesters', curriculumId] });
    queryClient.invalidateQueries({ queryKey: ['subjects-all'] });
    queryClient.invalidateQueries({ queryKey: ['prerequisites-all'] });
  }, [queryClient, curriculumId]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges((eds) => addEdge({ ...connection, type: 'deletable' }, eds));
      try {
        await prerequisiteApi.add(connection.target, connection.source);
        queryClient.invalidateQueries({ queryKey: ['prerequisites-all'] });
      } catch {
        setEdges(fetchedEdges);
      }
    },
    [setEdges, fetchedEdges, queryClient],
  );

  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        try { await prerequisiteApi.remove(edge.target, edge.source); } catch { /* ignore */ }
      }
      queryClient.invalidateQueries({ queryKey: ['prerequisites-all'] });
    },
    [queryClient],
  );

  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const data = node.data as SubjectNodeData;
      if (node.type === 'subject') {
        setSubjectTarget({
          id: node.id,
          name: data.label,
          code: data.code ?? '',
          credits: data.credits ?? 0,
          hoursTheory: data.hoursTheory ?? 0,
          hoursPractice: data.hoursPractice ?? 0,
          description: data.description ?? null,
          semesterId: data.semesterId ?? '',
        });
      } else if (node.type === 'semesterHeader') {
        setSemesterTarget({
          id: data.semesterId ?? node.id,
          number: data.semesterNumber ?? 0,
          name: data.semesterName ?? null,
        });
      }
    },
    [],
  );

  const nextSemesterNumber = (semesters[semesters.length - 1]?.number ?? 0) + 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 text-sm">Cargando pensum…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 border-b bg-white flex items-center gap-3 shrink-0 flex-wrap">
        <span className="text-xs text-gray-400">
          Arrastra entre materias para prerrequisitos · × elimina · doble clic edita
        </span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowAddSubject(true)}
            className="text-xs px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors"
          >
            + Materia
          </button>
          <button
            onClick={() => setShowAddSemester(true)}
            className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            + Semestre
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={fitViewOptions}
          minZoom={0.2}
          maxZoom={2}
          deleteKeyCode="Delete"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#e5e7eb" />
          <Controls />
          <MiniMap
            nodeColor={(n) => n.type === 'semesterHeader' ? '#374151' : '#818cf8'}
            maskColor="rgba(0,0,0,0.05)"
          />
        </ReactFlow>
      </div>

      {subjectTarget && (
        <SubjectModal
          mode="edit"
          subject={subjectTarget}
          onClose={() => setSubjectTarget(null)}
          onSaved={() => { invalidateAll(); setSubjectTarget(null); }}
          onDeleted={() => { invalidateAll(); setSubjectTarget(null); }}
        />
      )}
      {showAddSubject && (
        <SubjectModal
          mode="create"
          semesters={semesters}
          onClose={() => setShowAddSubject(false)}
          onSaved={() => { invalidateAll(); setShowAddSubject(false); }}
        />
      )}
      {semesterTarget && (
        <SemesterModal
          mode="edit"
          semester={semesterTarget}
          onClose={() => setSemesterTarget(null)}
          onSaved={() => { invalidateAll(); setSemesterTarget(null); }}
          onDeleted={() => { invalidateAll(); setSemesterTarget(null); }}
        />
      )}
      {showAddSemester && (
        <SemesterModal
          mode="create"
          curriculumId={curriculumId}
          nextNumber={nextSemesterNumber}
          onClose={() => setShowAddSemester(false)}
          onSaved={() => { invalidateAll(); setShowAddSemester(false); }}
        />
      )}
    </div>
  );
}
