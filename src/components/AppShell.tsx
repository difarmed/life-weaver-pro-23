import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useStore, toKey } from "@/lib/store";

const nav = [
  { to: "/", label: "Agenda" },
  { to: "/finanzas", label: "Finanzas" },
  { to: "/proyectos", label: "Proyectos" },
  { to: "/hobbies", label: "Hobbies" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const todayKey = toKey(new Date());
  const next = data.tasks
    .filter((t) => !t.done && t.date >= todayKey)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-10 border-r border-border p-8 lg:flex">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-primary" />
          <span className="text-xl font-semibold tracking-tight">Stoa OS</span>
        </div>

        <nav className="flex flex-col gap-2">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-foreground/5"
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl border border-secondary bg-secondary/30 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Próxima tarea
            </p>
            {next ? (
              <>
                <p className="font-medium">{next.title}</p>
                <p className="text-sm text-muted-foreground">
                  {next.date === todayKey ? "Hoy" : next.date} — {next.time}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nada pendiente. Respira.</p>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-6 py-4 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground"
              activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="p-6 lg:p-12">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="mb-2 font-serif text-4xl">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}
