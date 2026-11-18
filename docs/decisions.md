# Decisions and trade-offs

Every notable decision in the project, in the order the code is read: stack, data, API,
front end, then tooling and hosting. The README shows the ten most important.

On a team project each row would be a separate decision record (ADR) with its context
and consequences. This table is the same practice, sized for a take-home.

## Stack

| #   | Decision           | Choice                               | Why                                                                                      | Trade-off                                                                        |
| --- | ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | Front-end routing  | React Router v7, framework mode, SPA | Required by the brief. Framework mode with `ssr: false` gives the build and typed routes | More tooling than using React Router as a plain library                          |
| 2   | UI library         | Mantine                              | Complete components out of the box, so less code in the repository to explain            | Heavier bundle than hand-picked shadcn/ui components                             |
| 3   | Table component    | Mantine's own table                  | Sorting and paging happen in the database, so the table only displays rows               | TanStack Table would help if columns became configurable (resize, reorder, hide) |
| 4   | API style          | tRPC                                 | One Zod schema validates the input and types the client; no hand-written client code     | Only TypeScript clients use it comfortably; REST would suit a public API better  |
| 5   | HTTP server        | Express                              | Widely known and the least set-up to explain                                             | Fastify is faster and has better TypeScript support                              |
| 6   | Shared code        | A `shared` workspace for schemas     | The web app and the API validate with the same object                                    | A third package to maintain                                                      |
| 7   | Production runtime | Node 24 runs the TypeScript directly | No compile step and no build tooling on the server                                       | Limited to type syntax that can be erased (no `enum`, for example)               |

## Data

| #   | Decision         | Choice                                 | Why                                                                                    | Trade-off                                                                                       |
| --- | ---------------- | -------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 8   | Plant model      | One plant per material                 | It is what the brief asks for and keeps the table one row per record                   | SAP holds stock and status per plant in a linking table; this model cannot share a material     |
| 9   | Manufacturer     | Optional, with an optional part number | Raw materials such as steel plate have neither                                         | A left join, and a dash in the table                                                            |
| 10  | Fixed value sets | Postgres enums                         | The database rejects bad values, and one list feeds the enum, the types and validation | Adding a value needs a migration; removing one is awkward. Lookup tables would be more flexible |
| 11  | Keys             | Integer ids; codes are unique columns  | A plant code or material number can change without breaking references                 | The URL shows `plant=1`, not the more readable `plant=1000`                                     |
| 12  | Money            | `numeric(12,2)`, a string end to end   | Exact; never passes through a floating-point number                                    | The price field is a validated text box, not a number input with steppers                       |
| 13  | Seed data        | Hand-written part families, fixed seed | Believable searches, and identical rows on every run                                   | The catalogue file is long, and descriptions repeat across plants                               |

## API

| #   | Decision       | Choice                                      | Why                                                                              | Trade-off                                                                             |
| --- | -------------- | ------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 14  | Search method  | `ILIKE` contains-match with trigram indexes | People type fragments of part numbers; full-text search matches whole words only | No word stemming or relevance ranking; two-letter searches cannot use the indexes     |
| 15  | Pagination     | Offset and limit with a total count         | Lets the user jump to any page and see how many results there are                | Slows down on very deep pages; keyset pagination fixes that but cannot jump to a page |
| 16  | Stable sorting | Every sort adds `id` as a tie-break         | Without it, rows with equal values can appear on two pages or on none            | Slightly more for the database to sort                                                |
| 17  | Filters        | Several values each; OR inside, AND between | Matches how people ask: "active or pending, at Brisbane"                         | No way to express "not obsolete" or a price range                                     |

## Front end

| #   | Decision       | Choice                              | Why                                                                             | Trade-off                                                                                |
| --- | -------------- | ----------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 18  | Table state    | The URL is the only store           | Refresh, share and the back button all work with no extra state to keep in sync | Every change is a navigation; state that should not be shareable would need another home |
| 19  | Search trigger | Button or Enter, not a typing delay | One search is exactly one request, and the code is simpler than a debounce      | Results do not update as you type                                                        |

## Tooling and hosting

| #   | Decision | Choice                                   | Why                                                                          | Trade-off                                                                                                        |
| --- | -------- | ---------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 20  | Tests    | Real Postgres, hand-written fixtures     | The behaviour worth testing is the SQL; a mocked database would test nothing | Tests need Docker running, and files that write to the database run one after another                            |
| 21  | Hosting  | Render free plan; migrations at start-up | Free, described as code, and deploys only after CI passes                    | The API sleeps when idle unless a scheduler pings it; start-up migrations would race with more than one instance |
