import { useCallback, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Returns { confirm, dialog }.
 *   const { confirm, dialog } = useConfirmDelete();
 *   confirm({ title, description }).then(ok => ok && doDelete());
 * Render `dialog` once near the top of your component tree.
 */
export function useConfirmDelete() {
  const [state, setState] = useState({ open: false });

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: opts.title || 'Delete this record?',
        description: opts.description || 'This action cannot be undone.',
        confirmLabel: opts.confirmLabel || 'Delete',
        resolve,
      });
    });
  }, []);

  const settle = (ok) => {
    state.resolve?.(ok);
    setState((s) => ({ ...s, open: false }));
  };

  const dialog = (
    <AlertDialog open={state.open} onOpenChange={(o) => !o && settle(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => settle(true)}
          >
            {state.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, dialog };
}

export default function ConfirmDeleteDialog() {
  // Standalone component kept for clarity; prefer the useConfirmDelete hook.
  return null;
}