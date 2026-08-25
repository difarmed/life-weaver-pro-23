import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { eur, toKey, useStore, type Movement } from "@/lib/store";

export const Route = createFileRoute("/finanzas")({
  head: () => ({
    meta: [
      { title: "Finanzas: gastos, ingresos y metas | Stoa OS" },
      {
        name: "description",
        content:
          "Administra ingresos, gastos y ahorros, y tacha casillas de tus metas a medida que destinas dinero a cada una.",
      },
      { property: "og:title", content: "Finanzas: gastos, ingresos y metas | Stoa OS" },
      {
        property: "og:description",
        content: "Balance mensual, movimientos y metas de ahorro con seguimiento por casillas.",
      },
    ],
  }),
  component: FinanzasPage,
});

function FinanzasPage() {
  const { data, addMovement, removeMovement, addGoal, setGoalFilled, removeGoal } = useStore();

  const sum = (kind: Movement["kind"]) =>
    data.movements.filter((m) => m.kind === kind).reduce((a, m) => a + m.amount, 0);
  const ingresos = sum("ingreso");
  const gastos = sum("gasto");
  const ahorros = sum("ahorro");

  return (
    <AppShell>
      <PageHeader title="Finanzas" subtitle="Ingresos, gastos, ahorro y metas" />

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Ingresos" value={eur(ingresos)} tone="positive" />
            <SummaryCard label="Gastos" value={eur(gastos)} tone="negative" />
            <SummaryCard label="Ahorrado" value={eur(ahorros)} tone="neutral" />
          </div>

          <NewMovementForm onSubmit={addMovement} />

          <div>
            <h2 className="mb-6 text-xl font-medium">Movimientos</h2>
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              {data.movements.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">Sin movimientos todavía.</p>
              )}
              {data.movements.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-center justify-between border-b border-border px-6 py-4 last:border-b-0"
                >
                  <div>
                    <p className="font-medium">{m.concept}</p>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {m.kind} · {m.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`font-medium ${
                        m.kind === "gasto" ? "text-destructive" : "text-primary"
                      }`}
                    >
                      {m.kind === "gasto" ? "−" : "+"}
                      {eur(m.amount)}
                    </span>
                    <button
                      onClick={() => removeMovement(m.id)}
                      className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <div className="rounded-3xl bg-primary p-8 text-primary-foreground">
            <h2 className="mb-6 text-xs uppercase tracking-widest opacity-60">Resumen</h2>
            <div className="space-y-4">
              <Row label="Ingresos" value={`+${eur(ingresos)}`} />
              <Row label="Gastos" value={`−${eur(gastos)}`} />
              <div className="my-2 h-px bg-primary-foreground/20" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Saldo neto</span>
                <span className="font-serif text-xl">{eur(ingresos - gastos)}</span>
              </div>
            </div>
          </div>

          {data.goals.map((goal) => {
            const boxes = Math.max(1, Math.ceil(goal.target / goal.step));
            const saved = goal.filled * goal.step;
            return (
              <div key={goal.id} className="rounded-3xl border border-border bg-card p-8 shadow-soft">
                <div className="mb-4 flex items-end justify-between gap-2">
                  <p className="font-serif text-2xl">{goal.name}</p>
                  <p className="whitespace-nowrap text-sm font-bold text-primary">
                    {eur(saved)} / {eur(goal.target)}
                  </p>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: boxes }, (_, i) => (
                    <button
                      key={i}
                      aria-label={`Casilla ${i + 1}`}
                      onClick={() => setGoalFilled(goal.id, i + 1 === goal.filled ? i : i + 1)}
                      className={`aspect-square rounded-sm transition-colors ${
                        i < goal.filled ? "bg-primary" : "bg-primary/20 hover:bg-primary/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[10px] italic text-muted-foreground">
                    Cada casilla representa {eur(goal.step)}
                  </p>
                  <button
                    onClick={() => removeGoal(goal.id)}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}

          <NewGoalForm onSubmit={addGoal} />
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm opacity-80">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-2 font-serif text-3xl ${
          tone === "negative" ? "text-destructive" : tone === "positive" ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function NewMovementForm({ onSubmit }: { onSubmit: (m: Omit<Movement, "id">) => void }) {
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<Movement["kind"]>("gasto");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = Number(amount);
        if (!concept.trim() || !value) return;
        onSubmit({ concept: concept.trim(), amount: value, kind, date: toKey(new Date()) });
        setConcept("");
        setAmount("");
      }}
      className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft md:grid-cols-[2fr_1fr_1fr_auto]"
    >
      <input
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        placeholder="Concepto"
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        min="0"
        step="0.01"
        placeholder="Importe"
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as Movement["kind"])}
        className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value="gasto">Gasto</option>
        <option value="ingreso">Ingreso</option>
        <option value="ahorro">Ahorro</option>
      </select>
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary"
      >
        Registrar
      </button>
    </form>
  );
}

function NewGoalForm({ onSubmit }: { onSubmit: (g: { name: string; target: number; step: number }) => void }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [step, setStep] = useState("100");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const tgt = Number(target);
        const stp = Number(step);
        if (!name.trim() || !tgt || !stp) return;
        onSubmit({ name: name.trim(), target: tgt, step: stp });
        setName("");
        setTarget("");
      }}
      className="space-y-3 rounded-3xl border border-secondary bg-secondary/30 p-6"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nueva meta</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la meta"
        className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          type="number"
          min="0"
          placeholder="Objetivo €"
          className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={step}
          onChange={(e) => setStep(e.target.value)}
          type="number"
          min="1"
          placeholder="€ por casilla"
          className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        className="cursor-pointer rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary"
      >
        Crear meta
      </button>
    </form>
  );
}
