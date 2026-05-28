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
  stallTimeoutMs = 120000,
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
      reject(error)
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
            "Image upload did not make progress. Check Firebase Storage rules, image size, and your internet connection."
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
