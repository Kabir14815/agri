"""In-memory data store for the KGF Farming clone."""

PRODUCTS = [
    {
        "id": 1,
        "name": "BRONO - L",
        "category": "INSECTICIDE",
        "price": 199,
        "original_price": 1800,
        "discount": 89,
        "image": "https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=600&q=80",
        "description": "High-grade liquid insecticide for crop protection.",
    },
    {
        "id": 2,
        "name": "BHUMI SHAKTI",
        "category": "GROWTH BOOSTER",
        "price": 640,
        "original_price": 1380,
        "discount": 54,
        "image": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80",
        "description": "Soil revitalising growth booster enriched with organic minerals.",
    },
    {
        "id": 3,
        "name": "BRONO T",
        "category": "INSECTICIDE",
        "price": 1648,
        "original_price": 2060,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
        "description": "Targeted insecticide for tough crop pests.",
    },
    {
        "id": 4,
        "name": "BRONO - L",
        "category": "INSECTICIDE",
        "price": 1500,
        "original_price": 1875,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1592982537447-7440770faae9?w=600&q=80",
        "description": "Premium variant of BRONO-L for large fields.",
    },
    {
        "id": 5,
        "name": "VIRYGO",
        "category": "GROWTH BOOSTER",
        "price": 1104,
        "original_price": 1380,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80",
        "description": "All-natural plant growth accelerator.",
    },
    {
        "id": 6,
        "name": "SUPER SHILI",
        "category": "INSECTICIDE",
        "price": 228,
        "original_price": 285,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80",
        "description": "Economical insecticide for small farms and gardens.",
    },
    {
        "id": 7,
        "name": "SUPER SPRIDER",
        "category": "INSECTICIDE",
        "price": 228,
        "original_price": 285,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
        "description": "Effective against spider mites and tiny insects.",
    },
    {
        "id": 8,
        "name": "BHUMI SHAKTI",
        "category": "GROWTH BOOSTER",
        "price": 1104,
        "original_price": 1380,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=600&q=80",
        "description": "Boost soil energy and plant health.",
    },
    {
        "id": 9,
        "name": "CROP GROW-30",
        "category": "GROWTH BOOSTER",
        "price": 1288,
        "original_price": 1610,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80",
        "description": "Premium 30-day crop growth formula.",
    },
    {
        "id": 10,
        "name": "VERMI COMPOST",
        "category": "VERMI COMPOST",
        "price": 40,
        "original_price": 70,
        "discount": 43,
        "image": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
        "description": "Pure earthworm compost for richer soil.",
    },
    {
        "id": 11,
        "name": "VERMI COMPOST",
        "category": "VERMI COMPOST",
        "price": 480,
        "original_price": 600,
        "discount": 20,
        "image": "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&q=80",
        "description": "Bulk vermi-compost pack for medium farms.",
    },
    {
        "id": 12,
        "name": "Baghvani",
        "category": "AGRICULTURE",
        "price": 300000,
        "original_price": 300000,
        "discount": 0,
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
        "description": "Complete orchard / Baghvani farming package.",
    },
]

CATEGORIES = ["AGRICULTURE", "VERMI COMPOST", "INSECTICIDE", "GROWTH BOOSTER"]

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
    "phone": "+91 11 6931 2730",
    "address": "NEW KRISHNA COLONY GALI NO 4 JIND HARYANA 126102",
    "tagline": "Agriculture & Pure Eco Farming",
    "year": 2026,
}
