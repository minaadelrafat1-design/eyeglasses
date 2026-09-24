export {
  fetchProducts,
  fetchProductBySlug,
  fetchCategories,
  fetchBrands,
  fetchColors,
  fetchFrameShapes,
  fetchMaterials,
  fetchSizes,
} from "./productService";
export type { ProductQuery, ProductListResult } from "./productService";

export { fetchUserOrders, fetchOrderById, orderStatusToLabel } from "./orderService";

export { getGlassesRecommendations, analyzeCustomerFace } from "./recommendationService";
export {
  getFaceAnalysisProvider,
  registerFaceAnalysisProvider,
  setActiveFaceAnalysisProvider,
  listFaceAnalysisProviders,
  flatteringFrameShapes,
  frameAffinity,
  rankProducts,
  FACE_SHAPE_LABEL,
  FRAME_SHAPE_LABEL,
  FACE_SHAPE_GUIDANCE,
} from "./ai";
export type { FaceAnalysisProvider } from "./ai";

export { createOrder, calculateShipping, calculateTax } from "./checkoutService";

export { fetchAddresses, createAddress, updateAddress, deleteAddress } from "./addressService";
export type { SavedAddress } from "./addressService";

export {
  sendAssistantTurn,
  sanitizeMessage,
  redactPersonalData,
  toTurns,
} from "./assistantService";
