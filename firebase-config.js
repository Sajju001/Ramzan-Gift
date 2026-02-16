// Firebase Configuration
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKs_7OZJVbpkkpRf8fhvG42bAh_A9PJBs",
    authDomain: "ramadan-referral-website.firebaseapp.com",
    databaseURL: "https://ramadan-referral-website-default-rtdb.firebaseio.com",
    projectId: "ramadan-referral-website",
    storageBucket: "ramadan-referral-website.firebasestorage.app",
    messagingSenderId: "228898139949",
    appId: "1:228898139949:web:7f6018fb2c50b85ced6da4",
    measurementId: "G-YGZZQFPM8G"
};

// Initialize Firebase with compat version
firebase.initializeApp(firebaseConfig);

// Get database instance
const database = firebase.database();

// Create references for different data types
const usersRef = database.ref('users');
const referralsRef = database.ref('referrals');
const submissionsRef = database.ref('submissions');

// Make them globally available
window.database = database;
window.usersRef = usersRef;
window.referralsRef = referralsRef;
window.submissionsRef = submissionsRef;

console.log('✅ Firebase initialized successfully with keys:', firebaseConfig.projectId);