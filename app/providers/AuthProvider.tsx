"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userProfile = {
          uid: currentUser.uid,
          name: currentUser.displayName || "Customer",
          email: currentUser.email || "",
          phone: currentUser.phoneNumber || "",
          photoURL: currentUser.photoURL || "",
          providerIds: currentUser.providerData.map((provider) => provider.providerId),
          lastLoginAt: new Date().toISOString(),
        };

        localStorage.setItem(
          "user",
          JSON.stringify(userProfile)
        );

        try {
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              ...userProfile,
              createdAt: new Date(
                currentUser.metadata.creationTime || Date.now()
              ).toISOString(),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (error) {
          console.error("USER PROFILE SAVE ERROR:", error);
        }
      } else {
        localStorage.removeItem("user");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
