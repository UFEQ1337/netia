import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KC_URL as string,
  realm: import.meta.env.VITE_KC_REALM as string,
  clientId: import.meta.env.VITE_KC_CLIENT_ID as string,
});

export default keycloak;
