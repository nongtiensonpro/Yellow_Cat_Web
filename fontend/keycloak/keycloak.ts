// @ts-ignore
import Keycloak from "keycloak-js";

const keycloakConfig = {
    url: 'http://localhost:9082',
    realm: 'YellowCatCompany',
    clientId: 'YellowCatCompanyWeb',
    redirectUri: 'http://localhost:3000',
    publicClient: true
};

const keycloak = new Keycloak(keycloakConfig);

export default keycloak;