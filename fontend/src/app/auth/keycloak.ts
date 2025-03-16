import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9082', // Đảm bảo URL này đúng
    realm: 'Yellow Cat Company',
    clientId: 'Yellow Cat Company Web',
    redirectUri: 'http://localhost:9082/realms/Yellow Cat Company/broker/github/endpoint'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;