import type { ActionFunction, LoaderFunction } from "@remix-run/node";

import { authenticator } from "~/utils/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("auth0", request, {
    successRedirect: "/",
    failureRedirect: "/login",
  });
};
