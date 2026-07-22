import sushi from "@/assets/dish-sushi.jpg";
import pizza from "@/assets/dish-pizza.jpg";
import bowl from "@/assets/dish-bowl.jpg";
import ramen from "@/assets/dish-ramen.jpg";
import dessert from "@/assets/dish-dessert.jpg";
import tacos from "@/assets/dish-tacos.jpg";
import hero from "@/assets/hero-midnight.jpg";

// Map dish names/slugs to available imagery until real photos are uploaded.
const MAP: Record<string, string> = {
  Akara: tacos,
  "Moi Moi": bowl,
  Suya: pizza,
  "Jollof Rice": hero,
  "Egusi Soup": ramen,
  "Pounded Yam & Efo Riro": bowl,
  "Pepper Soup (Catfish)": ramen,
  "Waist Beads Chicken": pizza,
  Eba: bowl,
  Fufu: bowl,
  "Fried Plantain": tacos,
  Zobo: dessert,
  Chapman: dessert,
  Kunu: dessert,
  "Puff Puff": dessert,
  "Chin Chin": sushi,
};

export function dishImage(name: string, fallback: string | null = null) {
  return MAP[name] ?? fallback ?? hero;
}
