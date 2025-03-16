import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9082', // Đảm bảo URL này đúng
    realm: 'YellowCatCompany',
    clientId: 'YellowCatCompanyWeb',
    client_secret: 'tc2vierNhQ0BsIIkBXzvyHVY61SItzsU'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;