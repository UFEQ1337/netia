import React from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Box, Toolbar } from '@mui/material';
import { CustomAppBar } from '~components/CustomAppBar';

function RootLayout(): React.JSX.Element {
  return (
    <>
      <CustomAppBar />
      <Box component="main" sx={{ p: 3, pt: 4 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
