import React, { useCallback } from 'react';
import { AppBar, Button, Chip, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import keycloak from '@/services/keycloak';

interface ParsedToken {
  preferred_username?: string;
  tenant_id?: string;
}

export const CustomAppBar: React.FC = () => {
  const parsed = keycloak.tokenParsed as ParsedToken | undefined;

  const handleLogout = useCallback((): void => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Trouble Ticket System
        </Typography>
        {parsed?.preferred_username && (
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
            {parsed.preferred_username}
          </Typography>
        )}
        {parsed?.tenant_id && (
          <Chip
            label={parsed.tenant_id}
            size="small"
            color="secondary"
            sx={{ mr: 2, fontWeight: 600 }}
          />
        )}
        <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />} size="small">
          Wyloguj
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default CustomAppBar;
