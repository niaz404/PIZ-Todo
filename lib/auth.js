import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const uri =
  process.env.MONGO_URI ||
  "mongodb+srv://tanimDb:7cRMoICFj1sRUM04@niazsshowcase.qanzpdr.mongodb.net/linkup-todo";

let client;
if (process.env.NODE_ENV === "development") {
  if (!global._authMongoClient) {
    global._authMongoClient = new MongoClient(uri);
  }
  client = global._authMongoClient;
} else {
  client = new MongoClient(uri);
}

const db = client.db("linkup-todo");

const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL === "1" ||
  Boolean(process.env.VERCEL_URL);

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) {
    let url = process.env.BETTER_AUTH_URL.trim().replace(/\/+$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    // If running in production or on Vercel, ignore any localhost URL
    if (!(isProd && url.includes("localhost"))) {
      return url;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    let url = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
    if (!(isProd && url.includes("localhost"))) {
      return url;
    }
  }

  if (isProd) {
    return "https://piz-todo.vercel.app";
  }

  return "http://localhost:3000";
};

const baseUrl = getBaseURL();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  verification: {
    storeInDatabase: true,
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "piz-todo-secure-jwt-auth-secret-key-32chars-min-length",
  baseURL: baseUrl,
  trustedOrigins: [
    "http://localhost:3000",
    "https://piz-todo.vercel.app",
    baseUrl,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  advanced: {
    useSecureCookies: isProd,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProd,
      path: "/",
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectURI: `${baseUrl}/api/auth/callback/google`,
    },
  },
});

