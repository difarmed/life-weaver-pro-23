import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  startOfWeek,
  toKey,
  useStore,
  type Recurrence,
  type TaskCategory,
  type Task,
} from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agenda semanal y diaria | Stoa OS" },
      {
        name: "description",
        content:
          "Organiza tu semana y tu día con tareas puntuales o recurrentes, y controla finanzas, proyectos y hobbies desde un mismo lugar.",
      },
      { property: "og:title", content: "Agenda semanal y diaria | Stoa OS" },
      {
        property: "og:description",
        content: "Vista semanal y diaria con tareas pendientes, recurrentes y seguimiento personal.",
      },
    ],
  }),
  component: AgendaPage,
});

const DAYS = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
const CATEGORIES: TaskCategory[] = ["General", "Finanzas", "Proyectos", "Hobbies"];
const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: "none", label: "Sin repetición" },
  { value: "daily", label: "Cada día" },
  { value: "weekly", label: "Cada semana" },
  { value: "monthly", label: "Cada mes" },
];

function matchesDay(task: Task, dayKey: string) {
  if (task.date === dayKey) return true;
  if (task.recurrence === "none") return false;
  const base = new Date(`${task.date}T00:00:00`);
  const day = new Date(`${dayKey}T00:00:00`);
  if (day < base) return false;
  if (task.recurrence === "daily") return true;
  if (task.recurrence === "weekly") return base.getDay() === day.getDay();
  return base.getDate() === day.getDate();
}

function AgendaPage() {
  const { data, addTask, toggleTask, removeTask } = useStore();
  const today = new Date();
  const [selected, setSelected] = useState(toKey(today));
  const [open, setOpen] = useState(false);

  const week = useMemo(() => {
    const start = startOfWeek(new Date(`${selected}T00:00:00`));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [selected]);

  const dayTasks = data.tasks
    .filter((t) => matchesDay(t, selected))
    .sort((a, b) => a.time.localeCompare(b.time));
  const pending = dayTasks.filter((t) => !t.done);

  const longDate = new Date(`${selected}T00:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <AppShell>
      <PageHeader
        title="Buen día"
        subtitle={`${selected === toKey(today) ? "Hoy es" : ""} ${longDate}`}
        action={
          <button
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-primary"
          >
            {open ? "Cerrar" : "+ Nueva tarea"}
          </button>
        }
      />

      {open && (
        <NewTaskForm
          date={selected}
          onSubmit={(task) => {
            addTask(task);
            setOpen(false);
          }}
        />
      )}

      <section className="mb-12">
        <div className="grid grid-cols-7 gap-2 lg:gap-4">
          {week.map((d, i) => {
            const key = toKey(d);
            const isSelected = key === selected;
            const count = data.tasks.filter((t) => matchesDay(t, key) && !t.done).length;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`rounded-xl border p-3 text-center transition-colors lg:p-4 ${
                  isSelected
                    ? "border-2 border-primary bg-card shadow-soft"
                    : "border-border bg-card/50 hover:border-primary/30"
                }`}
              >
                <span
                  className={`mb-1 block text-xs font-bold ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                >
                  {DAYS[i]}
                </span>
                <span className={`text-lg ${isSelected ? "font-bold" : ""}`}>{d.getDate()}</span>
                <span className="mt-2 block text-[10px] text-muted-foreground">
                  {count > 0 ? `${count} pend.` : "—"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="flex items-center gap-2 text-xl font-medium">
          Tareas pendientes
          <span className="text-sm font-normal text-muted-foreground">({pending.length})</span>
        </h2>

        <div className="space-y-3">
          {dayTasks.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No hay tareas para este día.
            </p>
          )}
          {dayTasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-center rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30"
            >
              <button
                onClick={() => toggleTask(task.id)}
                aria-label="Marcar tarea"
                className={`mr-4 flex size-5 items-center justify-center rounded text-[10px] transition-colors ${
                  task.done
                    ? "border-2 border-primary bg-primary/10 text-primary"
                    : "border border-input hover:border-primary"
                }`}
              >
                {task.done ? "✓" : ""}
              </button>
              <div className={`flex-1 ${task.done ? "opacity-40" : ""}`}>
                <p className={`font-medium ${task.done ? "line-through" : ""}`}>{task.title}</p>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    task.category === "Hobbies" ? "text-[color:var(--hobby)]" : "text-primary"
                  }`}
                >
                  {task.category}
                  {task.recurrence !== "none" && " · Recurrente"}
                </span>
              </div>
              <span className="mr-4 text-sm text-muted-foreground">{task.time}</span>
              <button
                onClick={() => removeTask(task.id)}
                className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function NewTaskForm({
  date,
  onSubmit,
}: {
  date: string;
  onSubmit: (t: { title: string; date: string; time: string; category: TaskCategory; recurrence: Recurrence }) => void;
}) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState<TaskCategory>("General");
  const [recurrence, setRecurrence] = useState<Recurrence>("none");
  const [taskDate, setTaskDate] = useState(date);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title: title.trim(), date: taskDate, time, category, recurrence });
        setTitle("");
      }}
      className="mb-10 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:grid-cols-[2fr_1fr_1fr_1fr_auto]"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué necesitas hacer?"
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="date"
        value={taskDate}
        onChange={(e) => setTaskDate(e.target.value)}
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as TaskCategory)}
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      >
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select
        value={recurrence}
        onChange={(e) => setRecurrence(e.target.value as Recurrence)}
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      >
        {RECURRENCES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:col-span-5 md:justify-self-start"
      >
        Añadir tarea
      </button>
    </form>
  );
}
