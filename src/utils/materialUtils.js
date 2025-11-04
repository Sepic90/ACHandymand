import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../services/firebase';

// ============================================
// FIRESTORE SCHEMA DEFINITIONS
// ============================================

/**
 * SUPPLIERS COLLECTION
 * 
 * Collection: 'suppliers'
 * 
 * Fields:
 * - name: string (required) - Company name
 * - contactPerson: string - Contact person name
 * - phone: string - Phone number
 * - email: string - Email address
 * - cvr: string - CVR number
 * - type: string - "Byggemarked", "Grossist", "Specialforhandler", "Andet"
 * - preferredPaymentMethod: string - "Faktura", "Kontant", "Kort", "MobilePay"
 * - notes: string - Free text notes
 * - createdAt: string (ISO timestamp)
 * - createdBy: string (user identifier)
 * - updatedAt: string (ISO timestamp)
 * - updatedBy: string (user identifier)
 */

/**
 * MATERIALS COLLECTION (Master Catalog)
 * 
 * Collection: 'materials'
 * 
 * Fields:
 * - name: string (required) - Material name (e.g., "Gipsplader 13mm")
 * - unit: string (required) - "stk", "m", "m²", "m³", "kg", "liter", "pose", "rulle", "palle"
 * - category: string (required) - "Træ", "Gips", "El-materialer", "VVS", "Maling", "Værktøj", "Diverse"
 * - sku: string - Supplier item number / artikelnummer
 * - defaultSupplierId: string - Reference to supplier document ID
 * - defaultSupplierName: string - Denormalized supplier name for quick display
 * - standardMarkup: number - Percentage (e.g., 40 for 40%)
 * - lastPurchasePrice: number - Auto-updated from latest purchase
 * - lastPurchaseDate: string (ISO timestamp) - Auto-updated
 * - createdAt: string (ISO timestamp)
 * - createdBy: string
 * - updatedAt: string (ISO timestamp)
 * - updatedBy: string
 */

/**
 * MATERIAL PURCHASES COLLECTION (Transactions)
 * 
 * Collection: 'materialPurchases'
 * 
 * Fields:
 * - caseId: string (required) - Reference to project ID
 * - caseNumber: string - Denormalized project number (e.g., "2025-0042")
 * - caseName: string - Denormalized project name
 * - date: string (required) - Purchase date (ISO format)
 * - materialId: string (nullable) - Reference to materials catalog (if used)
 * - materialName: string (required) - Material name (stored for history)
 * - sku: string - Item number
 * - quantity: number (required) - Amount purchased
 * - unit: string (required) - Unit of measurement
 * - category: string (required) - Material category
 * - supplierId: string - Reference to supplier
 * - supplierName: string (required) - Denormalized supplier name
 * - purchasePrice: number (required) - Total purchase cost
 * - sellingPrice: number (required) - Total selling price
 * - marginKr: number - Calculated: sellingPrice - purchasePrice
 * - marginPercent: number - Calculated: (marginKr / purchasePrice) * 100
 * - paymentMethod: string - "Faktura", "Kontant", "Kort", "Firmakort"
 * - receiptImageUrl: string - Firebase Storage URL
 * - receiptStoragePath: string - Firebase Storage path
 * - notes: string - Free text notes
 * - createdAt: string (ISO timestamp)
 * - createdBy: string
 * - updatedAt: string (ISO timestamp)
 * - updatedBy: string
 */

// ============================================
// SUPPLIERS - CRUD OPERATIONS
// ============================================

/**
 * Create new supplier
 */
export const createSupplier = async (supplierData, createdBy = 'Admin') => {
  try {
    const docRef = await addDoc(collection(db, 'suppliers'), {
      ...supplierData,
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: createdBy
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating supplier:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all suppliers
 */
export const getSuppliers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'suppliers'));
    const suppliers = [];
    
    querySnapshot.forEach((doc) => {
      suppliers.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by name
    suppliers.sort((a, b) => a.name.localeCompare(b.name));
    
    return { success: true, suppliers };
  } catch (error) {
    console.error('Error getting suppliers:', error);
    return { success: false, error: error.message, suppliers: [] };
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (supplierId, updates, updatedBy = 'Admin') => {
  try {
    await updateDoc(doc(db, 'suppliers', supplierId), {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating supplier:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete supplier
 */
export const deleteSupplier = async (supplierId) => {
  try {
    await deleteDoc(doc(db, 'suppliers', supplierId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// MATERIALS CATALOG - CRUD OPERATIONS
// ============================================

/**
 * Create new material in catalog
 */
export const createMaterial = async (materialData, createdBy = 'Admin') => {
  try {
    const docRef = await addDoc(collection(db, 'materials'), {
      ...materialData,
      lastPurchasePrice: null,
      lastPurchaseDate: null,
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: createdBy
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating material:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all materials
 */
export const getMaterials = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'materials'));
    const materials = [];
    
    querySnapshot.forEach((doc) => {
      materials.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by name
    materials.sort((a, b) => a.name.localeCompare(b.name));
    
    return { success: true, materials };
  } catch (error) {
    console.error('Error getting materials:', error);
    return { success: false, error: error.message, materials: [] };
  }
};

/**
 * Update material
 */
export const updateMaterial = async (materialId, updates, updatedBy = 'Admin') => {
  try {
    await updateDoc(doc(db, 'materials', materialId), {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating material:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete material
 */
export const deleteMaterial = async (materialId) => {
  try {
    await deleteDoc(doc(db, 'materials', materialId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting material:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// MATERIAL PURCHASES - CRUD OPERATIONS
// ============================================

/**
 * Create material purchase
 * Auto-calculates margins
 * Updates material catalog with last purchase info if materialId provided
 */
export const createMaterialPurchase = async (purchaseData, createdBy = 'Admin') => {
  try {
    // Calculate margins
    const marginKr = purchaseData.sellingPrice - purchaseData.purchasePrice;
    const marginPercent = (marginKr / purchaseData.purchasePrice) * 100;
    
    // Create purchase record
    const docRef = await addDoc(collection(db, 'materialPurchases'), {
      ...purchaseData,
      marginKr: marginKr,
      marginPercent: marginPercent,
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      updatedAt: new Date().toISOString(),
      updatedBy: createdBy
    });
    
    // Update material catalog if this purchase references a catalog item
    if (purchaseData.materialId) {
      await updateMaterial(purchaseData.materialId, {
        lastPurchasePrice: purchaseData.purchasePrice / purchaseData.quantity, // Unit price
        lastPurchaseDate: purchaseData.date
      }, createdBy);
    }
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating material purchase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all material purchases for a specific case
 */
export const getCaseMaterialPurchases = async (caseId) => {
  try {
    const q = query(
      collection(db, 'materialPurchases'),
      where('caseId', '==', caseId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const purchases = [];
    
    querySnapshot.forEach((doc) => {
      purchases.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, purchases };
  } catch (error) {
    console.error('Error getting case material purchases:', error);
    return { success: false, error: error.message, purchases: [] };
  }
};

/**
 * Get all material purchases (for standalone module overview)
 */
export const getAllMaterialPurchases = async () => {
  try {
    const q = query(
      collection(db, 'materialPurchases'),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const purchases = [];
    
    querySnapshot.forEach((doc) => {
      purchases.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, purchases };
  } catch (error) {
    console.error('Error getting all material purchases:', error);
    return { success: false, error: error.message, purchases: [] };
  }
};

/**
 * Update material purchase
 * Recalculates margins
 */
export const updateMaterialPurchase = async (purchaseId, updates, updatedBy = 'Admin') => {
  try {
    // Recalculate margins if prices changed
    let dataToUpdate = { ...updates };
    
    if (updates.purchasePrice !== undefined || updates.sellingPrice !== undefined) {
      // Get current document to get missing values
      const docSnap = await getDoc(doc(db, 'materialPurchases', purchaseId));
      const currentData = docSnap.data();
      
      const purchasePrice = updates.purchasePrice ?? currentData.purchasePrice;
      const sellingPrice = updates.sellingPrice ?? currentData.sellingPrice;
      
      const marginKr = sellingPrice - purchasePrice;
      const marginPercent = (marginKr / purchasePrice) * 100;
      
      dataToUpdate.marginKr = marginKr;
      dataToUpdate.marginPercent = marginPercent;
    }
    
    await updateDoc(doc(db, 'materialPurchases', purchaseId), {
      ...dataToUpdate,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating material purchase:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete material purchase
 */
export const deleteMaterialPurchase = async (purchaseId) => {
  try {
    await deleteDoc(doc(db, 'materialPurchases', purchaseId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting material purchase:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate total purchase cost for a case
 */
export const calculateTotalPurchaseCost = (purchases) => {
  if (!purchases || purchases.length === 0) return 0;
  return purchases.reduce((sum, purchase) => sum + (purchase.purchasePrice || 0), 0);
};

/**
 * Calculate total selling price for a case
 */
export const calculateTotalSellingPrice = (purchases) => {
  if (!purchases || purchases.length === 0) return 0;
  return purchases.reduce((sum, purchase) => sum + (purchase.sellingPrice || 0), 0);
};

/**
 * Calculate total margin for a case
 */
export const calculateTotalMargin = (purchases) => {
  const purchaseCost = calculateTotalPurchaseCost(purchases);
  const sellingPrice = calculateTotalSellingPrice(purchases);
  return sellingPrice - purchaseCost;
};

/**
 * Calculate average margin percentage for a case
 */
export const calculateAverageMarginPercent = (purchases) => {
  const purchaseCost = calculateTotalPurchaseCost(purchases);
  if (purchaseCost === 0) return 0;
  const margin = calculateTotalMargin(purchases);
  return (margin / purchaseCost) * 100;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate supplier data
 */
export const validateSupplierData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Navn er påkrævet');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate material data
 */
export const validateMaterialData = (data) => {
  const errors = [];
  
  if (!data.name || data.name.trim() === '') {
    errors.push('Navn er påkrævet');
  }
  
  if (!data.unit || data.unit.trim() === '') {
    errors.push('Enhed er påkrævet');
  }
  
  if (!data.category || data.category.trim() === '') {
    errors.push('Kategori er påkrævet');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validate material purchase data
 */
export const validatePurchaseData = (data) => {
  const errors = [];
  
  if (!data.caseId) {
    errors.push('Sag er påkrævet');
  }
  
  if (!data.date) {
    errors.push('Dato er påkrævet');
  }
  
  if (!data.materialName || data.materialName.trim() === '') {
    errors.push('Materiale navn er påkrævet');
  }
  
  if (!data.quantity || data.quantity <= 0) {
    errors.push('Antal skal være større end 0');
  }
  
  if (!data.unit || data.unit.trim() === '') {
    errors.push('Enhed er påkrævet');
  }
  
  if (!data.category || data.category.trim() === '') {
    errors.push('Kategori er påkrævet');
  }
  
  if (!data.supplierName || data.supplierName.trim() === '') {
    errors.push('Leverandør er påkrævet');
  }
  
  if (data.purchasePrice === undefined || data.purchasePrice < 0) {
    errors.push('Indkøbspris er påkrævet');
  }
  
  if (data.sellingPrice === undefined || data.sellingPrice < 0) {
    errors.push('Salgspris er påkrævet');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};