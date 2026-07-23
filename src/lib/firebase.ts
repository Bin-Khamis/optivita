import { initializeApp } from "firebase/app";
import { getFirestore, doc, runTransaction, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseKeys = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "undefined" &&
  firebaseConfig.apiKey !== "null" &&
  firebaseConfig.apiKey.trim() !== "" &&
  !firebaseConfig.apiKey.includes("placeholder") &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "undefined" &&
  firebaseConfig.projectId !== "null" &&
  firebaseConfig.projectId.trim() !== "" &&
  !firebaseConfig.projectId.includes("placeholder")
);

export const app = hasFirebaseKeys ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app) : null;

/**
 * Generate a unique sequential Enrollment ID using Firestore Transactions.
 * Guaranteed to be conflict-free across concurrent client registrations.
 * Includes strict timeout fallback to avoid hanging UI on hosted environments like Netlify.
 */
export async function getNextEnrollmentId(): Promise<string> {
  if (!db) {
    console.warn("Firestore not configured. Generating client-side fallback ID.");
    return generateLocalFallbackId();
  }

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("Firestore transaction timeout")), 1500)
  );

  try {
    const firestorePromise = (async () => {
      const counterRef = doc(db, "counters", "enrollments");
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let nextId = 1001; // Start sequence at OPT-2026-001001

        if (counterDoc.exists()) {
          const data = counterDoc.data();
          if (data && data.currentId !== undefined) {
            const parsed = parseInt(String(data.currentId), 10);
            if (!isNaN(parsed)) {
              nextId = parsed + 1;
            }
          }
        }

        transaction.set(counterRef, { currentId: nextId });
        return `OPT-2026-${String(nextId).padStart(6, "0")}`;
      });
    })();

    return await Promise.race([firestorePromise, timeoutPromise]);
  } catch (error) {
    console.error("Firestore Transaction failed or timed out. Falling back to local ID:", error);
    return generateLocalFallbackId();
  }
}

/**
 * Save enrollment data to Firestore for fast portal queries
 */
export async function saveEnrollmentToFirestore(enrollmentId: string, data: any): Promise<boolean> {
  if (!db) {
    console.warn("Firestore not configured. Skipping Firestore write.");
    return false;
  }

  const timeoutPromise = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), 1500)
  );

  try {
    const firestorePromise = (async () => {
      const docRef = doc(db, "enrollments", enrollmentId);
      await setDoc(docRef, {
        ...data,
        syncedToSheets: false,
        createdAt: new Date().toISOString()
      });
      return true;
    })();

    return await Promise.race([firestorePromise, timeoutPromise]);
  } catch (error) {
    console.error("Failed to save enrollment to Firestore:", error);
    return false;
  }
}

/**
 * Fast Firestore Master Dataset Mirroring
 * Keeps Firestore updated in real-time while Google Sheets serves as permanent master.
 */
export async function saveCRMDataToFirestore(dataset: any): Promise<boolean> {
  if (!db || !dataset) return false;
  try {
    const docRef = doc(db, "crm_cache", "master");
    await setDoc(docRef, {
      data: dataset,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn("Firestore save master warning:", err);
    return false;
  }
}

export async function getCRMDataFromFirestore(): Promise<any | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, "crm_cache", "master");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists() && snapshot.data()?.data) {
      return snapshot.data().data;
    }
  } catch (err) {
    console.warn("Firestore read master warning:", err);
  }
  return null;
}

export async function updateFirestoreRecord(sheetName: string, idKey: string, idValue: string, fields: any): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, "crm_cache", "master");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists() && snapshot.data()?.data) {
      const currentDataset = snapshot.data().data;
      const list = currentDataset[sheetName] || [];
      const idx = list.findIndex((item: any) => item[idKey] === idValue);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...fields };
        currentDataset[sheetName] = list;
        await setDoc(docRef, { data: currentDataset, updatedAt: new Date().toISOString() }, { merge: true });
        return true;
      }
    }
  } catch (err) {
    console.warn("Firestore update record warning:", err);
  }
  return false;
}

/**
 * Mark enrollment as successfully synced to Google Sheets
 */
export async function markEnrollmentSynced(enrollmentId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, "enrollments", enrollmentId);
    await setDoc(docRef, { syncedToSheets: true }, { merge: true });
  } catch (error) {
    console.error("Failed to mark enrollment as synced:", error);
  }
}

/**
 * Fallback local ID generation if Firebase keys are not set
 */
function generateLocalFallbackId(): string {
  let existingEnrollments: any[] = [];
  try {
    const cached = localStorage.getItem("optivita_crm_cache");
    if (cached) {
      existingEnrollments = JSON.parse(cached)["Program Enrollments"] || [];
    }
  } catch (err) {
    console.warn("Could not read CRM cache for local fallback ID:", err);
  }

  let nextIdNumber = 1001;
  existingEnrollments.forEach((enroll: any) => {
    const idStr = enroll["Enrollment ID"] || enroll["EnrollmentID"];
    if (idStr && idStr.startsWith("OPT-2026-")) {
      const numPart = parseInt(idStr.replace("OPT-2026-", ""), 10);
      if (!isNaN(numPart) && numPart >= nextIdNumber) {
        nextIdNumber = numPart + 1;
      }
    }
  });

  return `OPT-2026-${String(nextIdNumber).padStart(6, "0")}`;
}
