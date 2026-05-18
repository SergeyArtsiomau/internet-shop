import type { Metadata } from "next";
import { CatalogScreen } from "@/components/catalog/catalog-screen";
import { SHOP_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Каталог — ${SHOP_NAME}`,
  description: "Список товаров с фильтрами, сортировкой и пагинацией Otus REST.",
};

export default function Home() {
  return <CatalogScreen />;
}
