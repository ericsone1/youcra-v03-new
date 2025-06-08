import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase";
import { detectPlatform, getPlatformMeta, isValidUrl, normalizeUrl, PLATFORM_TYPES } from "../../../utils/platformDetector";

export const useProfile = (user) => {
  const [profile, setProfile] = useState({
    nickname: "",
    profileImage: "",
    email: user?.email || "",
    uid: user?.uid || "",
    point: 0,
    channelLink: "",
  });
  const [newNickname, setNewNickname] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [newChannelLink, setNewChannelLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [registeredChannels, setRegisteredChannels] = useState([]);
  const [hasBlog, setHasBlog] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);
  const fileInputRef = useRef();
  const nicknameInputRef = useRef();

  // 유저 정보 및 블로그 상태 불러오기
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setBlogLoading(true);
      try {
        // 사용자 프로필 정보
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile({
            ...profile,
            ...docSnap.data(),
          });
          setNewNickname(docSnap.data().nickname || "");
          setPreviewUrl(docSnap.data().profileImage || "");
          setNewChannelLink(docSnap.data().channelLink || "");
          setRegisteredChannels(docSnap.data().registeredChannels || []);
        }

        // 블로그 존재 여부 확인
        const blogRef = doc(db, "blogs", user.uid);
        const blogSnap = await getDoc(blogRef);
        setHasBlog(blogSnap.exists());
      } catch (error) {
        console.error("프로필 로드 오류:", error);
      } finally {
        setBlogLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  // 이미지 미리보기
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // 프로필 저장
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    let imageUrl = profile.profileImage;
    if (imageFile) {
      const storageRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    const userData = {
      nickname: newNickname,
      profileImage: imageUrl,
      email: user.email,
      uid: user.uid,
    };
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    setProfile(userData);
    setSaving(false);
    alert("프로필이 저장되었습니다!");
  };

  // 채널 등록
  const handleSaveChannelLink = async () => {
    if (!user || !newChannelLink.trim()) return;
    
    // URL 유효성 검사
    if (!isValidUrl(newChannelLink)) {
      alert("올바른 URL을 입력해주세요.");
      return;
    }
    
    setSaving(true);
    
    try {
      const normalizedUrl = normalizeUrl(newChannelLink);
      const platformType = detectPlatform(normalizedUrl);
      const platformMeta = getPlatformMeta(platformType);
      
      // 새 채널 정보 객체
      const newChannel = {
        id: Date.now().toString(), // 임시 ID
        url: normalizedUrl,
        platformType,
        platformMeta,
        registeredAt: new Date(),
        isActive: true
      };
      
      // 기존 채널 목록에 추가
      const updatedChannels = [...registeredChannels, newChannel];
      
      // Firestore에 저장
      await setDoc(doc(db, "users", user.uid), { 
        channelLink: normalizedUrl, // 호환성 유지
        registeredChannels: updatedChannels 
      }, { merge: true });
      
      setProfile((prev) => ({ ...prev, channelLink: normalizedUrl }));
      setRegisteredChannels(updatedChannels);
      setNewChannelLink("");
      
      alert(`${platformMeta.name} 채널이 등록되었습니다!`);
    } catch (error) {
      console.error("채널 등록 오류:", error);
      alert("채널 등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 닉네임 편집 완료 처리
  const handleNicknameSubmit = async () => {
    if (!user) return;
    setSaving(true);
    
    const userData = {
      nickname: newNickname,
      profileImage: profile.profileImage,
      email: user.email,
      uid: user.uid,
    };
    
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    setProfile(prev => ({ ...prev, nickname: newNickname }));
    setIsEditingNickname(false);
    setSaving(false);
  };

  // Enter 키나 포커스 아웃 시 저장
  const handleNicknameKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleNicknameSubmit();
    } else if (e.key === 'Escape') {
      setNewNickname(profile.nickname || "");
      setIsEditingNickname(false);
    }
  };

  return {
    profile,
    setProfile,
    newNickname,
    setNewNickname,
    imageFile,
    previewUrl,
    newChannelLink,
    setNewChannelLink,
    saving,
    isEditingNickname,
    setIsEditingNickname,
    registeredChannels,
    setRegisteredChannels,
    hasBlog,
    setHasBlog,
    blogLoading,
    fileInputRef,
    nicknameInputRef,
    handleImageChange,
    handleSave,
    handleSaveChannelLink,
    handleNicknameSubmit,
    handleNicknameKeyDown
  };
}; 