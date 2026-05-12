import type { Metadata } from "next";
import { CatalogScreen } from "@/components/catalog/catalog-screen";

export const metadata: Metadata = {
  title: "Каталог — Бакалея Побережья",
  description: "Список товаров с фильтрами, сортировкой и пагинацией Otus REST.",
};

export default function Home() {
  return <CatalogScreen />;
}
