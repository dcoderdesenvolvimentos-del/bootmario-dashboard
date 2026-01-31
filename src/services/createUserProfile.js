import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase";

export async function createUserProfile(user, phone) {
  await setDoc(
    doc(db, "users", user.uid),
    {
      phone,
      createdAt: Timestamp.now(),
    },
    { merge: true },
  );
}
