import React from "react";
import { WrapRootElementBrowserArgs } from "gatsby";
import { ApolloProvider } from "@apollo/client";

import { IdentityProvider } from "../context/netlifyIdentityContext";
import { apolloClient } from "../context/apolloContext";

export const wrapRootElement = ({ element }: WrapRootElementBrowserArgs) => (
  <ApolloProvider client={apolloClient}>
    <IdentityProvider>{element}</IdentityProvider>
  </ApolloProvider>
);
