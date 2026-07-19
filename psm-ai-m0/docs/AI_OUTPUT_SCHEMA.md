# AI Output Schema

```json
{
  "site_name": "Colina Condesa",
  "territory_statement": "string",
  "scores": {
    "water": 0,
    "slope": 0,
    "vegetation": 0,
    "access": 0,
    "development_fit": 0,
    "opportunity": 0
  },
  "signals": [
    {
      "system": "water|slope|vegetation|access|energy|market|zoning",
      "finding": "string",
      "evidence": "string",
      "implication": "string",
      "confidence": 0.0
    }
  ],
  "recommended_project": {
    "type": "string",
    "rationale": ["string"],
    "risks": ["string"]
  }
}
```
