const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn()
};

const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(),
    add: jest.fn(),
    get: jest.fn()
  }))
};

const mockStorage = {
  ref: jest.fn(() => ({
    put: jest.fn(),
    getDownloadURL: jest.fn()
  }))
};

export const getAuth = jest.fn(() => mockAuth);
export const getFirestore = jest.fn(() => mockFirestore);
export const getStorage = jest.fn(() => mockStorage);
export const initializeApp = jest.fn(); 