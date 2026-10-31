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

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) {
    let url = process.env.BETTER_AUTH_URL.trim().replace(/\/+$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url;
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/+$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://piz-todo.vercel.app";
  }
  return "http://localhost:3000";
};

const baseUrl = getBaseURL();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "piz-todo-secure-jwt-auth-secret-key-32chars-min-length",
  baseURL: baseUrl,
  trustedOrigins: [
    "http://localhost:3000",
    "https://piz-todo.vercel.app",
    baseUrl,
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});

