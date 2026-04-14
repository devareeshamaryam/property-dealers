import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "All Services | PropertyDealer.pk",
  description:
    "Pakistan's #1 property portal. Check today's cement rate, materials prices, buy or rent properties, book hotels, and more.",
  keywords: [
    "property dealer pakistan",
    "cement rate today",
    "materials price pakistan",
    "buy property pakistan",
    "hotels pakistan",
  ],
};

const categories = [
  {
    title: "Construction Materials",
    items: [
      {
        icon: "🏗",
        label: "Cement rate today",
        desc: "Lucky, Bestway, Maple Leaf & more",
        href: "/today-cement-rate-in-pakistan",
        bg: "#EAF3DE",
      },
      {
        icon: "🧱",
        label: "Materials price",
        desc: "Bricks, sand, gravel & aggregate",
        href: "/materials-price-in-pakistan",
        bg: "#FAEEDA",
      },
      {
        icon: "⚙️",
        label: "Cement brands",
        desc: "Compare all cement brands",
        href: "/cement-page",
        bg: "#FAECE7",
      },
    ],
  },
  {
    title: "Properties",
    items: [
      {
        icon: "🏠",
        label: "Buy / rent property",
        desc: "All listings across Pakistan",
        href: "/properties",
        bg: "#E6F1FB",
      },
      {
        icon: "📋",
        label: "Listing detail",
        desc: "View full property details",
        href: "/listing-detail",
        bg: "#EEEDFE",
      },
      {
        icon: "🏨",
        label: "Hotels",
        desc: "Book hotels in Pakistan",
        href: "/hotels",
        bg: "#E1F5EE",
      },
    ],
  },
  {
    title: "Info & More",
    items: [
      {
        icon: "📰",
        label: "Blog",
        desc: "Property news & tips",
        href: "/blog",
        bg: "#F1EFE8",
      },
      {
        icon: "ℹ️",
        label: "About us",
        desc: "Our story & team",
        href: "/about",
        bg: "#FBEAF0",
      },
    ],
  },
];

export default function AllServicesPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="rounded-xl bg-blue-50 p-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-blue-900 mb-1">
            Pakistan&apos;s #1 Property Portal
          </h1>
          <p className="text-sm text-blue-700">
            Prices · Properties · Hotels · Blogs
          </p>
        </div>
        <span className="text-4xl font-semibold text-blue-600">8+</span>
      </section>

      {/* Category Sections */}
      {categories.map((cat) => (
        <section key={cat.title} className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            {cat.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {cat.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
                  style={{ background: item.bg }}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium text-gray-900 leading-snug">
                  {item.label}
                </span>
                <span className="text-xs text-gray-500 leading-snug">
                  {item.desc}
                </span>
                <span className="text-xs text-gray-400 mt-auto group-hover:text-gray-600 transition-colors">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}