import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartCustomizations = {
  size?: "Regular" | "Large" | "Family";
  protein?: string;
  spice?: "Mild" | "Medium" | "Hot" | "Extra Hot";
  side?: string;
  notes?: string;
};

export type CartItem = {
  key: string;
  menu_item_id: string;
  name: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  customizations: CartCustomizations;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  updateQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "elizade_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = (item: CartItem) =>
    setItems((cur) => {
      const idx = cur.findIndex((i) => i.key === item.key);
      if (idx >= 0) {
        const next = [...cur];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...cur, item];
    });

  const updateQty = (key: string, qty: number) =>
    setItems((cur) => (qty <= 0 ? cur.filter((i) => i.key !== key) : cur.map((i) => (i.key === key ? { ...i, quantity: qty } : i))));

  const remove = (key: string) => setItems((cur) => cur.filter((i) => i.key !== key));
  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, updateQty, remove, clear, subtotal, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
