import { Card, PageHeader, Select } from "@/components";
import { TaskSummary } from "@/types/ui";

const tasks: TaskSummary[] = [
  {
    id: "task-1",
    title: "Prep onboarding deck",
    owner: "Jess",
    dueDate: "Nov 14",
    status: "open",
    relatedTo: "Harborwell",
  },
  {
    id: "task-2",
    title: "Send renewal reminder",
    owner: "Tom",
    dueDate: "Nov 16",
    status: "in-progress",
    relatedTo: "Northwind",
  },
  {
    id: "task-3",
    title: "Archive closed opportunity",
    owner: "Jess",
    dueDate: "Nov 18",
    status: "completed",
  },
];

export default function TasksViewPage() {
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
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 py-4 text-sm">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{task.title}</p>
                <p className="text-xs text-slate-500">
                  Due {task.dueDate} · Owner {task.owner}{" "}
                  {task.relatedTo && `· Related: ${task.relatedTo}`}
                </p>
              </div>
              <span className="text-xs uppercase text-slate-500">
                {task.status}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}


