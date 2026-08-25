import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Recurrence = "none" | "daily" | "weekly" | "monthly";
export type TaskCategory = "General" | "Finanzas" | "Proyectos" | "Hobbies";

export type Task = {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  time: string;
  category: TaskCategory;
  recurrence: Recurrence;
  done: boolean;
};

export type Movement = {
  id: string;
  concept: string;
  amount: number;
  kind: "ingreso" | "gasto" | "ahorro";
  date: string;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  step: number;
  filled: number; // number of ticked boxes
};

export type ProjectNote = { id: string; text: string; done: boolean };
export type Project = {
  id: string;
  title: string;
  status: "Idea" | "En progreso" | "Pausado" | "Hecho";
  summary: string;
  notes: ProjectNote[];
  updatedAt: string;
};

export type Hobby = {
  id: string;
  name: string;
  goalPerWeek: number;
  sessionsThisWeek: number;
};

export type AppData = {
  tasks: Task[];
  movements: Movement[];
  goals: Goal[];
  projects: Project[];
  hobbies: Hobby[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const today = new Date();
const t = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return toKey(d);
};

const seed: AppData = {
  tasks: [
    { id: uid(), title: "Enviar presupuesto cliente v2", date: t(0), time: "09:00", category: "Finanzas", recurrence: "none", done: false },
    { id: uid(), title: "Comprar café orgánico", date: t(0), time: "10:00", category: "General", recurrence: "weekly", done: true },
    { id: uid(), title: "Clase de cerámica", date: t(0), time: "18:00", category: "Hobbies", recurrence: "weekly", done: false },
    { id: uid(), title: "Revisar avances del portafolio", date: t(1), time: "11:30", category: "Proyectos", recurrence: "none", done: false },
    { id: uid(), title: "Rutina de fuerza", date: t(2), time: "07:00", category: "Hobbies", recurrence: "daily", done: false },
    { id: uid(), title: "Pagar alquiler", date: t(3), time: "12:00", category: "Finanzas", recurrence: "monthly", done: false },
  ],
  movements: [
    { id: uid(), concept: "Nómina principal", amount: 2850, kind: "ingreso", date: t(-8) },
    { id: uid(), concept: "Proyecto freelance", amount: 1350, kind: "ingreso", date: t(-5) },
    { id: uid(), concept: "Alquiler", amount: 1200, kind: "gasto", date: t(-4) },
    { id: uid(), concept: "Supermercado", amount: 340, kind: "gasto", date: t(-2) },
    { id: uid(), concept: "Suscripciones", amount: 30, kind: "gasto", date: t(-1) },
    { id: uid(), concept: "Traspaso a ahorro", amount: 400, kind: "ahorro", date: t(-1) },
  ],
  goals: [
    { id: uid(), name: "Viaje a Kyoto", target: 5000, step: 250, filled: 6 },
    { id: uid(), name: "Fondo de imprevistos", target: 2000, step: 100, filled: 12 },
  ],
  projects: [
    {
      id: uid(),
      title: "Rediseño de Portafolio",
      status: "En progreso",
      summary: "Nueva identidad, casos de estudio y sección de proceso.",
      notes: [
        { id: uid(), text: "Definir paleta y tipografías", done: true },
        { id: uid(), text: "Escribir tres casos de estudio", done: false },
        { id: uid(), text: "Migrar dominio", done: false },
      ],
      updatedAt: t(0),
    },
    {
      id: uid(),
      title: "App de Recetas Vegetales",
      status: "Idea",
      summary: "Recetario estacional con lista de la compra automática.",
      notes: [{ id: uid(), text: "Investigar competencia", done: false }],
      updatedAt: t(-6),
    },
  ],
  hobbies: [
    { id: uid(), name: "Cerámica", goalPerWeek: 2, sessionsThisWeek: 1 },
    { id: uid(), name: "Lectura", goalPerWeek: 5, sessionsThisWeek: 3 },
    { id: uid(), name: "Senderismo", goalPerWeek: 1, sessionsThisWeek: 0 },
  ],
};

const KEY = "stoa-os-data-v1";

type Ctx = {
  data: AppData;
  ready: boolean;
  addTask: (t: Omit<Task, "id" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  addMovement: (m: Omit<Movement, "id">) => void;
  removeMovement: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "filled">) => void;
  setGoalFilled: (id: string, filled: number) => void;
  removeGoal: (id: string) => void;
  addProject: (p: Pick<Project, "title" | "summary">) => void;
  addNote: (projectId: string, text: string) => void;
  toggleNote: (projectId: string, noteId: string) => void;
  cycleStatus: (projectId: string) => void;
  removeProject: (id: string) => void;
  addHobby: (h: Omit<Hobby, "id" | "sessionsThisWeek">) => void;
  logHobby: (id: string, delta: number) => void;
  removeHobby: (id: string) => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData(JSON.parse(raw) as AppData);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      ready,
      addTask: (task) => update((d) => ({ ...d, tasks: [...d.tasks, { ...task, id: uid(), done: false }] })),
      toggleTask: (id) =>
        update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)) })),
      removeTask: (id) => update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) })),
      addMovement: (m) => update((d) => ({ ...d, movements: [{ ...m, id: uid() }, ...d.movements] })),
      removeMovement: (id) => update((d) => ({ ...d, movements: d.movements.filter((x) => x.id !== id) })),
      addGoal: (g) => update((d) => ({ ...d, goals: [...d.goals, { ...g, id: uid(), filled: 0 }] })),
      setGoalFilled: (id, filled) =>
        update((d) => ({ ...d, goals: d.goals.map((g) => (g.id === id ? { ...g, filled } : g)) })),
      removeGoal: (id) => update((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) })),
      addProject: (p) =>
        update((d) => ({
          ...d,
          projects: [
            { ...p, id: uid(), status: "Idea", notes: [], updatedAt: toKey(new Date()) },
            ...d.projects,
          ],
        })),
      addNote: (projectId, text) =>
        update((d) => ({
          ...d,
          projects: d.projects.map((p) =>
            p.id === projectId
              ? { ...p, notes: [...p.notes, { id: uid(), text, done: false }], updatedAt: toKey(new Date()) }
              : p,
          ),
        })),
      toggleNote: (projectId, noteId) =>
        update((d) => ({
          ...d,
          projects: d.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  notes: p.notes.map((n) => (n.id === noteId ? { ...n, done: !n.done } : n)),
                  updatedAt: toKey(new Date()),
                }
              : p,
          ),
        })),
      cycleStatus: (projectId) =>
        update((d) => {
          const order: Project["status"][] = ["Idea", "En progreso", "Pausado", "Hecho"];
          return {
            ...d,
            projects: d.projects.map((p) =>
              p.id === projectId
                ? { ...p, status: order[(order.indexOf(p.status) + 1) % order.length]! }
                : p,
            ),
          };
        }),
      removeProject: (id) => update((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) })),
      addHobby: (h) => update((d) => ({ ...d, hobbies: [...d.hobbies, { ...h, id: uid(), sessionsThisWeek: 0 }] })),
      logHobby: (id, delta) =>
        update((d) => ({
          ...d,
          hobbies: d.hobbies.map((h) =>
            h.id === id ? { ...h, sessionsThisWeek: Math.max(0, h.sessionsThisWeek + delta) } : h,
          ),
        })),
      removeHobby: (id) => update((d) => ({ ...d, hobbies: d.hobbies.filter((h) => h.id !== id) })),
    }),
    [data, ready, update],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}

export const eur = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
