# Supplier portal — user flows

The supplier dashboard is the home page after sign-in. From there, a supplier either picks up something in **Needs your attention**, or opens one of four working areas: company information, onboard a product, update an existing product, or publish a Commissioning Store page. Contact and Account management are placeholder pages with no journey yet.

Everything a supplier submits is accepted straight away. Company chapters apply as soon as they are submitted, an onboarding form is onboarded when it is submitted, product changes become the current version, and store pages are published.

The prototype uses a made-up supplier, **Aurora Health Limited** (contact Brandson Sanderson), with two made-up products:

- **Respira CBT**, a digital CBT programme for adults with generalised anxiety disorder, is the sample onboarding form.
- **BreatheWell COPD**, remote monitoring and self-management for people with COPD, is the sample onboarded product, under Manage products and Published pages. Its held record is in `lib/portalProducts/breathewellCopd.ts`.

## Statuses

| Area | Statuses |
| --- | --- |
| Company information | Incomplete, Draft changes, Up to date |
| Product onboarding | Incomplete, Submitted |
| Manage products | Up to date, Draft changes |
| Published pages | Unpublished, Unpublished changes, Published |

The full list with tag colours is at `/supplier-portal/statuses` (not linked from the dashboard).

## Sign in

Any supplier portal address sends a signed-out person to sign-in, then back to the page they were opening. A filled-in email and password are enough; this prototype accepts any values.

```mermaid
flowchart TD
  open[Open a supplier portal page] --> signedIn{Signed in?}
  signedIn -->|Yes| page[That page]
  signedIn -->|No| signIn[Sign in]
  signIn --> filled{Email and password entered?}
  filled -->|No| errors[Show what is missing]
  errors --> signIn
  filled -->|Yes| land[Dashboard, or the page they were opening]
```

## What the dashboard offers

**Needs your attention** is the work queue. It lists company information that has never been submitted, an onboarding form that is incomplete, and a product page or the supplier page that is still unpublished. Draft changes and unpublished changes stay off this list.

The section cards are the longer routes below.

```mermaid
flowchart TD
  dash[Dashboard] --> queue[Needs your attention]
  dash --> sections[Section cards]
  queue --> company[Company information]
  queue --> form[Onboarding form]
  queue --> productPage[Product page]
  queue --> supplierPage[Supplier page]
  sections --> companyCard[Company information]
  sections --> onboard[Product onboarding]
  sections --> manage[Manage products]
  sections --> published[Published pages]
```

## Company information

Dashboard, then Company information. This is the Section A supplier questionnaire, split into three chapters, each submitted on its own. A chapter that has not been submitted is a row in a task list, marked Incomplete. Opening it runs through its questions one per page (Save and continue), then that chapter's Check your answers and Confirm and submit. Once submitted, the chapter appears on the page as a read-only summary list under its title, with one Change button next to the title. There is no page-level Submit. Once every chapter has been submitted a status and last-updated date are shown on top.

Submitting a chapter applies its answers straight away.

Chapters and questions (A2 to A4 from the Section A spec are about a product, so they open each product onboarding form instead):

1. Company details: A1 company name; does the company trade under a different name? (added, No / Yes) and, if yes, the trading name; type of organisation (added); A9 country of registration; A10 Companies House, charity number or reference; A8 registered address (NHS Addresses pattern: address lines, town, county, postcode); company website (added)
2. Relationship manager: A5 first name, last name and job title; A6 email and phone number
3. Care Quality Commission: A11 required to register with the CQC? (Yes / No); if yes, A11 date of last assessment and A12 upload of the latest CQC report (file only, no reference name)

```mermaid
flowchart TD
  page[Company information page] --> row[Chapter not yet submitted: task-list row, Incomplete]
  page --> ro[Chapter submitted: title, Change button, read-only summary list]
  row -->|Open| q[One question per page: Save and continue]
  q --> q
  q -->|Last question| check[Check your answers for the chapter]
  check -->|Change link on a row| one[Edit that question: Save and exit]
  one --> check
  check --> confirm[Confirm and submit]
  confirm --> done[Confirmation: chapter submitted, chapters still to complete]
  done --> page
  ro -->|Change| q
  q -->|Save and exit part-way| roDraft[Summary list with rows marked Not yet submitted: Review and submit, or Discard changes]
  roDraft --> check
  roDraft --> ro
```

Save and exit on any question keeps the answers as a draft and returns to the Company information page; Cancel and exit discards that page's unsaved edits. Nothing changes until Confirm and submit on the chapter's Check your answers. Submitting one chapter leaves drafts in other chapters as they are.

## Onboard a new product

Dashboard, then Product management, then Product onboarding. Each product has its own form. The sample form is Respira CBT, at `/supplier-portal/products/onboard/respira-cbt`. Answers save as you go. Submit stays unavailable until every task is completed.

The form has four sections and seven tasks. Each task is a run of one-question-per-page screens, and some questions only appear depending on earlier answers in the same task (see "Product onboarding question routes" below).

1. Product details (A2 product name, A3 version number, A4 type of product, with a "Give details" box on the same page when Other is chosen)
2. Value proposition (Section B, not scored)
3. Assessed standards: Clinical safety (C1), Data protection (C2), Technical security (C3), Interoperability (C4)
4. Usability and accessibility (Section D)

Once the product name (A2) is answered, later questions, hints and page titles say the product's name instead of "your product" or "the product" (for example, "Does Respira CBT qualify as software or AI as a medical device?").

Each Assessed standards task opens with an information page before its first question. It has a heading, guidance text and links, and a Continue button. It has no answer, so it does not appear on Check your answers and does not hold up the task being completed:

- Clinical safety: why clinical safety must be established, DCB0129 (manufacturers) and DCB0160 (deploying organisations), and reporting safety concerns through the MHRA Yellow Card scheme and the Learn from patient safety events service
- Data protection: collecting, storing and using personal data in line with UK GDPR, for the version of the product being assessed
- Technical security: industry best practice security standards, and contractual arrangements for incidents and disaster recovery
- Interoperability: exchanging data with other systems, following the GDS Open API Best Practices, and reflecting NHS and social care standards

Some upload questions offer a "can't provide" link: the clinical risk management system, Clinical Safety Case Report and Hazard Log (C1), ICO registration evidence and the DPIA (C2), and the Cyber Essentials certificate and penetration test summary (C3). Choosing it records "Not provided" and moves on to the next question on the route.

```mermaid
flowchart TD
  list[Product onboarding list] --> form[Open the product form]
  form --> tasks[Task list]
  tasks --> page[Open a task at its first page]
  page --> kind{What kind of page?}
  kind -->|Information page| info[Read the guidance]
  info -->|Continue| nextpage
  kind -->|Question| question[Answer the question]
  kind -->|Stop page| stop[Explains what must be done first, no buttons]
  stop -->|You can change your answer| question
  question -->|Save and Next| nextpage{Last page of the form?}
  nextpage -->|No| page2[Next page on the route, moving into the next task when this one ends]
  page2 --> kind
  nextpage -->|Yes| last[Last page: Save and Exit only]
  question -->|Save and Exit| tasks
  last -->|Save and Exit| tasks
  info -->|Cancel| tasks
  question -->|Cancel, discards this page's changes| tasks
  tasks --> ready{Every task completed?}
  ready -->|No| tasks
  ready -->|Yes| submit[Submit]
  submit --> check[Check your answers]
  check --> change[Change an answer]
  change --> question
  check --> confirm[Confirm and submit]
  confirm --> done[Confirmation: product has been onboarded]
```

Save and Next saves the answer and goes to the next page on the supplier's route. At the end of a task it carries straight on into the first page of the next task, across sections, so a supplier can go through the whole form without returning to the task list. The last page of the form (D1.5, or D1.4 when the product is not a web or mobile application) has no Save and Next.

Save and Exit saves and returns to the task list. A task is marked Completed once every question on its route has an answer, whichever button was used; otherwise it stays incomplete and the supplier can come back to it. Cancel discards changes on the current page and returns to the task list. Information pages have only Continue and Cancel. Stop pages (C1.2.2 "No" and C2.1 "No") have no buttons; instead they offer "You can change your answer" (back to the question) and "Get support" from the HealthStore team.

The Submit button on the task list stays unavailable until every task is Completed and leads to Check your answers. Confirm and submit onboards the product straight away and the form status becomes Submitted. After that the product is kept up to date from Manage products.

Two prototype shortcuts help with testing. Question pages have a "Fill with sample" link that enters a sample answer. The task list has a "Mark all as complete" link that fills any unanswered questions with sample answers and marks every task Completed, so Submit can be tried straight away.

### Product onboarding question routes

Save and next only visits the questions on the supplier's route. Questions that are skipped are left out of the Completed check and of Check your answers. Changing an earlier answer can bring a skipped question back; its previous answer, if any, is kept.

Every document the supplier may not have is asked for in two steps, like D1.1: a "Can you provide…?" page with Yes ("You can upload this on the next page") or "No, I can't provide this right now", then the upload page only on Yes. No goes straight to the next question, and the document shows as Not provided on the product page. This applies to B4, C1.2.3, both C1.2.4 uploads, C2.2.1, C2.2.2, C3.1, C3.3 and D1.1.

#### Section A: Product details

No branching. Choosing Other on A4 shows a "Give details" box on the same page.

```mermaid
flowchart TD
  A2["A2 Product name"] --> A3["A3 Version number"]
  A3 --> A4{"A4 Type of product"}
  A4 -->|"Standalone application / Wearable / SaaS"| toB[Go to Section B]
  A4 -->|Other| A4other["Give details, on the same page"]
  A4other --> toB
```

#### Section B: Value proposition

No branching apart from the B4 upload.

```mermaid
flowchart TD
  B1["B1 Intended use of the product"] --> B2["B2 What the product does and how it is used"]
  B2 --> B3["B3 Intended users, benefits, validation"]
  B3 --> B4{"B4 Can you provide the data flow with the health IT system?"}
  B4 -->|Yes| B4up["Upload journey maps and data flows"]
  B4 -->|"No, I can't provide this right now"| toC1[Go to C1]
  B4up --> toC1
```

#### C1: Clinical safety (DCB0129)

An interstitial page on DCB0129 / DCB0160 / MHRA reporting is shown before any C1 question.

```mermaid
flowchart TD
  intro["Clinical safety interstitial"] --> C111{"C1.1.1 Software or AI as a medical device?"}
  C111 -->|Yes| PAQ["Upload PAQ form"]
  PAQ --> C112{"C1.1.2 Product classification"}
  C112 -->|"Standalone device / Part of an IT system"| C12{"C1.2 Supports real-time or direct care?"}
  C111 -->|No| C12
  C12 -->|Yes| C122["C1.2.2 DCB0129 Compliance"]
  C12 -->|No| C121["C1.2.1 Justify why out of scope of DCB0129"]
  C121 --> toC2
  C122 -->|Yes| C123{"C1.2.3 Can you provide your clinical risk management system?"}
  C122 -->|No| C122stop["Clinical risk management is required before you can continue"]
  C123 -->|Yes| C123up["Upload clinical risk management system"]
  C123 -->|No| C124
  C123up --> C124{"C1.2.4 Can you provide your Clinical Safety Case Report?"}
  C124 -->|Yes| C124up["Upload Clinical Safety Case Report"]
  C124 -->|No| C124h
  C124up --> C124h{"C1.2.4 Can you provide your Hazard Log?"}
  C124h -->|Yes| C124hup["Upload Hazard Log"]
  C124h -->|No| C125
  C124hup --> C125["C1.2.5 Clinical Safety Officer details"]
  C125 --> toC2[Go to C2]
```

#### C2: Data protection (UK GDPR)

An interstitial page on UK GDPR compliance is shown before any C2 question. C2.2.1 to C2.2.6 are asked only when the product processes personal data.

```mermaid
flowchart TD
  intro["Data protection interstitial"] --> C21{"C2.1 Compliant with annual DSPT?"}
  C21 -->|Yes| C22["C2.2 Processes personal data?"]
  C21 -->|Not applicable| C22
  C21 -->|No| C21stop["You must be compliant with the DSPT"]
  C22 -->|No| toC3
  C22 -->|Yes| C221{"C2.2.1 Can you provide ICO registration evidence?"}
  C221 -->|Yes| C221up["Upload ICO registration evidence"]
  C221up --> C221exp["ICO registration expiry date"]
  C221 -->|No| C222
  C221exp --> C222{"C2.2.2 Can you provide the DPIA?"}
  C222 -->|Yes| C222up["Upload DPIA"]
  C222 -->|No| C223
  C222up --> C223
  C223{"C2.2.3 How will you provide transparency information?"}
  C223 -->|A link| C224
  C223 -->|Upload a document| C223up["Upload the transparency documentation"]
  C223 -->|Can't provide| C224
  C223up --> C224{"C2.2.4 How will you provide these terms and conditions?"}
  C224 -->|A link| C225
  C224 -->|Upload a document| C224up["Upload documentation for user data and EULA"]
  C224 -->|Can't provide| C225
  C224 -->|Not applicable| C225
  C224up --> C225{"C2.2.5 Where is data stored and processed?"}
  C225 -->|UK only| toC3[Go to C3]
  C225 -->|Outside the UK| C226["C2.2.6 Countries where data is stored or processed (autocomplete, Add another country)"]
  C226 --> C226s["C2.2.6 Compliance safeguards: a text area for each country"]
  C226s --> toC3
```

C2.2.6 uses the GOV.UK country autocomplete (countries only, UK excluded) with the Scottish Government "Add more fields" pattern. The next page asks for the safeguards for each country listed.

#### C3: Technical security

An interstitial page on security standards is shown before any C3 question.

```mermaid
flowchart TD
  intro["Technical security interstitial"] --> C31{"C3.1 Can you provide a Cyber Essentials certificate?"}
  C31 -->|Yes| C31up["Upload Cyber Essentials certificate"]
  C31up --> C31exp["Cyber Essentials certificate expiry date"]
  C31 -->|No| C32
  C31exp --> C32["C3.2 Signed the NHS Cyber Security Charter?"]
  C32 -->|"Yes / No"| C33{"C3.3 Can you provide a penetration test summary?"}
  C33 -->|Yes| C33up["Upload penetration test summary"]
  C33 -->|No| C34
  C33up --> C34["C3.4 Software Security Code of Practice"]
  C34 --> C35["C3.5 Plan for MFA on all accounts?"]
  C35 --> C351["C3.5.1 MFA on privileged supplier access?"]
  C351 --> C36["C3.6 Logging and reporting defined?"]
  C36 --> toC4b[Go to C4]
```

#### C4: Interoperability

An interstitial page on data exchange and Open API practice is shown before any C4 question.

```mermaid
flowchart TD
  intro["Interoperability interstitial"] --> C41{"C4.1 Exposes APIs or integration channels?"}
  C41 -->|No| C42
  C41 -->|Yes| C411["C4.1.1 Standards used and justification"]
  C411 --> C412{"C4.1.2 Follows GDS Open API guidance?"}
  C412 -->|Confirm| C42
  C412 -->|Cannot confirm| C413["C4.1.3 How APIs are documented"]
  C413 --> C42{"C4.2 Shares or receives data with care systems?"}
  C42 -->|No| toDa["Go to Section D"]
  C42 -->|Yes| C421{"C4.2.1 Uses NHS number?"}
  C421 -->|Yes| C422{"C4.2.2 Validates NHS numbers with PDS or local systems?"}
  C421 -->|No| C423
  C422 -->|Yes| C424
  C422 -->|No| C423["C4.2.3 Approach to identifying patient records"]
  C422 -->|Onboarding to PDS| C423
  C423 --> C424{"C4.2.4 Patients use NHS login?"}
  C424 -->|Yes| toDb[Go to Section D]
  C424 -->|Not applicable| toDb
  C424 -->|No| C425{"C4.2.5 Supports DAPB3051?"}
  C425 -->|Yes| toDb
  C425 -->|No| C426
  C425 -->|Not applicable| C426["C4.2.6 Authentication approach and data protection"]
  C426 --> toDb
```

#### Section D: Usability and accessibility

D1.4 first asks whether the product is a web or mobile application. No ends Section D; Yes asks which platforms are supported, then continues to D1.4.1.

```mermaid
flowchart TD
  D11{"D1.1 Can you provide how the product fits care pathways or staff journeys?"}
  D11 -->|Yes| D11up["Upload care pathways or staff journey documentation"]
  D11 -->|"No, I can't provide this right now"| D12
  D11up --> D12["D1.2 Usability testing with intended users?"]
  D12 --> D13["D1.3 Read the Accessible Information Standard?"]
  D13 --> D14{"D1.4 Is the product a web or mobile application?"}
  D14 -->|No| last["End of the form: Save and Exit to the task list"]
  D14 -->|Yes| D14p["Which digital platforms does the product support?"]
  D14p --> D141{"D1.4.1 WCAG 2.2 AA or higher?"}
  D141 -->|"Not yet, but a plan is in place"| D142["D1.4.2 Timescale for compliance"]
  D141 -->|"Yes / No / Not applicable"| D143
  D142 --> D143["D1.4.3 Accessibility statement link"]
  D143 --> D15["D1.5 Service availability over 12 months"]
  D15 --> last
  last --> tasks[Task list, then Submit, then Check your answers]
```

## Update an existing product

Dashboard, then Product management, then Manage products. The sample product is BreatheWell COPD, which starts as Up to date.

The product's page shows everything given in onboarding, laid out like the onboarding form: one numbered heading per section, and one NHS summary list per task with only the questions on the supplier's route. Each Change link opens the same question page as onboarding (`/supplier-portal/products/manage/[productId]/[task]/[step]`), with the same hints, validation and follow-up questions. Documents show the latest version only and can be replaced, not deleted.

```mermaid
flowchart TD
  products[Manage products] --> product[Open a product]
  product --> view[Answers by onboarding section and task]
  view --> edit[Change an answer]
  edit --> followUp{Answer opens a follow-up question?}
  followUp -->|Yes| next[Answer the follow-up]
  next --> save
  followUp -->|No| save[Save and continue]
  save --> draft[Status becomes Draft changes]
  draft --> view
  view --> canSubmit{Draft changes?}
  canSubmit -->|Yes| submit[Submit changes]
  submit --> check[Check your answers]
  check --> edit
  check --> confirm[Confirm and submit]
  confirm --> done[Confirmation: changes submitted]
  done --> current[Status: Up to date]
```

Draft changes are not used until they are submitted, including on the product page. Submit changes only appears once there are draft changes. Check your answers lists only the questions that differ from the current version, grouped by section and task. Confirming makes them the current version straight away and the status returns to Up to date.

## Publish or update the supplier page

Dashboard, then Published pages, then the supplier page. The supplier edits the public wording on one page, with Submit changes, Save and exit, and Cancel and exit. Content that came from onboarding is shown on the page and cannot be changed here.

## Publish or update a product page

Dashboard, then Published pages, then a product. The product page hub lists every section of the Commissioning Store product page in the order commissioners see it. Each section the supplier writes has its own page, opened from its Change links (`/supplier-portal/published/products/[productId]/[section]`).

| Section on the store | Where it comes from |
|---|---|
| The problem X addresses | Supplier writes it |
| How X changes a treatment pathway | Supplier writes bullet points and builds the current and new pathway step by step. The diagram and text version are generated |
| What using X could mean for patients, What it could be worth | Worked out from held data. Not shown in the editor |
| Funding levers and tariff alignment | Generic assumed data. Not shown in the editor |
| Assurance and evidence | Worked out from the onboarding answers in Manage products. Shown read-only on the hub |
| Clinical publications and evaluations | Held publications, plus any the supplier adds (type, title, where the study took place, outcome summary, optional link) |
| NICE guidance | Held. Not shown in the editor |
| Making it work at your site | Supplier writes the Clinical and human wrapper, What you need locally and Timeline to go-live, with heavy hint text |
| Local prerequisites | Prepopulated from the held record and the onboarding answers (for example, a DPIA when the product processes personal data). The supplier can remove or add items |
| Supplier support | Supplier writes it |
| NHS experience, Case studies and evaluations | Held sites and case studies, plus any the supplier adds |
| How to commission and procure | Held. Not shown in the editor |
| Resources | Supplier adds a demo link and a documentation link |

```mermaid
flowchart TD
  pages[Published pages] --> hub[Product page hub]
  hub --> section[Change a section]
  section --> saveSection[Save and continue]
  saveSection --> first{Has this page been published before?}
  first -->|No| unpublished[Status: Unpublished]
  first -->|Yes| changes[Status: Unpublished changes]
  changes --> live[Commissioners still see the published version]
  unpublished --> hub
  changes --> hub
  hub --> preview[Preview page, in a new tab, with unpublished changes]
  hub --> submit[Submit changes]
  submit --> check[Check your answers]
  check --> section
  check --> confirm[Confirm and submit]
  confirm --> published[Confirmation: page published]
  published --> visible[Status: Published. Store link opens the published version]
```

Preview page (`/supplier-portal/published/products/[productId]/preview`) renders the page with the same components as the Commissioning Store, including unpublished changes. The Store link on the hub adds `?version=published` to show only what is published.

A page that has never been published starts as Unpublished, so commissioners cannot see it, and it is listed under Needs your attention. Submitting publishes it straight away. On the first submission Check your answers lists every section; later it lists only what changed. Later saves become Unpublished changes, and the live page stays as it was until the new version is submitted.
