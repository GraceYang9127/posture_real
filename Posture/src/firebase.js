// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyDXf7CB3bJv7vXxPENjJhUBNPVlWAmUWUo",
  authDomain: "musalytic.firebaseapp.com",
  projectId: "musalytic",  
  storageBucket: "musalytic.appspot.com", 
  messagingSenderId: "910649021640",
  appId: "1:910649021640:web:132913a115f98effedc1fd",
  measurementId: "G-J0XH5B4CCV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const analytics = getAnalytics(app);