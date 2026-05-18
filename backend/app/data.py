"""In-memory data store for the KGF Farming clone."""

# Peasant Natural Farming catalogue — product line for Kamauput Growth Farming
PRODUCTS = [
    {
        "id": 1,
        "name": "Bhumi Care",
        "category": "SOIL CARE",
        "price": 550,
        "original_price": 550,
        "discount": 0,
        "image": "/products/bhumi-care.png",
        "description": (
            "Nutrition for plant & soil — powerful organic soil booster (1000 ml). "
            "Organic manure that improves soil fertility, enhances root development, "
            "increases nutrient absorption, and improves crop yield & quality. "
            "Dosage: 2–3 ml per litre of water. Suitable for all crops."
        ),
    },
    {
        "id": 2,
        "name": "Spread-10X",
        "category": "SPRAY ADJUVANT",
        "price": 420,
        "original_price": 420,
        "discount": 0,
        "image": "/products/spread-10x.png",
        "description": (
            "Non-ionic silicon based wetting agent — makes your spray more effective. "
            "Helps pesticides spread evenly, improves coverage and sticking power. "
            "Compatible with insecticides, fungicides and nutrients. "
            "Dosage: 3–5 ml per litre of water."
        ),
    },
    {
        "id": 3,
        "name": "PNF Root Grow",
        "category": "GROWTH BOOSTER",
        "price": 680,
        "original_price": 680,
        "discount": 0,
        "image": "/products/root-grow.png",
        "description": (
            "Advanced root development nutrients (1 kg). Rapid root growth, strong & deep roots, "
            "improved plant growth, better nutrient absorption, and increased yield."
        ),
    },
    {
        "id": 4,
        "name": "Peasant Power",
        "category": "GROWTH BOOSTER",
        "price": 320,
        "original_price": 320,
        "discount": 0,
        "image": "/products/peasant-power.png",
        "description": (
            "Crop performance enhancer powder (250 g). Boosts crop vigor, enhances nutrient uptake, "
            "improves stress tolerance — visible effect in 3–5 days."
        ),
    },
    {
        "id": 5,
        "name": "Bhumi Raja",
        "category": "FUNGICIDE",
        "price": 480,
        "original_price": 480,
        "discount": 0,
        "image": "/products/bhumi-raja.png",
        "description": (
            "Powerful bio-fungicide (500 ml) — protect your crops from fungal diseases. "
            "Controls root & leaf diseases, strengthens roots, improves soil health, "
            "boosts growth and yield. 100% organic & safe."
        ),
    },
    {
        "id": 6,
        "name": "Crop Care",
        "category": "INSECTICIDE",
        "price": 450,
        "original_price": 450,
        "discount": 0,
        "image": "/products/crop-care.png",
        "description": (
            "Organic bio-insecticide — protect crops from harmful insects. "
            "Controls caterpillars (sundi), leaf-eating insects, army worm and leaf-damaging pests. "
            "Safe for crops and environment. Dosage: 2–3 ml per litre of water. "
            "Suitable for cotton, vegetables, pulses, fruits and cereals."
        ),
    },
    {
        "id": 7,
        "name": "Crop Care-T",
        "category": "INSECTICIDE",
        "price": 450,
        "original_price": 450,
        "discount": 0,
        "image": "/products/crop-care-t.png",
        "description": (
            "Organic bio-insecticide — 100% organic and natural. Effective on all crop types. "
            "Protects from thrips, jassids, aphids and other pests. Improves crop growth and yield."
        ),
    },
    {
        "id": 8,
        "name": "Grow Up-7",
        "category": "GROWTH BOOSTER",
        "price": 520,
        "original_price": 520,
        "discount": 0,
        "image": "/products/grow-up-7.png",
        "description": (
            "Complete plant nutrition with humic & amino acids. Grows strong roots, "
            "boosts plant growth, improves yield & health. Contains N, P, K, Ca, Mg, S, Fe, Zn and B. "
            "Organic & environmentally friendly."
        ),
    },
]

CATEGORIES = ["GROWTH BOOSTER", "INSECTICIDE", "SOIL CARE", "FUNGICIDE", "SPRAY ADJUVANT"]

SERVICES = [
    {
        "id": 1,
        "number": "01",
        "title": "Organic Farming",
        "subtitle": "KGF Farming",
        "description": "Kamauput Growth Farming Pvt Ltd. provides end-to-end organic farming solutions to boost yield while caring for the soil.",
        "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    },
    {
        "id": 2,
        "number": "02",
        "title": "Vermicomposting",
        "subtitle": "KGF Farming",
        "description": "Producing high quality vermi-compost with controlled earthworm farming to enrich soil naturally.",
        "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    },
    {
        "id": 3,
        "number": "03",
        "title": "Crop Protection",
        "subtitle": "KGF Farming",
        "description": "Eco-friendly insecticides and growth boosters to keep your crops safe and thriving.",
        "image": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
    },
]

FAQS = [
    {
        "id": 1,
        "question": "Company Provides a Full Range of Services?",
        "answer": "Vermicomposting is the process by which worms are used to convert organic materials (usually wastes) into a humus-like material known as vermin-compost.",
    },
    {
        "id": 2,
        "question": "What is Vermicomposting Process?",
        "answer": "Vermicomposting is the process by which worms are used to convert organic materials (usually wastes) into a humus-like material known as vermin-compost.",
    },
    {
        "id": 3,
        "question": "What is Vermicomposting Benefits?",
        "answer": "Vermicomposting increases the fertility and water-resistance of the soil. Helps in germination, plant growth, and crop yield. Nurtures soil with plant growth hormones such as auxins, gibberellic acid, etc.",
    },
]

TESTIMONIALS = [
    {
        "id": 1,
        "name": "Ramesh Kumar",
        "role": "Kamauput Agro - Farming",
        "message": "Vermicomposting is the process by which worms are used to convert organic materials (usually wastes) into a humus-like material known as vermin-compost.",
        "avatar": "https://i.pravatar.cc/100?img=12",
    },
    {
        "id": 2,
        "name": "Suresh Yadav",
        "role": "Kamauput Agro - Farming",
        "message": "Vermicomposting is the process by which worms are used to convert organic materials (usually wastes) into a humus-like material known as vermin-compost.",
        "avatar": "https://i.pravatar.cc/100?img=22",
    },
    {
        "id": 3,
        "name": "Mahesh Singh",
        "role": "Kamauput Agro - Farming",
        "message": "Vermicomposting is the process by which worms are used to convert organic materials (usually wastes) into a humus-like material known as vermin-compost.",
        "avatar": "https://i.pravatar.cc/100?img=33",
    },
]

PROJECTS = [
    {
        "id": 1,
        "title": "Organic Solutions",
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
    },
    {
        "id": 2,
        "title": "Jaivik Khad Innovations",
        "image": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&q=80",
    },
    {
        "id": 3,
        "title": "Earthworms",
        "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    },
    {
        "id": 4,
        "title": "The Farming Season",
        "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    },
]

ACHIEVERS = [
    {"id": 1, "name": "Rajesh Sharma", "title": "Top Distributor", "location": "Haryana", "avatar": "https://i.pravatar.cc/200?img=51"},
    {"id": 2, "name": "Priya Verma", "title": "Star Achiever", "location": "Punjab", "avatar": "https://i.pravatar.cc/200?img=47"},
    {"id": 3, "name": "Amit Gupta", "title": "Diamond Member", "location": "Delhi", "avatar": "https://i.pravatar.cc/200?img=15"},
    {"id": 4, "name": "Sunita Kaur", "title": "Gold Achiever", "location": "Chandigarh", "avatar": "https://i.pravatar.cc/200?img=45"},
    {"id": 5, "name": "Vikram Singh", "title": "Platinum Leader", "location": "Rajasthan", "avatar": "https://i.pravatar.cc/200?img=68"},
    {"id": 6, "name": "Neha Patel", "title": "Top Performer", "location": "Gujarat", "avatar": "https://i.pravatar.cc/200?img=32"},
]

BLOG_POSTS = [
    {
        "id": 1,
        "title": "Why Vermicompost Is the Future of Organic Farming",
        "excerpt": "Vermicompost enriches soil, retains moisture, and provides plants with essential nutrients in a natural way.",
        "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
        "date": "2026-03-12",
        "author": "KGF Team",
    },
    {
        "id": 2,
        "title": "Eco-friendly Insecticides for Modern Farms",
        "excerpt": "Discover how eco-friendly insecticides protect crops without harming beneficial microorganisms.",
        "image": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80",
        "date": "2026-02-18",
        "author": "KGF Team",
    },
    {
        "id": 3,
        "title": "Boosting Yield With Jaivik Khad",
        "excerpt": "Jaivik Khad, or organic fertilizer, builds healthier and more resilient ecosystems.",
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
        "date": "2026-01-25",
        "author": "KGF Team",
    },
]

COMPANY = {
    "name": "KGF Farming",
    "full_name": "Kamauput Growth Farming Pvt Ltd.",
    "email": "info@kgffarming.com",
    "phone": "+91 93552 40503",
    "address": "1133/3, Sheetal Puri Colony, Apollo Road, Jind 126102 — Near Madhur Milan Hotel, Gali No. 03",
    "tagline": "Agriculture & Pure Eco Farming",
    "year": 2026,
}
