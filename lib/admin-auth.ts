import { serverAuth, serverDb } from "@/lib/firebase-server"

type RequestRole = "admin" | "staff" | "customer"

export type AuthorizedRequest = {
  uid: string
  email: string
  role: RequestRole
}

const readBearerToken = (request: Request) => {
  const authHeader = request.headers.get("authorization") || ""
  return authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : ""
}

export const requireUserRequest = async (request: Request): Promise<AuthorizedRequest> => {
  const token = readBearerToken(request)

  if (!token) {
    throw new Error("Authorization token is required.")
  }

  const decodedToken = await serverAuth.verifyIdToken(token).catch(() => null)
  const uid = decodedToken?.uid

  if (!uid) {
    throw new Error("Invalid authorization token.")
  }

  const profile = await serverDb.collection("users").doc(uid).get()
  const savedRole = profile.exists ? String(profile.data()?.role || "") : ""
  const role: RequestRole =
    savedRole === "admin" || savedRole === "staff" ? savedRole : "customer"

  return {
    uid,
    email: decodedToken.email || "",
    role,
  }
}

export const requireAdminRequest = async (request: Request) => {
  const auth = await requireUserRequest(request)

  if (auth.role !== "admin") {
    throw new Error("Admin access is required.")
  }

  return auth
}

export const requireStaffRequest = async (request: Request) => {
  const auth = await requireUserRequest(request)

  if (auth.role !== "admin" && auth.role !== "staff") {
    throw new Error("Admin or staff access is required.")
  }

  return auth
}

export const assertOrderAccess = (
  auth: AuthorizedRequest,
  order: Record<string, unknown>,
  action = "access this order"
) => {
  if (auth.role === "admin" || auth.role === "staff") return

  if (String(order.userId || "") !== auth.uid) {
    throw new Error(`You are not allowed to ${action}.`)
  }
}
