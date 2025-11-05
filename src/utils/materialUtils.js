import { db } from '../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, getDoc } from 'firebase/firestore';

/**
 * IMPORTANT NOTES ON PRICE STORAGE:
 * 
 * In materialPurchases collection:
 * - purchasePrice: TOTAL price for the quantity (e.g., 15 units at 10 kr each = 150 kr TOTAL)
 * - sellingPrice: TOTAL price for the quantity (e.g., 15 units at 15 kr each = 225 kr TOTAL)
 * - quantity: Number of units
 * - Calculations: All totals are calculated by summing purchasePrice and sellingPrice directly
 * 
 * In materials catalog:
 * - lastPurchasePrice: PER-UNIT price (calculated as: totalPrice / quantity)
 * - This allows reusing the price when adding the material to new purchases
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
    suppliers.sort((a, b) => (a.name || '').localeCompare(b.name));
    
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
// MATERIALS - CRUD OPERATIONS
// ============================================

/**
 * Create new material in catalog
 */
export const createMaterial = async (materialData, createdBy = 'Admin') => {
  try {
    const docRef = await addDoc(collection(db, 'materials'), {
      ...materialData,
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
 * Get all materials from catalog
 */
export const getMaterials = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'materials'));
    const materials = [];
    
    querySnapshot.forEach((doc) => {
      materials.push({ id: doc.id, ...doc.data() });
    });
    
    // Sort by name
    materials.sort((a, b) => (a.name || '').localeCompare(b.name));
    
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
 * IMPORTANT: purchaseData.purchasePrice and purchaseData.sellingPrice should be TOTAL prices
 * (e.g., if buying 15 units at 10 kr each, pass purchasePrice = 150)
 * 
 * Auto-calculates margins based on TOTAL prices
 * Updates material catalog with PER-UNIT price if materialId provided
 */
export const createMaterialPurchase = async (purchaseData, createdBy = 'Admin') => {
  try {
    // Calculate margins based on TOTAL prices
    const totalPurchasePrice = purchaseData.purchasePrice; // This is already the total
    const totalSellingPrice = purchaseData.sellingPrice; // This is already the total
    
    const marginKr = totalSellingPrice - totalPurchasePrice;
    const marginPercent = totalPurchasePrice > 0 ? (marginKr / totalPurchasePrice) * 100 : 0;
    
    // Create purchase record with TOTAL prices
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
    // Store PER-UNIT price in catalog for reuse
    if (purchaseData.materialId && purchaseData.quantity > 0) {
      const unitPurchasePrice = purchaseData.purchasePrice / purchaseData.quantity;
      
      await updateMaterial(purchaseData.materialId, {
        lastPurchasePrice: unitPurchasePrice, // Store per-unit price
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
 * Recalculates margins based on TOTAL prices
 */
export const updateMaterialPurchase = async (purchaseId, updates, updatedBy = 'Admin') => {
  try {
    // Recalculate margins if prices changed
    let dataToUpdate = { ...updates };
    
    if (updates.purchasePrice !== undefined || updates.sellingPrice !== undefined) {
      // Get current document to get missing values
      const docSnap = await getDoc(doc(db, 'materialPurchases', purchaseId));
      const currentData = docSnap.data();
      
      // Use TOTAL prices for calculations
      const totalPurchasePrice = updates.purchasePrice ?? currentData.purchasePrice;
      const totalSellingPrice = updates.sellingPrice ?? currentData.sellingPrice;
      
      const marginKr = totalSellingPrice - totalPurchasePrice;
      const marginPercent = totalPurchasePrice > 0 ? (marginKr / totalPurchasePrice) * 100 : 0;
      
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
 * Sums up TOTAL purchasePrice values (already includes quantity)
 */
export const calculateTotalPurchaseCost = (purchases) => {
  if (!purchases || purchases.length === 0) return 0;
  // purchasePrice is already TOTAL price (quantity * unit_price)
  return purchases.reduce((sum, purchase) => sum + (purchase.purchasePrice || 0), 0);
};

/**
 * Calculate total selling price for a case
 * Sums up TOTAL sellingPrice values (already includes quantity)
 */
export const calculateTotalSellingPrice = (purchases) => {
  if (!purchases || purchases.length === 0) return 0;
  // sellingPrice is already TOTAL price (quantity * unit_price)
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

/**
 * Calculate per-unit prices from a purchase
 * Helper function to derive unit prices from totals
 */
export const calculateUnitPrices = (purchase) => {
  if (!purchase || !purchase.quantity || purchase.quantity === 0) {
    return {
      unitPurchasePrice: 0,
      unitSellingPrice: 0,
      unitMargin: 0
    };
  }
  
  const unitPurchasePrice = purchase.purchasePrice / purchase.quantity;
  const unitSellingPrice = purchase.sellingPrice / purchase.quantity;
  const unitMargin = unitSellingPrice - unitPurchasePrice;
  
  return {
    unitPurchasePrice,
    unitSellingPrice,
    unitMargin
  };
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