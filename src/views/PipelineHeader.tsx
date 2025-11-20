"use client";

import { useState } from "react";
import { PageHeader, NewClientDialog } from "@/components";
import { PipelineStage } from "@/types/ui";

interface PipelineHeaderProps {
  stages: PipelineStage[];
}

export function PipelineHeader({ stages }: PipelineHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Pipeline Board"
        description="Track single-user deals and move clients through defined stages."
      />
      <div className="flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="button-premium text-xs tracking-[0.18em]"
        >
          Add Client
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="button-ghost text-xs tracking-[0.18em] text-slate-200 border border-white/15 px-4 py-2 rounded-full"
        >
          New Note
        </button>
      </div>
      <NewClientDialog stages={stages} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}
