import jollof from "@/assets/dish-jollof.jpg";
import egusi from "@/assets/dish-egusi.jpg";
import suya from "@/assets/dish-suya.jpg";
import akara from "@/assets/dish-akara.jpg";
import peppersoup from "@/assets/dish-peppersoup.jpg";
import dodo from "@/assets/dish-dodo.jpg";
import puffpuff from "@/assets/dish-puffpuff.jpg";
import poundedyam from "@/assets/dish-poundedyam.jpg";
import moimoi from "@/assets/dish-moimoi.jpg";
import eba from "@/assets/dish-eba.jpg";
import fufu from "@/assets/dish-fufu.jpg";
import zobo from "@/assets/dish-zobo.jpg";
import chapman from "@/assets/dish-chapman.jpg";
import kunu from "@/assets/dish-kunu.jpg";
import chinchin from "@/assets/dish-chinchin.jpg";
import chicken from "@/assets/dish-chicken.jpg";
import heroBanner from "@/assets/hero-food-banner.png";

const MAP: Record<string, string> = {
  "Akara": akara,
  "Moi Moi": moimoi,
  "Suya": suya,
  "Jollof Rice": jollof,
  "Egusi Soup": egusi,
  "Pounded Yam & Efo Riro": poundedyam,
  "Pepper Soup (Catfish)": peppersoup,
  "Waist Beads Chicken": chicken,
  "Eba": eba,
  "Fufu": fufu,
  "Fried Plantain": dodo,
  "Zobo": zobo,
  "Chapman": chapman,
  "Kunu": kunu,
  "Puff Puff": puffpuff,
  "Chin Chin": chinchin,
};

export function dishImage(name: string, fallback: string | null = null) {
  return MAP[name] ?? fallback ?? jollof;
}

export { heroBanner };
