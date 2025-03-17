import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9082',
    realm: 'YellowCatCompany',
    clientId: 'YellowCatCompanyWeb'
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;