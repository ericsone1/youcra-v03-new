export const roomIdFromParam = (param = '') => {
  // 쿼리스트링( ? 이후 ) 제거 후 decode
  const [id] = param.split('?');
  return decodeURIComponent(id);
};

export const roomPath = (roomId, subPath = '') => {
  const base = `/chat/${encodeURIComponent(roomId)}`;
  return subPath ? `${base}/${subPath.replace(/^\/+/, '')}` : base;
}; 