import { memo } from 'react';
import type { Node, NodeProps } from '@xyflow/react';
import type { SubjectNodeData } from '../utils/buildFlowGraph';

type SemesterHeaderNodeType = Node<SubjectNodeData>;

export const SemesterHeaderNode = memo(({ data }: NodeProps<SemesterHeaderNodeType>) => {
  return (
    <div className="rounded-t-md bg-gray-800 text-white text-xs font-bold text-center py-2 px-3 tracking-wide uppercase">
      {data.label}
    </div>
  );
});

SemesterHeaderNode.displayName = 'SemesterHeaderNode';
