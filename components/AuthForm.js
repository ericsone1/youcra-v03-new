import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { auth, db } from "../firebase";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";

function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // Firestore에서 불러온 정보

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Firestore에서 사용자 정보 불러오기
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserInfo(docSnap.data());
        } else {
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 구글 로그인 자동 실행 (user가 없을 때만)
  useEffect(() => {
    if (!user) {
      handleGoogleLogin();
    }
    // eslint-disable-next-line
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("로그인 성공!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        alert("회원가입 성공!");
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    alert("로그아웃 되었습니다!");
  };

  // 구글 로그인 핸들러 (리디렉션 방식)
  const handleGoogleLogin = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // 리디렉션 후에는 자동으로 Firebase가 인증 상태를 관리합니다.
    } catch (err) {
      setError("구글 로그인 실패: " + err.message);
    }
  };

  if (user) {
    return (
      <div className="max-w-xs mx-auto mt-10 p-4 border rounded bg-white">
        <h2 className="text-xl font-bold mb-4">환영합니다!</h2>
        <p className="mb-2">이메일: {user.email}</p>
        {userInfo && (
          <p className="mb-2 text-sm text-gray-500">
            가입일: {userInfo.createdAt?.toDate?.().toLocaleString() || "정보 없음"}
          </p>
        )}
        <button
          className="w-full bg-red-500 text-white p-2 rounded"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    );
  }

  // user가 없으면 아무 UI도 렌더링하지 않음(자동 구글 로그인만)
  return null;
}

export default AuthForm;