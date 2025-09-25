import { useSnackbar } from 'notistack';

export function useToast() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const toast = (message: string, options?: { variant?: 'default' | 'success' | 'error' | 'warning' | 'info' }) => {
    const key = enqueueSnackbar(message, { variant: options?.variant || 'default' });
    return {
      id: key,
      dismiss: () => closeSnackbar(key),
    };
  };

  return {
    toast,
    dismiss: closeSnackbar,
  };
}
