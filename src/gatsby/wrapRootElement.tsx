import React from "react";
import { WrapRootElementBrowserArgs } from "gatsby";

import { IdentityProvider } from "../context/netlifyIdentityContext";

export const wrapRootElement = ({ element }: WrapRootElementBrowserArgs) => (
  <IdentityProvider>{element}</IdentityProvider>
);
