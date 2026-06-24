import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
} from "firebase/storage"

type UploadProgress = {
  bytesTransferred: number
  totalBytes: number
  percent: number
}

type UploadImageOptions = {
  storage: FirebaseStorage
  path: string
  file: File
  stallTimeoutMs?: number
  onProgress?: (progress: UploadProgress) => void
}

export const uploadImageAndGetUrl = ({
  storage,
  path,
  file,
  stallTimeoutMs = 25000,
  onProgress,
}: UploadImageOptions) => {
  return new Promise<string>((resolve, reject) => {
    let settled = false
    let stallTimer: ReturnType<typeof setTimeout> | undefined

    const task = uploadBytesResumable(ref(storage, path), file, {
      contentType: file.type || "application/octet-stream",
    })

    const clearStallTimer = () => {
      if (stallTimer) {
        clearTimeout(stallTimer)
        stallTimer = undefined
      }
    }

    const fail = (error: unknown) => {
      if (settled) return
      settled = true
      clearStallTimer()
      reject(normalizeStorageError(error))
    }

    const succeed = (url: string) => {
      if (settled) return
      settled = true
      clearStallTimer()
      resolve(url)
    }

    const resetStallTimer = () => {
      clearStallTimer()
      stallTimer = setTimeout(() => {
        task.cancel()
        fail(
          new Error(
            "Image upload did not start within 25 seconds. Check Firebase Storage rules, bucket name, and your internet connection."
          )
        )
      }, stallTimeoutMs)
    }

    resetStallTimer()

    task.on(
      "state_changed",
      (snapshot) => {
        resetStallTimer()

        const percent = snapshot.totalBytes
          ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          : 0

        onProgress?.({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percent,
        })
      },
      fail,
      async () => {
        try {
          succeed(await getDownloadURL(task.snapshot.ref))
        } catch (error) {
          fail(error)
        }
      }
    )
  })
}

const normalizeStorageError = (error: unknown) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : ""

  if (code === "storage/unauthorized") {
    return new Error(
      "Firebase Storage blocked this upload. Check Storage rules and make sure the logged-in admin can write to products/."
    )
  }

  if (code === "storage/canceled") {
    return new Error(
      "Image upload was cancelled because it did not make progress. Try a smaller image or check Firebase Storage settings."
    )
  }

  if (code === "storage/unknown") {
    return new Error(
      "Firebase Storage could not complete the upload. Check the storage bucket value and internet connection."
    )
  }

  return error instanceof Error ? error : new Error("Image upload failed.")
}
