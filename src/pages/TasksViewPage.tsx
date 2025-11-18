import { Card, PageHeader, Select } from "@/components";
import { fetchTasks } from "@/data/crm";

export default async function TasksViewPage() {
  const tasks = await fetchTasks();

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Single-user task log for CRM workflows."
        actions={[{ label: "New Task" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card
        title="Filters"
        description="Configure query placeholders until API wiring is ready."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Select defaultValue="all">
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </Select>
          <Select defaultValue="owner">
            <option value="owner">Owner: Jess</option>
            <option value="owner2">Owner: Tom</option>
          </Select>
        </div>
      </Card>
      <Card title="Task List">
        {tasks.length ? (
          <div className="divide-y divide-white/5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-4 py-4 text-sm text-slate-200 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex-1">
                  <p className="font-semibold text-white">{task.title}</p>
                  <p className="text-xs text-slate-400">
                    Due {task.dueDate} · Owner {task.owner}
                    {task.relatedTo && ` · Related: ${task.relatedTo}`}
                  </p>
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/70 md:text-right">
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm uppercase tracking-[0.2em] text-white/40">
            No tasks queued
          </p>
        )}
      </Card>
    </section>
  );
}
