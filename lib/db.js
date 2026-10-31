import { auth } from "./auth";

export async function getUserFromRequest(headers) {
  try {
    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      return session.user;
    }
  } catch (err) {
    // Session check
  }

  return null;
}
