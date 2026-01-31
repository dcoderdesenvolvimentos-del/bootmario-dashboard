import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export async function getUserByPhone(phone) {
  const q = query(collection(db, "users"), where("phone", "==", phone));

  const snap = await getDocs(q);

  if (snap.empty) return null;

  return {
    uid: snap.docs[0].id,
    ...snap.docs[0].data(),
  };
}
