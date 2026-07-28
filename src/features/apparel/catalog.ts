export type ApparelCategory = "All" | "Tops" | "Bottoms" | "Footwear";

export interface ApparelProduct {
    id: string;
    name: string;
    category: Exclude<ApparelCategory, "All">;
    color: string;
    price: string;
    image: string;
    description: string;
    material: string;
    fit: string;
    care: string;
    badge?: string;
}

export const apparelCategories: ApparelCategory[] = ["All", "Tops", "Bottoms", "Footwear"];

export const apparelProducts: ApparelProduct[] = [
    {
        id: "heavyweight-tee",
        name: "Heavyweight tee",
        category: "Tops",
        color: "Natural",
        price: "$48",
        image: "/img/apparel/tee.jpg",
        description: "A substantial everyday tee with a clean neckline and an easy, structured drape.",
        material: "100% heavyweight cotton",
        fit: "Relaxed, true to size",
        care: "Cold wash, line dry",
        badge: "New",
    },
    {
        id: "work-overshirt",
        name: "Work overshirt",
        category: "Tops",
        color: "Washed charcoal",
        price: "$118",
        image: "/img/apparel/overshirt.jpg",
        description: "A soft, washed overshirt cut for layering through changing weather.",
        material: "Midweight cotton twill",
        fit: "Relaxed layering fit",
        care: "Cold wash, line dry",
    },
    {
        id: "textured-knit",
        name: "Textured knit",
        category: "Tops",
        color: "Rust",
        price: "$96",
        image: "/img/apparel/knit.jpg",
        description: "A warm textured crew with a compact knit and a softly structured silhouette.",
        material: "Cotton and merino blend",
        fit: "Regular fit",
        care: "Hand wash cold",
        badge: "Limited",
    },
    {
        id: "relaxed-trouser",
        name: "Relaxed trouser",
        category: "Bottoms",
        color: "Midnight",
        price: "$88",
        image: "/img/apparel/trousers.jpg",
        description: "Easy straight-leg trousers with room through the seat and a clean front.",
        material: "Cotton stretch twill",
        fit: "Relaxed straight leg",
        care: "Cold wash, hang dry",
    },
    {
        id: "canvas-low",
        name: "Canvas low",
        category: "Footwear",
        color: "Warm white",
        price: "$72",
        image: "/img/apparel/sneakers.jpg",
        description: "A pared-back canvas sneaker with a cushioned footbed for everyday wear.",
        material: "Cotton canvas and rubber",
        fit: "True to size",
        care: "Spot clean",
    },
    {
        id: "utility-jacket",
        name: "Utility jacket",
        category: "Tops",
        color: "Olive",
        price: "$148",
        image: "/img/apparel/jacket.jpg",
        description: "A four-pocket field jacket with a washed finish and dependable transitional weight.",
        material: "Washed cotton canvas",
        fit: "Relaxed outer layer",
        care: "Cold wash, line dry",
        badge: "Bestseller",
    },
];
