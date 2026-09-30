import { eq } from "drizzle-orm";
import { db } from "./index";
import { users, providers, categories, serviceRequests } from "./schema";

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  role: "client" | "provider";
}) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getProviders() {
  return db
    .select({
      id: providers.id,
      bio: providers.bio,
      region: providers.region,
      name: users.name,
      category: categories.name,
    })
    .from(providers)
    .innerJoin(users, eq(providers.userId, users.id))
    .innerJoin(categories, eq(providers.categoryId, categories.id));
}

export async function createServiceRequest(data: {
  clientId: number;
  providerId: number;
}) {
  const [request] = await db
    .insert(serviceRequests)
    .values({
      clientId: data.clientId,
      providerId: data.providerId,
    })
    .returning();
  return request;
}
