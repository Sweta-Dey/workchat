import firebase from "firebase/app";
import "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA5PepNyY62hZ9q3pmH9Q_UXroOINEFxIU",
  authDomain: "chat-app-dd9a3.firebaseapp.com",
  databaseURL: "https://chat-app-dd9a3.firebaseio.com",
  projectId: "chat-app-dd9a3",
  storageBucket: "chat-app-dd9a3.appspot.com",
  messagingSenderId: "851569713440",
  appId: "1:851569713440:web:22055b4e1853ca3a863745",
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();

export { storage, firebase as default };
