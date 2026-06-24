import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

import { firebaseProjectId } from "@/lib/firebase-config"

const cleanEnvValue = (value?: string) =>
  (value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim()

const readServiceAccount = (): ServiceAccount | null => {
  const json = cleanEnvValue(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)

  if (json) {
    const parsed = JSON.parse(json) as ServiceAccount

    return {
      ...parsed,
      privateKey: parsed.privateKey?.replace(/\\n/g, "\n"),
    }
  }

  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL)
  const privateKey = cleanEnvValue(process.env.FIREBASE_PRIVATE_KEY)
  const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || firebaseProjectId

  if (!clientEmail || !privateKey || !projectId) return null

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
    projectId,
  }
}

const getServerApp = () => {
  const existing = getApps().find((item) => item.name === "server-admin")
  if (existing) return existing

  const serviceAccount = readServiceAccount()

  return initializeApp(
    {
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId: serviceAccount?.projectId || firebaseProjectId,
    },
    "server-admin"
  )
}

const serverApp = getServerApp()

export const serverAuth = getAuth(serverApp)
export const serverDb = getFirestore(serverApp)
