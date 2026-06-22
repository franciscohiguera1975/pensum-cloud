import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { SubjectNodeData } from '../utils/buildFlowGraph';

type SubjectNodeType = Node<SubjectNodeData>;

const SEMESTER_COLORS = [
  'bg-blue-50 border-blue-300',
  'bg-emerald-50 border-emerald-300',
  'bg-violet-50 border-violet-300',
  'bg-amber-50 border-amber-300',
  'bg-rose-50 border-rose-300',
  'bg-cyan-50 border-cyan-300',
  'bg-orange-50 border-orange-300',
  'bg-pink-50 border-pink-300',
  'bg-teal-50 border-teal-300',
  'bg-indigo-50 border-indigo-300',
];

function getColor(semesterNumber: number): string {
  return SEMESTER_COLORS[(semesterNumber - 1) % SEMESTER_COLORS.length];
}

export const SubjectNode = memo(({ data }: NodeProps<SubjectNodeType>) => {
  const colorClass = getColor(data.semesterNumber);

  return (
    <div className={`rounded-md border-2 p-2 shadow-sm ${colorClass} text-xs`}>
      <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
      <div className="font-semibold text-gray-800 truncate" title={data.label}>
        {data.label}
      </div>
      <div className="text-gray-500 mt-0.5 flex justify-between">
        <span className="font-mono">{data.code}</span>
        <span>{data.credits} cr</span>
      </div>
      <div className="text-gray-400 mt-0.5">
        T:{data.hoursTheory}h P:{data.hoursPractice}h
      </div>
      <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
    </div>
  );
});

SubjectNode.displayName = 'SubjectNode';
