import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5Df-90oZ2JfI01CCmMXYNKSqCJr1MbGA",
  authDomain: "dopamine-zone.firebaseapp.com",
  projectId: "dopamine-zone",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);