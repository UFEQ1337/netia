import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Alert, Snackbar } from '@mui/material';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarMessage {
  message: string;
  severity: Severity;
}

interface SnackbarContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | null>(null);

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SnackbarMessage>({ message: '', severity: 'info' });
  const queue = useRef<SnackbarMessage[]>([]);

  const processNext = useCallback((): void => {
    if (queue.current.length > 0) {
      const next = queue.current.shift()!;
      setCurrent(next);
      setOpen(true);
    }
  }, []);

  const enqueue = useCallback(
    (message: string, severity: Severity): void => {
      queue.current.push({ message, severity });
      if (!open) {
        processNext();
      }
    },
    [open, processNext],
  );

  const showSuccess = useCallback(
    (message: string): void => enqueue(message, 'success'),
    [enqueue],
  );
  const showError = useCallback(
    (message: string): void => enqueue(message, 'error'),
    [enqueue],
  );
  const showWarning = useCallback(
    (message: string): void => enqueue(message, 'warning'),
    [enqueue],
  );

  const handleClose = useCallback(
    (_event: React.SyntheticEvent | Event, reason?: string): void => {
      if (reason === 'clickaway') return;
      setOpen(false);
    },
    [],
  );

  const handleExited = useCallback((): void => {
    processNext();
  }, [processNext]);

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError, showWarning }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionProps={{ onExited: handleExited }}
      >
        <Alert onClose={handleClose} severity={current.severity} variant="filled" sx={{ width: '100%' }}>
          {current.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export const useMuiSnackbar = (): SnackbarContextType => {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error('useMuiSnackbar must be used within SnackbarProvider');
  return ctx;
};
