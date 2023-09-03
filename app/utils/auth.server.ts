// app/utils/auth.server.ts
import { Authenticator } from "remix-auth";
import { Auth0Strategy } from "remix-auth-auth0";
import { Annotator } from "@prisma/client";
import { sessionStorage } from "./session.server";
import { db } from "./db.server";

export const authenticator = new Authenticator<Annotator>(sessionStorage);

let auth0Strategy = new Auth0Strategy(
  {
    callbackURL: process.env.AUTH_CALLBACK_URL ?? "",
    clientID: process.env.AUTH_CLIENT_ID ?? "",
    clientSecret: process.env.AUTH_CLIENT_SECRET ?? "",
    domain: process.env.AUTH_TENANT ?? "",
  },

  async ({ profile }) => {
    const user = await db.annotator.upsert({
      where: {
        email: profile.emails![0].value,
      },
      update: {},
      create: {
        email: profile.emails![0].value,
      },
    });
    return user;
  }
);

authenticator.use(auth0Strategy);
