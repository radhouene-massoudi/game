export const auth0Config = {
  domain: "your-auth0-domain",
  clientId: "your-client-id",
  authorizationParams: {
    redirect_uri: window.location.origin + '/home'
  }
}; 