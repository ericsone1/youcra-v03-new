import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
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

  return (
    <div className="max-w-xs mx-auto mt-10 p-4 border rounded bg-white">
      <h2 className="text-xl font-bold mb-4">{isLogin ? "로그인" : "회원가입"}</h2>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full mb-2 p-2 border rounded"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full mb-2 p-2 border rounded"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-blue-500 text-white p-2 rounded" type="submit">
          {isLogin ? "로그인" : "회원가입"}
        </button>
      </form>
      <button
        className="mt-2 text-blue-500 underline"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "회원가입 하기" : "로그인 하기"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}

export default AuthForm;