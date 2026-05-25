import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  resolve: (ok: boolean) => void;
}

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

/**
 * Hook que reemplaza window.confirm() con un modal integrado y estilizado.
 *
 * Uso:
 *   const { confirm, dialog } = useConfirm();
 *   // ...
 *   if (await confirm("¿Borrar este item?")) doDelete();
 *   // ...
 *   return <>{dialog}{otherStuff}</>;
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (message: string, opts: ConfirmOptions = {}) =>
      new Promise<boolean>((resolve) => {
        setState({
          title: opts.title ?? "Confirmar",
          message,
          confirmLabel: opts.confirmLabel ?? "Confirmar",
          destructive: opts.destructive ?? true,
          resolve,
        });
      }),
    []
  );

  const close = (result: boolean) => {
    if (!state) return;
    state.resolve(result);
    setState(null);
  };

  const dialog = state ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-elegant">
        <div className="flex items-start gap-4 p-6">
          <div
            className={
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full " +
              (state.destructive ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")
            }
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg">{state.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-3">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={
              "rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors " +
              (state.destructive
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90")
            }
          >
            {state.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
