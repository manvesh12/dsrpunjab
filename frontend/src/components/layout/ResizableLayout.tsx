import React from "react";
// @ts-ignore
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GripVertical } from "lucide-react";

interface ResizableLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelDefaultSize?: number;
  rightPanelDefaultSize?: number;
  leftPanelMinSize?: number;
  rightPanelMinSize?: number;
  className?: string;
}

export default function ResizableLayout({
  leftPanel,
  rightPanel,
  leftPanelDefaultSize = 50,
  rightPanelDefaultSize = 50,
  leftPanelMinSize = 25,
  rightPanelMinSize = 25,
  className = "",
}: ResizableLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className={`w-full ${className}`}>
      <Panel defaultSize={leftPanelDefaultSize} minSize={leftPanelMinSize} className="pr-2">
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          {leftPanel}
        </div>
      </Panel>

      <PanelResizeHandle className="flex w-3 items-center justify-center transition-colors hover:bg-slate-200 cursor-col-resize group rounded">
        <div className="flex h-12 w-1.5 flex-col items-center justify-center rounded-sm bg-slate-300 group-hover:bg-blue-500 transition-colors">
          <GripVertical className="text-white opacity-80" size={14} />
        </div>
      </PanelResizeHandle>

      <Panel defaultSize={rightPanelDefaultSize} minSize={rightPanelMinSize} className="pl-2">
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">
          {rightPanel}
        </div>
      </Panel>
    </PanelGroup>
  );
}
