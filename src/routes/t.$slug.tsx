import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { PublicCatalog } from "@/components/public/PublicCatalog";

export const Route = createFileRoute("/t/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Catálogo · ${params.slug}` },
      { name: "description", content: `Catálogo digital de ${params.slug}` },
    ],
  }),
  component: StorePublic,
});

function StorePublic() {
  const { slug } = Route.useParams();
  const store = useApp((s) => s.stores.find((st) => st.slug === slug));
  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-semibold">Tienda no encontrada</h1>
          <p className="text-muted-foreground mt-2">
            No existe una tienda con el enlace <code>/t/{slug}</code>.
          </p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }
  if (!store.active) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Tienda suspendida</h1>
          <p className="text-muted-foreground mt-2">
            Este catálogo no está disponible temporalmente.
          </p>
        </div>
      </div>
    );
  }
  return <PublicCatalog store={store} />;
}
