import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Undo2, Redo2, Send } from 'lucide-react';

interface ToolbarProps {
  testMode: boolean;
  onToggleTestMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSubmit: () => void;
  canUndo: boolean;
  canRedo: boolean;
  submitted: boolean;
}

export const Toolbar = ({
  testMode,
  onToggleTestMode,
  onUndo,
  onRedo,
  onSubmit,
  canUndo,
  canRedo,
  submitted,
}: ToolbarProps) => {
  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant={testMode ? "default" : "secondary"}
          size="sm"
          onClick={onToggleTestMode}
          disabled={submitted}
          className="gap-2 relative"
        >
          {testMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="font-medium">
            {testMode ? 'Modo TEST' : 'Modo ESTUDIANTE'}
          </span>
          {testMode && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-connection-valid rounded-full animate-pulse" />
          )}
        </Button>
        {testMode && (
          <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded">
            Doble-clic para editar títulos
          </span>
        )}
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo || submitted}
          className="gap-2"
        >
          <Undo2 className="w-4 h-4" />
          Deshacer
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo || submitted}
          className="gap-2"
        >
          <Redo2 className="w-4 h-4" />
          Rehacer
        </Button>
      </div>

      <div className="flex-1" />

      <Button
        onClick={onSubmit}
        size="sm"
        disabled={submitted}
        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
      >
        <Send className="w-4 h-4" />
        {submitted ? 'Evaluación Entregada' : 'Entregar Evaluación'}
      </Button>

      <div className="text-xs text-muted-foreground hidden md:block">
        <span className="opacity-70">Pan:</span> Alt+Arrastrar | <span className="opacity-70">Zoom:</span> Rueda
      </div>
    </div>
  );
};
