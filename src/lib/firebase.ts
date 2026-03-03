import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB4Oy84xbu-caR--DfnhnE84ZOV3zVVBT0",
    authDomain: "nerotiemhoa.firebaseapp.com",
    projectId: "nerotiemhoa",
    storageBucket: "nerotiemhoa.firebasestorage.app",
    messagingSenderId: "587304724504",
    appId: "1:587304724504:web:8ea5359976118d2f157b6d",
    measurementId: "G-VH0ZNWV6ZB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
