import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9082', // Đảm bảo URL này đúng
    realm: 'YellowCatCompany',
    clientId: 'YellowCatCompanyWeb',
    redirectUri: 'http://localhost:9082/realms/YellowCatCompany/broker/google/endpoint'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;