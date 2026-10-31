import { getDb } from "./mongodb";
import { auth } from "./auth";
import { ObjectId } from "mongodb";

export async function getUserFromRequest(headers) {
  try {
    const session = await auth.api.getSession({ headers });
    if (session?.user) {
      return session.user;
    }
  } catch (err) {
    // Session check fallback
  }

  // If no session found in cookies, check if any registered user exists in `user` collection
  try {
    const db = await getDb();
    const firstUser = await db.collection("user").findOne({});
    if (firstUser) {
      return {
        id: firstUser._id.toString(),
        name: firstUser.name,
        email: firstUser.email,
        image: firstUser.image || null,
      };
    }
  } catch {
    // DB lookup fallback
  }

  return {
    id: "guest_user",
    name: "Guest User",
    email: "guest@piz-todo.app",
    image: null,
  };
}
