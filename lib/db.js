import { headers as nextHeaders } from "next/headers";
import { auth } from "./auth";

export async function getUserFromRequest(headers) {
  try {
    if (headers) {
      const session = await auth.api.getSession({ headers });
      if (session?.user) {
        return session.user;
      }
    }
  } catch (err) {}

  try {
    const h = await nextHeaders();
    const session = await auth.api.getSession({ headers: h });
    if (session?.user) {
      return session.user;
    }
  } catch (err) {}

  return null;
}
