import jollof from "@/assets/dish-jollof.png";
import egusi from "@/assets/dish-egusi.png";
import suya from "@/assets/dish-suya.png";
import akara from "@/assets/dish-akara.png";
import peppersoup from "@/assets/dish-peppersoup.png";
import dodo from "@/assets/dish-dodo.png";
import puffpuff from "@/assets/dish-puffpuff.png";
import heroBanner from "@/assets/hero-food-banner.png";

const MAP: Record<string, string> = {
  "Akara": akara,
  "Moi Moi": akara,
  "Suya": suya,
  "Jollof Rice": jollof,
  "Egusi Soup": egusi,
  "Pounded Yam & Efo Riro": egusi,
  "Pepper Soup (Catfish)": peppersoup,
  "Waist Beads Chicken": suya,
  "Eba": egusi,
  "Fufu": egusi,
  "Fried Plantain": dodo,
  "Zobo": puffpuff,
  "Chapman": puffpuff,
  "Kunu": puffpuff,
  "Puff Puff": puffpuff,
  "Chin Chin": puffpuff,
};

export function dishImage(name: string, fallback: string | null = null) {
  return MAP[name] ?? fallback ?? jollof;
}

export { heroBanner };
