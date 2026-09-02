// Local browser fixture only. Never deployed.
export const initializeApp=()=>({}),getAuth=()=>({}),getFirestore=()=>({}),doc=()=>({});
export const getDoc=async()=>({exists:()=>false});
export class GoogleAuthProvider{}
export const onAuthStateChanged=(_,callback)=>setTimeout(()=>callback({uid:'mp-fixture-only',displayName:'Testspelare',getIdToken:async()=>'fixture'}),0);
export const signInWithPopup=async()=>{},signOut=async()=>{};
