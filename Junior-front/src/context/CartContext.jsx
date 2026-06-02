import { createContext, useContext, useReducer, useCallback, useRef } from "react";
import { API_URL } from "../api";

// --- ACCIONES ---
const ACTIONS = {
  ADD_ITEM: "ADD_ITEM",
  REMOVE_ITEM: "REMOVE_ITEM",
  UPDATE_QTY: "UPDATE_QTY",
  SET_DISCOUNT: "SET_DISCOUNT",
  CLEAR_CART: "CLEAR_CART",
};

// --- GENERADOR DE ID ÚNICO PARA CADA LÍNEA DEL CARRITO ---
let cartItemCounter = 0;
const generateCartItemId = () => `cart_${Date.now()}_${++cartItemCounter}`;

// --- REDUCER ---
function cartReducer(state, action) {
  switch (action.type) {
    case ACTIONS.ADD_ITEM: {
      const { product, extras = [] } = action.payload;
      const extrasKey = extras
        .map((e) => e._id)
        .sort()
        .join(",");

      // Buscar si ya existe un producto con los mismos extras
      const existingIndex = state.items.findIndex(
        (item) => item.productId === product._id && item.extrasKey === extrasKey
      );

      let newItems;
      if (existingIndex >= 0) {
        // Incrementar cantidad
        newItems = state.items.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        // Agregar como nueva línea
        const extrasTotal = extras.reduce((sum, e) => sum + e.precio, 0);
        const newItem = {
          cartItemId: generateCartItemId(),
          productId: product._id,
          name: product.nombre,
          basePrice: product.precio,
          imagen: product.imagen,
          categoryId: product.categoryId,
          qty: 1,
          selectedExtras: extras.map((e) => ({
            id: e._id,
            name: e.nombre,
            price: e.precio,
          })),
          extrasKey,
          extrasTotal,
          totalPrice: product.precio + extrasTotal,
        };
        newItems = [...state.items, newItem];
      }

      return recalculate({ ...state, items: newItems });
    }

    case ACTIONS.REMOVE_ITEM: {
      const newItems = state.items.filter(
        (item) => item.cartItemId !== action.payload
      );
      return recalculate({ ...state, items: newItems });
    }

    case ACTIONS.UPDATE_QTY: {
      const { cartItemId, delta } = action.payload;
      let newItems = state.items
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0);
      return recalculate({ ...state, items: newItems });
    }

    case ACTIONS.SET_DISCOUNT: {
      return recalculate({ ...state, discount: action.payload });
    }

    case ACTIONS.CLEAR_CART: {
      return { items: [], discount: 0, subtotal: 0, discountAmount: 0, total: 0 };
    }

    default:
      return state;
  }
}

function recalculate(state) {
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.totalPrice * item.qty,
    0
  );
  const discountAmount = (subtotal * state.discount) / 100;
  const total = parseFloat((subtotal - discountAmount).toFixed(2));
  return { ...state, subtotal, discountAmount, total };
}

// --- CONTEXT ---
const CartContext = createContext(null);

const initialState = {
  items: [],
  discount: 0,
  subtotal: 0,
  discountAmount: 0,
  total: 0,
};

export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState);
  
  // Caché de extras por categoryId para evitar re-fetching
  const extrasCache = useRef(new Map());

  const addItem = useCallback((product, extras = []) => {
    dispatch({ type: ACTIONS.ADD_ITEM, payload: { product, extras } });
  }, []);

  const removeItem = useCallback((cartItemId) => {
    dispatch({ type: ACTIONS.REMOVE_ITEM, payload: cartItemId });
  }, []);

  const updateQty = useCallback((cartItemId, delta) => {
    dispatch({ type: ACTIONS.UPDATE_QTY, payload: { cartItemId, delta } });
  }, []);

  const setDiscount = useCallback((discount) => {
    dispatch({ type: ACTIONS.SET_DISCOUNT, payload: discount });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_CART });
  }, []);

  // Obtener extras por categoryId con caché
  const fetchExtras = useCallback(async (categoryId) => {
    if (!categoryId) return [];

    // Revisar caché primero
    if (extrasCache.current.has(categoryId)) {
      return extrasCache.current.get(categoryId);
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/products/${categoryId}/extras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const extras = Array.isArray(data) ? data : [];

      // Guardar en caché
      extrasCache.current.set(categoryId, extras);
      return extras;
    } catch (error) {
      console.error("Error al obtener extras:", error);
      return [];
    }
  }, []);

  // Limpiar caché (útil cuando se modifican extras desde admin)
  const clearExtrasCache = useCallback(() => {
    extrasCache.current.clear();
  }, []);

  // Preparar datos para enviar al backend (formato para POST /api/sales)
  const getOrderPayload = useCallback(() => {
    return cart.items.map((item) => ({
      productoId: item.productId,
      nombre: item.name,
      cantidad: item.qty,
      precio: item.basePrice,
      extras: item.selectedExtras.map((e) => ({
        extraId: e.id,
        nombre: e.name,
        precio: e.price,
      })),
    }));
  }, [cart.items]);

  const value = {
    cart,
    addItem,
    removeItem,
    updateQty,
    setDiscount,
    clearCart,
    fetchExtras,
    clearExtrasCache,
    getOrderPayload,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
