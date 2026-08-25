import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useStore, type Project } from "@/lib/store";

export const Route = createFileRoute("/proyectos")({
  head: () => ({
    meta: [
      { title: "Libreta de proyectos | Stoa OS" },
      {
        name: "description",
        content:
          "Una libreta donde apuntar tus proyectos, escribir notas y hacer seguimiento del progreso paso a paso.",
      },
      { property: "og:title", content: "Libreta de proyectos | Stoa OS" },
      {
        property: "og:description",
        content: "Apunta ideas, notas y avances de cada proyecto personal.",
      },
    ],
  }),
  component: ProyectosPage,
});

function ProyectosPage() {
  const { data, addProject, addNote, toggleNote, cycleStatus, removeProject } = useStore();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");

  return (
    <AppShell>
      <PageHeader title="Cuaderno de proyectos" subtitle="Apunta, anota y sigue el progreso" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          addProject({ title: title.trim(), summary: summary.trim() });
          setTitle("");
          setSummary("");
        }}
        className="mb-10 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:grid-cols-[1fr_2fr_auto]"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nombre del proyecto"
          className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="¿De qué trata?"
          className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary"
        >
          Abrir página
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.projects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            dark={i % 2 === 0}
            onAddNote={(text) => addNote(project.id, text)}
            onToggleNote={(noteId) => toggleNote(project.id, noteId)}
            onCycle={() => cycleStatus(project.id)}
            onRemove={() => removeProject(project.id)}
          />
        ))}
      </div>
    </AppShell>
  );
}

function ProjectCard({
  project,
  dark,
  onAddNote,
  onToggleNote,
  onCycle,
  onRemove,
}: {
  project: Project;
  dark: boolean;
  onAddNote: (text: string) => void;
  onToggleNote: (id: string) => void;
  onCycle: () => void;
  onRemove: () => void;
}) {
  const [note, setNote] = useState("");
  const done = project.notes.filter((n) => n.done).length;

  return (
    <article
      className={`flex flex-col rounded-3xl p-6 ${
        dark ? "bg-foreground text-background" : "border border-secondary bg-secondary"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-serif text-2xl">{project.title}</h2>
        <button
          onClick={onCycle}
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
            dark ? "bg-background/20" : "bg-foreground/10"
          }`}
        >
          {project.status}
        </button>
      </div>
      {project.summary && (
        <p className={`mt-2 text-sm ${dark ? "opacity-70" : "text-muted-foreground"}`}>{project.summary}</p>
      )}

      <ul className="mt-6 space-y-2">
        {project.notes.map((n) => (
          <li key={n.id}>
            <button
              onClick={() => onToggleNote(n.id)}
              className="flex w-full items-center gap-3 text-left text-sm"
            >
              <span
                className={`flex size-4 shrink-0 items-center justify-center rounded-sm border text-[9px] ${
                  n.done
                    ? dark
                      ? "border-background bg-background/30"
                      : "border-primary bg-primary/20 text-primary"
                    : dark
                      ? "border-background/40"
                      : "border-foreground/30"
                }`}
              >
                {n.done ? "✓" : ""}
              </span>
              <span className={n.done ? "line-through opacity-50" : ""}>{n.text}</span>
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          onAddNote(note.trim());
          setNote("");
        }}
        className="mt-4"
      >
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Añadir nota o siguiente paso…"
          className={`w-full rounded-xl px-4 py-2.5 text-sm outline-none ${
            dark
              ? "border border-background/20 bg-background/10 placeholder:text-background/40"
              : "border border-input bg-card focus:border-primary"
          }`}
        />
      </form>

      <div className="mt-6 flex items-center justify-between text-xs">
        <span className={dark ? "opacity-50" : "text-muted-foreground"}>
          {done}/{project.notes.length} pasos · actualizado {project.updatedAt}
        </span>
        <button onClick={onRemove} className={dark ? "opacity-50 hover:opacity-100" : "text-muted-foreground hover:text-destructive"}>
          Eliminar
        </button>
      </div>
    </article>
  );
}
