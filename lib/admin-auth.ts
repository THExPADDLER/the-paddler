import { doc, getDoc } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"

const FIREBASE_API_KEY = "AIzaSyCQqRihdwwSiF-wJb1PL19HIs4rrGLryEI"

type FirebaseLookupResponse = {
  users?: Array<{
    localId?: string
    email?: string
  }>
}

export const requireAdminRequest = async (request: Request) => {
  const authHeader = request.headers.get("authorization") || ""
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : ""

  if (!token) {
    throw new Error("Admin authorization token is required.")
  }

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken: token }),
    }
  )
  const lookupData = (await lookupResponse.json()) as FirebaseLookupResponse
  const uid = lookupData.users?.[0]?.localId

  if (!lookupResponse.ok || !uid) {
    throw new Error("Invalid admin authorization token.")
  }

  const profile = await getDoc(doc(serverDb, "users", uid))

  if (!profile.exists() || profile.data().role !== "admin") {
    throw new Error("Admin access is required.")
  }

  return {
    uid,
    email: lookupData.users?.[0]?.email || "",
  }
}

