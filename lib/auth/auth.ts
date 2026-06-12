import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import * as schema from "@/lib/db/schema/schema";
import { profiles } from "@/lib/db/schema/schema";

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL_LOCAL ||
    process.env.BETTER_AUTH_URL_HOSTED ||
    undefined,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  databaseHooks: {
    // we use it do profile creation for out devscreen application so that we can store user profile data in the database and then use it for personalized ai evaluations
    user: {
      create: {
        after: async (user) => {
          console.log("inside database hooks");
          //perform actions after login
          const existUserProfile = await db.query.profiles.findFirst({
            where: eq(profiles.authId, user.id),
          });
          console.log("existUserProfile", existUserProfile);
          if (!existUserProfile) {
            console.log("CREATING PROFILE FOR USER", user.email);
            await db.insert(profiles).values({
              authId: user.id,
              username: user.name,
              email: user.email,
            });
            console.log("PROFILE CREATED FOR USER", user.email);
          }
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
