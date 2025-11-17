import { PipelineStage, PIPELINE_STAGES } from '../types/domain';

const SHORTCUTS = new Set<`${PipelineStage}->${PipelineStage}`>([
  'proposal_sent->closed_won',
  'negotiation->closed_won',
  'proposal_drafting->closed_lost',
  'proposal_sent->closed_lost',
]);

const POST_WIN_STAGES: PipelineStage[] = ['onboarding', 'delivering', 'maintenance'];

export const isPostWinStage = (stage: PipelineStage) => POST_WIN_STAGES.includes(stage);

export const getNextStage = (current: PipelineStage): PipelineStage | null => {
  const index = PIPELINE_STAGES.indexOf(current);
  if (index === -1 || index + 1 >= PIPELINE_STAGES.length) {
    return null;
  }
  return PIPELINE_STAGES[index + 1];
};

export const canTransition = (
  from: PipelineStage,
  to: PipelineStage,
  opts?: { force?: boolean }
): boolean => {
  if (from === to) return true;
  if (opts?.force) return true;
  const fromIdx = PIPELINE_STAGES.indexOf(from);
  const toIdx = PIPELINE_STAGES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1) return false;
  if (toIdx === fromIdx + 1) return true;
  if (SHORTCUTS.has(`${from}->${to}` as const)) return true;
  if (isPostWinStage(to)) {
    return from === 'closed_won' || isPostWinStage(from);
  }
  return false;
};

export const isClosedStage = (stage: PipelineStage) => stage === 'closed_won' || stage === 'closed_lost';
export const isTerminalStage = (stage: PipelineStage) => stage === 'closed_lost' || stage === 'maintenance';
