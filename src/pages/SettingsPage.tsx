import { Card, FormField, Input, PageHeader, Select } from "@/components";

export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Settings"
        description="Single-user configuration panel."
        actions={[{ label: "Save Changes" }]}
      />
      <p className="text-xs uppercase text-slate-400">
        TODO: wire to backend
      </p>
      <Card title="Profile">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Full Name" description="Displayed across the CRM.">
            <Input placeholder="Jess Placeholder" />
          </FormField>
          <FormField label="Email">
            <Input placeholder="jess@example.com" type="email" />
          </FormField>
        </div>
      </Card>
      <Card title="Workspace">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="Timezone">
            <Select defaultValue="utc">
              <option value="utc">UTC</option>
              <option value="pst">Pacific Time</option>
            </Select>
          </FormField>
          <FormField
            label="Default Stage"
            description="Applied to new clients automatically."
          >
            <Select defaultValue="new-lead">
              <option value="new-lead">New Lead</option>
              <option value="qualified">Qualified</option>
            </Select>
          </FormField>
        </div>
      </Card>
    </section>
  );
}


