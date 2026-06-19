import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface SuspenseLoaderProps {
  children: React.ReactNode;
}

const Fallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <CircularProgress />
  </Box>
);

export const SuspenseLoader: React.FC<SuspenseLoaderProps> = ({ children }) => (
  <Suspense fallback={<Fallback />}>{children}</Suspense>
);

export default SuspenseLoader;
