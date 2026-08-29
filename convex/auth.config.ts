const issuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;

const authConfig = {
  providers: [
    {
      domain: issuerDomain || (process.env.NODE_ENV !== 'production' ? 'https://sweet-escargot-3007.clerk.accounts.dev' : ''),
      applicationID: 'convex',
    },
  ],
};

export default authConfig;


