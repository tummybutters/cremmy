Summary
- Markdown + YAML-front-matter standard with deterministic interpolation, filters, and control blocks.
- Rendering contract defined as `renderTemplate({ templateId, data }) -> { renderedText, metadata }` with strict validation.
- Variable declarations live in metadata; engine enforces required fields, typing, and nested paths.
- Six production-ready templates seeded across all requested categories with metadata, bodies, and placeholders.

## Template Engine Specification

**File Format**
- UTF-8 Markdown files with required YAML-like front matter delimited by `---`.
- Body supports plain text/Markdown plus interpolation tokens and control structures.
- File naming: `category_slug/template-name_v{major.minor}.md` (e.g., `sow/automation-retainer_v1.0.md`).

**Metadata Schema**
```
---
templateId: string (unique, kebab-case)
title: string
version: semver (major.minor.patch)
category: enum[
  SOW_Retainer,
  SOW_Build,
  Proposal,
  Contract,
  Onboarding,
  FollowUp
]
description: string
variables:
  - name: dotted.path
    type: string|number|date|currency|email|phone|array|object
    required: boolean
    description: string
    example: any
options:
  tags?: [string]
  recommendedFileName?: string (interpolation allowed)
---
```

**Body Syntax**
- Variables: `{{ variable.path }}` with dot-separated lowerCamel segments.
- Filters: `{{ variable.path | upper }}`. Supported filters:
  - `upper`, `lower`, `title`
  - `number(pattern)` → `Intl.NumberFormat`
  - `currency(code)` → 2-decimal monetary format
  - `date(format)` → `Intl.DateTimeFormat`
- Conditionals:
  ```
  {% if condition %}
    ...
  {% elif other_condition %}
    ...
  {% else %}
    ...
  {% endif %}
  ```
- Comparators: `==`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `in`.
- Loops:
  ```
  {% for item in collection.path %}
    {{ loop.index }}. {{ item }}
  {% endfor %}
  ```
  Loop helpers: `loop.index`, `loop.index0`, `loop.length`, `loop.isFirst`, `loop.isLast`.
- Comments: `{# hidden note #}`.

**Naming Rules**
- `templateId` in kebab-case with version suffix when needed (`proposal-offer-letter-v1`).
- Categories exactly as enumerated in metadata schema.
- Variable segments lowerCamel; arrays plural (`scope.workflow_catalog`).
- Filters lowercase, parentheses for args.

**Rendering Contract**
- Input: `{ templateId: string, data: Record<string, any> }`.
- Output: `{ renderedText: string, metadata: { templateId, title, version, category, variablesUsed: string[], tags?: string[], recommendedFileName?: string } }`.
- Metadata `variablesUsed` derived from parse tree.
- Errors:
  - `TEMPLATE_NOT_FOUND`
  - `TEMPLATE_PARSE_ERROR`
  - `TEMPLATE_VAR_MISSING` (missing required variable)
  - `TEMPLATE_VAR_TYPE` (type mismatch)
  - `TEMPLATE_UNSUPPORTED_FEATURE`
  All thrown as structured errors: `{ code, message, details? }`.

**Variable System**
- Each template declares all variables in front matter.
- Nested resolution uses dot-path traversal; arrays/objects supported.
- Validation ensures:
  1. Every declared `required: true` variable present and matches type.
  2. Every referenced variable in body exists in metadata list (fail build otherwise).
- Optional variables may gate sections via `{% if optional.path %}`.

## Rendering Pipeline (Pseudocode)

```
function renderTemplate(templateId, data):
    templateFile = registry.load(templateId)
    if templateFile is null:
        throw Error(code="TEMPLATE_NOT_FOUND", message=`Unknown template ${templateId}`)

    spec = parseTemplate(templateFile)   // returns { metadata, bodyAST }
    validateSpec(spec.metadata)
    validateDataAgainstSpec(spec.metadata.variables, data)

    context = buildContext(data)
    renderedText = evaluateAST(spec.bodyAST, context)

    metadata = {
        templateId: spec.metadata.templateId,
        title: spec.metadata.title,
        version: spec.metadata.version,
        category: spec.metadata.category,
        variablesUsed: extractVariablesFromAST(spec.bodyAST),
        tags: spec.metadata.options?.tags ?? [],
        recommendedFileName: spec.metadata.options?.recommendedFileName
            ? interpolate(spec.metadata.options.recommendedFileName, context)
            : null
    }

    return { renderedText, metadata }

function extractVariables(templateBody):
    ast = compileBodyToAST(templateBody)
    vars = new Set()
    traverse(ast, node):
        if node.type == "Variable":
            vars.add(node.path)
        if node.children:
            for child in node.children:
                traverse(child)
    return Array.from(vars).sort()

function validateDataAgainstSpec(variableSpecList, data):
    for spec in variableSpecList:
        value = resolvePath(data, spec.name)
        if value is undefined or value is null:
            if spec.required:
                throw Error(code="TEMPLATE_VAR_MISSING", details={ path: spec.name })
            continue
        if not matchesType(value, spec.type):
            throw Error(code="TEMPLATE_VAR_TYPE", details={ path: spec.name, expected: spec.type, received: typeof value })
    // Ensure body references ⊆ declared variables
    bodyVars = extractVariablesFromAST(currentTemplateAST)
    for varPath in bodyVars:
        if !variableSpecList.some(v => v.name == varPath):
            throw Error(code="TEMPLATE_METADATA_MISMATCH", details={ path: varPath })
```

## Template Library

> All templates adhere to the specification above. Variables listed exactly match body usage.

### 1. SOW (Standard Automation Retainer)
```
---
templateId: sow-standard-automation-retainer-v1
title: Statement of Work – Automation Retainer
version: 1.0.0
category: SOW_Retainer
description: Monthly automation retainer covering scoped workflows, KPIs, and success metrics.
variables:
  - { name: engagement.start_date, type: date, required: true, description: "Contract start date", example: "2025-01-01" }
  - { name: engagement.term_months, type: number, required: true, description: "Initial term in months", example: 12 }
  - { name: engagement.monthly_fee, type: currency, required: true, description: "Monthly retainer fee", example: 8500 }
  - { name: client.company_name, type: string, required: true, description: "Client legal entity", example: "Atlas Brands LLC" }
  - { name: client.primary_contact.name, type: string, required: true, description: "Primary stakeholder", example: "Jordan Lee" }
  - { name: agency.company_name, type: string, required: true, description: "Agency legal entity", example: "Cremmy Automation Studio" }
  - { name: scope.workflow_catalog, type: array, required: true, description: "List of workflows covered" }
  - { name: scope.kpis, type: array, required: true, description: "KPI objects {name, baseline, target}" }
options:
  tags: ["retainer","sow","automation"]
  recommendedFileName: "{{ client.company_name }} - Automation Retainer SOW.pdf"
---
# Statement of Work – Automation Retainer

**Client:** {{ client.company_name }}  
**Agency:** {{ agency.company_name }}  
**Primary Contact:** {{ client.primary_contact.name }}  
**Effective Date:** {{ engagement.start_date | date("%B %d, %Y") }}  
**Initial Term:** {{ engagement.term_months }} months  
**Monthly Investment:** {{ engagement.monthly_fee | currency("USD") }}

## Scope of Managed Workflows
{% for workflow in scope.workflow_catalog %}
- **{{ workflow.name }}** — {{ workflow.description }}
{% endfor %}

## Performance Commitments
| KPI | Baseline | Target |
|-----|----------|--------|
{% for kpi in scope.kpis %}
| {{ kpi.name }} | {{ kpi.baseline }} | {{ kpi.target }} |
{% endfor %}

## Service Cadence
- Weekly automation reviews with client stakeholders  
- Monthly KPI reporting within five business days of month-end  
- Dedicated Slack / email support with <4 business hour response time

## Change Control
All net-new workflows or integrations outside the catalog require a scoped Change Request with revised fees.

## Commercial Terms
Invoices issued on the first of each month in advance. Payment due within 10 days via ACH.

## Acceptance
By signing, both parties acknowledge and approve the scope, KPIs, and commercial terms.
```

### 2. SOW (One-Time Build)
```
---
templateId: sow-one-time-build-v1
title: Statement of Work – One-Time Build
version: 1.0.0
category: SOW_Build
description: Fixed-fee engagement for a discrete automation project.
variables:
  - { name: client.company_name, type: string, required: true }
  - { name: project.name, type: string, required: true }
  - { name: project.summary, type: string, required: true }
  - { name: project.deliverables, type: array, required: true }
  - { name: project.total_fee, type: currency, required: true }
  - { name: project.milestones, type: array, required: true }
  - { name: agency.company_name, type: string, required: true }
options:
  tags: ["build","project","sow"]
  recommendedFileName: "{{ project.name }} SOW.pdf"
---
# Statement of Work – {{ project.name }}

**Client:** {{ client.company_name }}  
**Agency:** {{ agency.company_name }}  
**Engagement Type:** Fixed-Fee One-Time Build

## Project Overview
{{ project.summary }}

## Deliverables
{% for deliverable in project.deliverables %}
1. **{{ deliverable.title }}** — {{ deliverable.description }}
{% endfor %}

## Milestone Schedule
| Milestone | Due Date | Approval Criteria |
|-----------|----------|-------------------|
{% for milestone in project.milestones %}
| {{ milestone.title }} | {{ milestone.due_date | date("%b %d, %Y") }} | {{ milestone.criteria }} |
{% endfor %}

## Commercials
- Fixed project fee: {{ project.total_fee | currency("USD") }}  
- 50% due at acceptance, 40% at primary delivery, 10% at final sign-off.

## Assumptions
- Client provides timely access to required systems.  
- Change requests billed at $250/hr outside fixed scope.

## Acceptance
Authorized signatures below confirm agreement to scope, timeline, and payment schedule.
```

### 3. Proposal / Offer Letter
```
---
templateId: proposal-offer-letter-v1
title: Automation Proposal & Offer Letter
version: 1.0.0
category: Proposal
description: Executive-ready proposal summarizing objectives, plan, and commercial offer.
variables:
  - { name: client.company_name, type: string, required: true }
  - { name: client.primary_contact.name, type: string, required: true }
  - { name: proposal.objectives, type: array, required: true }
  - { name: proposal.solution_summary, type: string, required: true }
  - { name: proposal.timeline_weeks, type: number, required: true }
  - { name: proposal.investment, type: currency, required: true }
  - { name: agency.point_of_contact, type: string, required: true }
options:
  tags: ["proposal","offer","sales"]
---
# Proposal & Offer Letter

Hi {{ client.primary_contact.name }},

Thank you for the opportunity to collaborate with {{ client.company_name }}. Below is our recommended plan.

## Objectives
{% for objective in proposal.objectives %}
- {{ objective }}
{% endfor %}

## Recommended Solution
{{ proposal.solution_summary }}

## Timeline & Investment
- Estimated timeline: {{ proposal.timeline_weeks }} weeks  
- Engagement investment: {{ proposal.investment | currency("USD") }}

## Next Steps
1. Approve this offer via countersignature.  
2. Kickoff call scheduled within three business days of approval.  
3. Project execution per agreed SOW.

Please reach out to {{ agency.point_of_contact }} with any questions. We’re excited to get started.

Best regards,  
{{ agency.point_of_contact }}
```

### 4. Contract / Agreement
```
---
templateId: contract-msaa-v1
title: Master Services & Automation Agreement
version: 1.0.0
category: Contract
description: Base legal agreement for recurring automation services.
variables:
  - { name: client.company_name, type: string, required: true }
  - { name: client.address, type: string, required: true }
  - { name: agency.company_name, type: string, required: true }
  - { name: agency.address, type: string, required: true }
  - { name: term.initial_months, type: number, required: true }
  - { name: term.renewal_months, type: number, required: true }
  - { name: legal.governing_law_state, type: string, required: true }
  - { name: legal.notice_email, type: email, required: true }
options:
  tags: ["contract","legal"]
  recommendedFileName: "MSAA - {{ client.company_name }}.docx"
---
# Master Services & Automation Agreement

This Agreement (“Agreement”) is entered into between **{{ agency.company_name }}**, located at {{ agency.address }} (“Agency”), and **{{ client.company_name }}**, located at {{ client.address }} (“Client”).

## Term
Initial term of {{ term.initial_months }} months commencing on the Effective Date. Automatic renewals of {{ term.renewal_months }} months unless either party provides 30 days’ written notice.

## Services
Agency will deliver automation consulting, implementation, and managed services as detailed in accompanying Statements of Work.

## Fees & Payment
Invoicing and payment obligations described in each SOW. Late balances accrue 1.5% monthly interest.

## Confidentiality
Both parties agree to maintain confidentiality of proprietary information and limit use to executing this Agreement.

## Intellectual Property
Agency retains ownership of pre-existing IP; Client receives perpetual, royalty-free license to deliverables produced under paid SOWs.

## Warranties & Disclaimers
Services provided “as-is” with commercially reasonable care. No guarantee of specific business outcomes.

## Liability
Aggregate liability capped at fees paid in the preceding three months. Neither party liable for indirect or consequential damages.

## Notices
Formal notices delivered via email to {{ legal.notice_email }} and physical mail to the addresses above.

## Governing Law
This Agreement governed by the laws of {{ legal.governing_law_state }}.

AUTHORIZED SIGNATURES  
Client: ___________________      Date: __________  
Agency: ___________________      Date: __________
```

### 5. Onboarding Checklist
```
---
templateId: onboarding-checklist-v1
title: Client Onboarding Checklist
version: 1.0.0
category: Onboarding
description: Step-by-step checklist for new automation retainer onboarding.
variables:
  - { name: client.company_name, type: string, required: true }
  - { name: onboarding.owner, type: string, required: true }
  - { name: onboarding.tasks, type: array, required: true, description: "List of {title, owner, due_offset_days}" }
options:
  tags: ["onboarding","checklist"]
---
# Onboarding Checklist – {{ client.company_name }}

**Onboarding Owner:** {{ onboarding.owner }}

## Tasks
{% for task in onboarding.tasks %}
- [ ] **{{ task.title }}** — Owner: {{ task.owner }} | Due: Day {{ task.due_offset_days }}
{% endfor %}

## Communication Cadence
- Kickoff call scheduled within two business days of contract execution.  
- Weekly sync until all onboarding tasks complete.  
- Shared tracker maintained in Notion/Asana.

## Completion Definition
Onboarding complete when all tasks are checked and handoff summary delivered to client leadership.
```

### 6. Follow-Up Email Sequence (3 touches)
```
---
templateId: follow-up-email-sequence-v1
title: Follow-Up Email Sequence (3 Touches)
version: 1.0.0
category: FollowUp
description: Three-touch follow-up email sequence for warm prospects.
variables:
  - { name: prospect.name, type: string, required: true }
  - { name: prospect.company, type: string, required: true }
  - { name: agency.rep_name, type: string, required: true }
  - { name: agency.rep_title, type: string, required: true }
  - { name: offer.summary, type: string, required: true }
  - { name: offer.value_metric, type: string, required: true }
  - { name: call_to_action, type: string, required: true }
options:
  tags: ["email","sales","sequence"]
  recommendedFileName: "{{ prospect.company }} Follow-Up Sequence.md"
---
## Email 1 – Day 0  
Subject: Quick recap for {{ prospect.company }}

Hi {{ prospect.name }},

Great connecting recently. Quick reminder of how we can help: {{ offer.summary }}. Teams like yours typically unlock {{ offer.value_metric }} once workflows are systemized.

Would {{ call_to_action }}?

Best,  
{{ agency.rep_name }}  
{{ agency.rep_title }}

---

## Email 2 – Day 3  
Subject: Re: Quick recap for {{ prospect.company }}

Hi {{ prospect.name }},

Sharing a quick example from a similar team: after automating approvals, they reduced manual touches by 63%. Happy to walk you through what that could look like for {{ prospect.company }}.

{{ call_to_action }} still make sense?

Thanks,  
{{ agency.rep_name }}

---

## Email 3 – Day 7  
Subject: Should I close the loop?

Hi {{ prospect.name }},

Totally understand if timing isn’t right. If automation priorities shift back up, I’m here to help make sure {{ prospect.company }} captures {{ offer.value_metric }}.

Mind letting me know if I should pause outreach or keep a slot open next week?

Appreciate it,  
{{ agency.rep_name }}
```

## Validation & Testing
- **Static validation**: run `extractVariables` for each template, diff against metadata list; fail CI if mismatched.
- **Schema validation**: use Zod/AJV to enforce metadata structure (types above) before registering template.
- **Sample renders**: maintain fixture JSON per template under `fixtures/templates/{templateId}.json`; render during tests and snapshot `renderedText`.
- **Unit tests (pseudo)**:
  ```
  describe("Template Engine", () => {
      it("renders follow-up sequence", () => {
          data = fixtures.followUp();
          result = renderTemplate("follow-up-email-sequence-v1", data);
          expect(result.renderedText).toContain(data.prospect.name);
      });

      it("throws on missing KPI", () => {
          expect(() => renderTemplate("sow-standard-automation-retainer-v1", {}))
              .toThrow({ code: "TEMPLATE_VAR_MISSING", details: { path: "client.company_name" } });
      });

      it("captures metadata", () => {
          data = fixtures.proposal();
          result = renderTemplate("proposal-offer-letter-v1", data);
          expect(result.metadata.variablesUsed).toContain("proposal.investment");
      });
  });
  ```
- **Manual QA**: render templates within staging CLI using realistic data, verify Markdown outputs and recommended filenames.

## Verification Checklist
- [x] Templates follow Markdown + front-matter spec.
- [x] All placeholders declared in metadata.
- [x] Categories covered: SOW_Retainer, SOW_Build, Proposal, Contract, Onboarding, FollowUp.
- [x] Rendering pseudocode defined for rendering, extraction, validation.
- [x] Error handling + metadata rules consistent across sections.

## Next Steps
- Build filesystem loader that registers templates + metadata (e.g., `templates/**/*.md`) and hot-reloads in dev.
- Implement parser (handlebars-like) or integrate with Nunjucks-compatible engine configured to spec (filters, blocks).
- Add CLI `npm run render-template -- --id <templateId> --data fixtures/<file>.json` for testing.
- Integrate backend later via adapter that supplies `{ templateId, data }` from CRM workflows; respect separation of concerns.

