We have now clarified the core processing architecture enough to begin backend implementation.

Do not redesign the product from scratch. Treat the following as the current approved direction unless implementation reveals a concrete contradiction.

## 1. Simplify Candidate + Application

For the MVP, do not create a separate `Candidate` entity unless there is a strong implementation reason.

The product is centered on applications, and it does not currently need to manage one persistent candidate identity across multiple programs.

Prefer a single `Application` model containing applicant identity plus application data.

Conceptually:

```text
Application
- id
- program_id
- name
- email
- phone?
- raw_data JSON
- normalized_data JSON
- normalization_metadata JSON
- processing_status
- score
- score_breakdown JSON
- created_at
- updated_at
```

A future version could split `Candidate` from `Application` if cross-program identity becomes useful.

## 2. Programs store scoring configuration

Each `Program` owns a scoring configuration stored as JSON.

The configuration is created through the frontend and defines the criteria used to evaluate applicants.

Example concept:

```json
{
  "criteria": [
    {
      "id": "backend_experience",
      "name": "Backend experience",
      "priority": "high",
      "guidance": "Evaluate relevant backend experience from professional, academic, freelance, or personal project work."
    },
    {
      "id": "technical_stack",
      "name": "Technical stack",
      "priority": "high",
      "guidance": "Evaluate technologies relevant to this backend internship."
    },
    {
      "id": "motivation",
      "name": "Motivation",
      "priority": "medium",
      "guidance": "Evaluate whether the motivation is specific and relevant to the program."
    }
  ]
}
```

Do not introduce a separate eligibility/prerequisite rules engine.

The MVP uses scoring only. Final selection remains human.

## 3. Application import assumptions

The system may receive application data from external tools such as Tally, Google Forms, CSV exports, or JSON.

For the MVP, assume an import contains a collection of applications:

```json
[
  { "...": "..." },
  { "...": "..." }
]
```

or a CSV where each row represents one application.

Do not attempt to support every possible export format.

Document the supported assumptions clearly.

## 4. Separate ingestion from scoring

Treat ingestion/normalization and scoring as two distinct processing stages.

### Stage A — ingestion and normalization

```text
CSV / JSON import
        ↓
parse rows/items
        ↓
for each raw submission
        ↓
LLM normalization
        ↓
validate structured output
        ↓
store Application
```

Each application should be processed independently.

A failure on one row must not fail the entire import.

Persist successful rows even if another row fails.

Failed or ambiguous rows should retain enough raw data and metadata to support review/debugging.

## 5. Normalization output

The normalization LLM receives:

- raw form submission;
- program context;
- expected application output structure.

It should infer useful structured facts from the raw submission.

Do not force all programs into a huge universal schema.

Prefer a small fixed identity core plus flexible normalized facts.

Example:

```json
{
  "name": "Awa Ndiaye",
  "email": "awa.ndiaye@example.com",
  "facts": {
    "education": "Licence 2 Informatique",
    "skills": ["Python", "FastAPI", "PostgreSQL"],
    "experience": "3-month backend internship",
    "portfolio": "https://github.com/awa",
    "availability": "Immediately"
  },
  "metadata": {
    "confidence": 0.91,
    "warnings": []
  }
}
```

`facts` may vary between programs.

The backend should validate the top-level structure and metadata, but should not require one global fixed set of domain-specific facts.

## 6. Persist normalized applications before scoring

Once normalization succeeds, persist the application.

Do not require the full import batch or scoring stage to succeed before saving normalized applications.

The application is officially ingested once normalization has succeeded and the structured result has been stored.

## 7. Scoring stage

Scoring is a second stage.

Input:

```text
Application.normalized_data
+
Program.scoring_config
```

The LLM evaluates each configured criterion independently.

Require structured output keyed by criterion ID.

Example:

```json
{
  "criteria": {
    "backend_experience": {
      "score": 82,
      "reason": "Relevant internship and several backend projects."
    },
    "technical_stack": {
      "score": 91,
      "reason": "Strong overlap with Python, FastAPI and PostgreSQL."
    },
    "motivation": {
      "score": 74,
      "reason": "Relevant but somewhat general."
    }
  }
}
```

Each criterion score is expressed on a common `0–100` scale.

The LLM must not compute the official final score.

## 8. Backend computes the official score

The backend applies deterministic weighting to the AI-generated criterion scores.

Current priority concept:

```text
high   → 3
medium → 2
low    → 1
```

Example:

```text
final_score =
    sum(criterion_score × priority_weight)
    /
    sum(priority_weights)
```

The result remains on a `0–100` scale.

This means:

```text
LLM = criterion-level judgment
Backend = validation, weighting, arithmetic, ranking
Human = final decision
```

Do not let the LLM return an authoritative total score.

## 9. Validate scoring output

Before accepting an evaluation:

- all expected criterion IDs must be present;
- no unknown criterion IDs should be accepted silently;
- each score must be numeric and between 0 and 100;
- required output fields must be present;
- malformed output should move the application into an appropriate review/failure state rather than being silently accepted.

Persist both the final score and the score breakdown.

## 10. Processing states

Use a small, practical set of processing states.

A possible starting point is:

```text
received
normalizing
normalized
scoring
ready
needs_review
failed
```

Do not add more states unless implementation requires them.

`needs_review` is about ambiguity, missing data, low-confidence extraction, or failed validation.

It is not a label for low-scoring candidates.

## 11. Ranking

Ranking is not a separate processing artifact.

Applications can be ranked dynamically using:

```sql
ORDER BY score DESC
```

Unscored applications should remain visible with no score rather than being assigned an artificial zero.

## 12. Candidate/application detail UI contract

The existing detail screen expects the backend to expose enough data for:

```text
Applicant identity
Overall score
Score breakdown
Application facts
Processing / extraction metadata
Source
Confidence / warnings where available
CV/file links where available
```

The UI section currently called the candidate profile should be understood as an application detail view for now.

Avoid introducing extra database models solely to satisfy presentation terminology.

## 13. Main architectural pipeline

```text
                   IMPORT

CSV / JSON
    ↓
parse collection
    ↓
raw submission
    ↓
LLM normalize
    ↓
validate
    ↓
Application persisted


                 EVALUATION

Application.normalized_data
          +
Program.scoring_config
          ↓
      LLM scoring
          ↓
validate criterion scores
          ↓
backend applies priority weights
          ↓
final score + breakdown
          ↓
persist
          ↓
ORDER BY score DESC
```

## 14. Implementation guidance

Before writing backend code:

1. Propose the smallest concrete SQLAlchemy/Pydantic model shapes needed for `Program` and `Application`.
2. Propose the exact JSON schema for `Program.scoring_config`.
3. Propose the exact structured output models for normalization and scoring.
4. Identify where background-job boundaries should exist.
5. Point out only genuine contradictions or missing decisions.
6. Do not reopen already-settled product questions without a concrete implementation reason.

Prefer the simplest implementation that preserves these boundaries.