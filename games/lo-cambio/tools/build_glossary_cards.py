#!/usr/bin/env python3
"""Build data/glossary-cards.json from the interview-prep tech glossary source."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections import Counter
from pathlib import Path

GLOSSARY_DIR = Path("/workspace/cambio-interview-onepagers-2026-11-10/glossary")
OUT = Path(__file__).resolve().parent.parent / "data" / "glossary-cards.json"

sys.path.insert(0, str(GLOSSARY_DIR))
from entries import ENTRIES  # noqa: E402

AREA = {
    "id": "ordlista",
    "name": "Ordlista · tech",
    "description": "Technical development glossary (term, abbreviation, Swedish dev-talk). Adaptive scored cards.",
    "level": 1,
    "defaultOn": True,
    "decisions": [],
}

# Explicit difficulty. Common interview/everyday terms stay low; niche terms go high.
D1 = {
    "API", "PR", "LLM", "Eval", "AI", "Git", "JSON", "HTTP", "HTTPS", "SQL",
    "CLI", "IDE", "Commit", "Branch", "Merge", "Build", "Cache", "REST",
    "Prompt", "Library", "Framework", "Open source", "Rollback", "Hotfix",
    "Release", "Logging", "Unit test", "Refactor", "Feature flag", "Code review",
    "Sprint", "Agile", "Backlog", "User story", "Scrum", "Issue", "CI/CD",
    "CRUD", "XML", "YAML", "Endpoint", "Exception", "Mock", "Schema", "Query",
    "Backup", "Test set", "Frontend", "Backend", "Debug", "Client", "Server",
    "Password", "Cookie", "Browser", "Repository", "Main", "Patch", "Secret",
    "Session", "Timeout", "Retry", "Regression", "Smoke test", "Integration test",
    "Acceptance test", "Acceptance criteria", "Blocker", "Dependency", "Interface",
    "Package manager", "Stack trace", "Webhook", "Changelog", "Documentation",
    "OpenAPI", "SDK", "TypeScript", "Machine learning", "Token (LLM)", "Hallucination",
    "Deploy", "Pipeline", "Version control",
}
D2 = {
    "2FA", "MFA", "JWT", "OAuth 2.0", "GDPR", "PII", "TLS", "SSO", "RBAC",
    "AWS", "Azure", "GCP", "JSON Schema", "API key", "API gateway", "API versioning",
    "AuthN", "AuthZ", "Access token", "Refresh token",
    "Encryption at rest", "Encryption in transit", "Fail closed", "Fail open",
    "Masking", "Redaction", "Golden set", "Ground truth", "Baseline", "Benchmark",
    "Accuracy", "Precision", "Recall", "F1", "Human review", "Local model",
    "Prompt engineering", "Prompt template", "System prompt",
    "Copilot", "Cursor", "Codex", "Claude Code", "Grok Build", "OpenCode", "Ollama",
    "Agent", "AI-assisted coding", "Agent mode",
    "Sprint planning", "Stand-up", "Retrospective", "Product Owner", "Stakeholder",
    "Tech debt", "WIP", "MVP", "PoC", "Prototype", "Pair programming", "Kanban",
    "Epic", "Roadmap", "Container", "Image", "VM", "Load balancer", "Health check",
    "Rate limit", "SQL injection", "XSS", "CORS", "Input validation", "Least privilege",
    "Data pipeline", "ETL", "Migration", "Primary key", "Foreign key", "Transaction",
    "ORM", "NoSQL", "Environment variable", "Rebase", "SemVer", "Breaking change",
    "Runtime", "GraphQL", "Latency", "Throughput", "Availability", "Uptime",
    "Observability", "On-call", "Incident", "Incident response", "Postmortem",
    "Root cause analysis", "Runbook", "Microservice", "Monolith", "CDN", "Firewall",
    "Vulnerability", "Penetration test", "Threat model", "Hashing",
    "IdP", "OIDC", "SAML", "Eval harness", "Embedding", "Fine-tuning", "Inference",
    "Temperature", "Few-shot", "Zero-shot", "Chain-of-thought", "Function calling",
    "Tool calling", "RAG", "Grounding", "Guardrails", "Jailbreak", "Prompt injection",
    "Synthetic data", "A/B test", "KPI", "OKR", "TDD", "Flaky test", "Linting",
    "IaC", "SaaS", "PaaS", "IaaS", "Kubernetes", "Helm", "Terraform",
    "Async", "Retry", "Exponential backoff", "Circuit breaker",
    "OCR", "NLP", "GPT", "Transformer", "False positive", "False negative",
    "Overfitting", "Privacy by design", "Data minimisation", "Audit trail",
    "EHR", "EPJ", "FHIR", "HL7", "MCP", "Token (auth)", "Secret management",
    "OWASP", "OWASP Top 10", "SAST", "DAST", "Zero trust", "Kafka",
    "CDC", "Soft delete", "Batch processing", "Feature flag",
    "Blue-green deployment", "Canary release", "Horizontal scaling",
    "Vertical scaling", "High availability", "Message queue", "Pub/sub",
    "WebSocket", "TypeScript", "OpenAPI", "SDK", "SQL injection",
}
D4 = {
    "Idempotency", "SLO", "SLA", "SLI", "Anonymisation", "CAP theorem",
    "Event sourcing", "Eventual consistency", "Saga pattern", "CQRS",
    "mTLS", "ABAC", "PKI", "SIEM", "HSM", "PAM", "KMS",
    "BM25", "ANN", "RLHF", "Quantization", "Instruction tuning",
    "Top-k", "Top-p", "Attention", "Autoregressive",
    "DICOM", "HL7 v2", "FHIR resource", "openEHR", "Integration engine",
    "MTTR", "RTO", "RPO", "Sidecar", "Service mesh",
    "CORS", "HNSW",  # HNSW is more 5; override below
    "Exactly-once delivery", "Outbox pattern",
    "ISO 27001", "SOC 2", "EU AI Act", "NIS2",
    "PEFT", "KV cache", "Greedy decoding",
    "IHE", "SMART on FHIR", "SNOMED CT", "Terminology server",
    "Inter-annotator agreement", "HOTL",
    "Bounded context", "Modular monolith", "Loose coupling",
    "12-factor app", "Bicep", "Availability zone",
    "Entra ID", "Service principal", "VPC",
    "WAF", "HSM", "PAM",
    "LangChain", "LlamaIndex", "Hybrid search", "Reranking",
    "Index (vector)", "Vector database", "Similarity search",
    "LLM-as-judge", "HITL", "HOTL",
    "Memorization", "Red teaming",
    "Data lineage", "Data lake", "Data catalogue", "Data contract",
    "Schema registry", "Feature store",
    "ACID", "Sharding", "Event-driven",
    "Blue-green deployment", "Canary release", "Rolling update",
    "Circuit breaker", "Bulkhead", "Sidecar",
    "gRPC", "RPC", "Reverse proxy",
    "MTBF", "MTTR",
    "MDR", "SaMD", "MDCG",
    "Idempotency",
}
D5 = {
    "LoRA", "PEFT", "HNSW", "Pseudonymisation", "MDCG", "MDR",
    "HOTL", "KV cache", "Greedy decoding", "SMART on FHIR", "SNOMED CT",
    "IHE", "Terminology server", "Inter-annotator agreement",
    "Outbox pattern", "Exactly-once delivery", "MTBF", "RPO", "RTO",
    "HSM", "PAM", "NIS2", "Saga pattern",
    "ABAC", "mTLS",
}

D4 |= {"HNSW"}  # listed in both; D5 wins below
# Ensure user-cited pairs
D5 |= {"LoRA", "Pseudonymisation"}
D4 |= {"Idempotency", "SLO", "SLA", "Anonymisation"}


def slug(s: str) -> str:
    s = s.strip().lower().replace("+", "plus").replace("#", "sharp")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "x"


def first_part(meaning: str) -> str:
    m = (meaning or "").strip()
    if not m:
        return ""
    for sep in (". ", "; ", " — ", " – "):
        if sep in m:
            part = m.split(sep, 1)[0].strip()
            if len(part) >= 18:
                if sep == ". " and not part.endswith("."):
                    part += "."
                return part
    if len(m) <= 110:
        return m
    cut = m[:110]
    if " " in cut:
        cut = cut.rsplit(" ", 1)[0]
    return cut + "…"


def rng(seed: str):
    n = int.from_bytes(hashlib.sha256(seed.encode("utf-8")).digest()[:8], "big")

    def rnd() -> float:
        nonlocal n
        n = (n * 6364136223846793005 + 1) & ((1 << 64) - 1)
        return n / float(1 << 64)

    return rnd


def pick_n(items, n, seed):
    items = list(items)
    r = rng(seed)
    for i in range(len(items) - 1, 0, -1):
        j = int(r() * (i + 1))
        items[i], items[j] = items[j], items[i]
    return items[:n]


def looks_like_abbrev(term: str, exp: str) -> bool:
    if not (exp or "").strip():
        return False
    t, e = term.strip(), exp.strip()
    tn = re.sub(r"[^a-z0-9]", "", t.lower())
    en = re.sub(r"[^a-z0-9]", "", e.lower())
    if not tn or tn == en:
        return False
    if tn.replace("s", "z") == en.replace("s", "z"):
        return False
    if tn.replace("isation", "ization") == en.replace("isation", "ization"):
        return False
    letters = re.sub(r"[^A-Za-z0-9+/]", "", t)
    if t in {"CI/CD", "PR", "AI", ".NET", "A/B test"}:
        return True
    if letters.isupper() and 2 <= len(letters) <= 8:
        return True
    if len(t) <= 6 and len(e) >= len(t) + 8 and e[0].isupper():
        return True
    return False


def difficulty(term: str, tags: list[str], meaning: str) -> int:
    if term in D5:
        return 5
    if term in D1:
        return 1
    if term in D4:
        return 4
    if term in D2:
        return 2
    score = 3
    tagset = set(tags)
    if "health" in tagset:
        score = 4
    low = (term + " " + meaning).lower()
    niche = (
        "idempoten", "lora", "peft", "hnsw", "bm25", "mtls", "bulkhead",
        "saga ", "outbox", "merkle", "quantiz", "nucleus", "self-attention",
        "kv cache", "hotl", "smart on", "snomed", "ihe", "mdcg", "samd",
        "mtbf", "rpo", "rto", "sidecar", "service mesh", "abac", "hsm",
        "pam ", "siem", "pseudonym", "sli", "slo", "cap theorem",
        "event sourcing", "exactly-once", "inter-annotator", "instruction tun",
        "autoregressive", "greedy decoding", "top-k", "top-p", "bounded context",
        "parameter-efficient", "hierarchical navigable",
    )
    if any(k in low for k in niche) or any(k in term.lower() for k in niche):
        score = max(score, 4)
        if term in {"LoRA", "Pseudonymisation", "HNSW", "HOTL", "MDCG"}:
            score = 5
    return max(1, min(5, score))


def opt(cid, choices):
    return [{"label": lab, "pref": "cam:gl:%s:%s" % (cid, val), "value": val} for lab, val in choices]


def build():
    rows = list(ENTRIES)
    if len(rows) != 505:
        raise SystemExit("expected 505 glossary entries, got %d" % len(rows))
    by_tag = {}
    for row in rows:
        for t in row[4]:
            by_tag.setdefault(t, []).append(row)

    cards = []
    used_ids = set()
    type_counts = Counter()

    for term, exp, meaning, sv, tags in rows:
        if not meaning.strip():
            raise SystemExit("empty meaning for %r" % term)
        cid = "gl-" + slug(term)
        base = cid
        n = 2
        while cid in used_ids:
            cid = "%s-%d" % (base, n)
            n += 1
        used_ids.add(cid)
        can_abbr = looks_like_abbrev(term, exp)
        types = ["term_meaning", "meaning_term", "sv"]
        if can_abbr:
            types.append("abbrev")
        kind = types[int(rng(term)() * len(types))]
        type_counts[kind] += 1
        diff = difficulty(term, tags, meaning)
        hint = first_part(meaning)
        theme = [r for r in rows if r[0] != term and set(tags) & set(r[4])]
        if len(theme) < 8:
            theme = [r for r in rows if r[0] != term]

        if kind == "term_meaning":
            prompt = "What does “%s” mean?" % term
            reword = "Vad betyder %s?" % term
            correct_lab = meaning
            pool = [(r[0], r[2]) for r in theme if r[2].strip() and r[2].strip() != meaning]
            distractors = pick_n(pool, 3, "tm:" + term)
            choices = [(correct_lab, "ok")] + [(lab, slug(nm) or "x") for nm, lab in distractors]
            aliases = [term] + ([exp] if exp else [])
        elif kind == "meaning_term":
            prompt = "Which term matches this meaning?\n%s" % meaning
            reword = "Vilken term passar den här beskrivningen?\n%s" % meaning
            correct_lab = term + ((" (%s)" % exp) if exp and looks_like_abbrev(term, exp) else "")
            pool = [r[0] for r in theme if r[0] != term]
            distractors = pick_n(pool, 3, "mt:" + term)
            choices = [(correct_lab, "ok")] + [(lab, slug(lab) or "x") for lab in distractors]
            aliases = [term] + ([exp] if exp else [])
        elif kind == "abbrev":
            prompt = "What does %s stand for?" % term
            reword = "Vad står %s för?" % term
            correct_lab = exp
            pool = [r[1] for r in theme if r[1].strip() and r[1].strip() != exp and looks_like_abbrev(r[0], r[1])]
            if len(pool) < 3:
                pool = [r[1] for r in rows if r[1].strip() and r[1].strip() != exp]
            distractors = pick_n(pool, 3, "ab:" + term)
            choices = [(correct_lab, "ok")] + [(lab, slug(lab)[:40] or "x") for lab in distractors]
            aliases = [exp, term]
        else:
            prompt = "How do Swedish developers usually say “%s”?" % term
            reword = "Hur säger man ofta «%s» på svensk dev-svenska?" % term
            correct_lab = sv
            pool = [r[3] for r in theme if r[3].strip() and r[3].strip() != sv]
            distractors = pick_n(pool, 3, "sv:" + term)
            choices = [(correct_lab, "ok")] + [(lab, "d%d" % i) for i, lab in enumerate(distractors)]
            aliases = [sv, term] + ([exp] if exp else [])

        if len(choices) < 4:
            raise SystemExit("not enough distractors for %s (%s)" % (term, kind))
        # unique labels
        seen_l = set()
        uniq = []
        for lab, val in choices:
            key = lab.strip().lower()
            if key in seen_l:
                continue
            seen_l.add(key)
            uniq.append((lab, val))
        if uniq[0][1] != "ok":
            raise SystemExit("correct dropped for %s" % term)
        if len(uniq) < 4:
            extra = [r for r in rows if r[0] != term]
            for r in pick_n(extra, 8, "fill:" + term):
                if kind == "term_meaning":
                    lab = r[2]
                elif kind == "meaning_term":
                    lab = r[0]
                elif kind == "abbrev":
                    lab = r[1] or r[0]
                else:
                    lab = r[3]
                key = lab.strip().lower()
                if not lab or key in seen_l:
                    continue
                seen_l.add(key)
                uniq.append((lab, slug(r[0]) or "x"))
                if len(uniq) >= 4:
                    break
        choices = [uniq[0]] + pick_n(uniq[1:], min(3, len(uniq) - 1), "opt:" + term)
        explain = term
        if exp:
            explain += " = " + exp
        explain += " — " + meaning + " / " + sv
        cards.append({
            "id": cid,
            "area": "ordlista",
            "level": 1,
            "difficulty": diff,
            "type": "choice",
            "prompt": prompt,
            "options": opt(cid, choices),
            "correct": "ok",
            "hint": hint,
            "reword": reword,
            "explain": explain,
            "aliases": [a for a in aliases if a],
            "scored": True,
            "adaptive": True,
            "source": "tech-glossary-2026-11-10",
            "glossaryType": kind,
            "tags": list(tags),
        })

    diffs = Counter(c["difficulty"] for c in cards)
    print("glossary cards", len(cards), "by difficulty", dict(sorted(diffs.items())), "types", dict(type_counts))
    if len(cards) != 505:
        raise SystemExit("expected 505 cards, got %d" % len(cards))
    for d in range(1, 6):
        if diffs[d] < 10:
            raise SystemExit("difficulty %d too thin: %d" % (d, diffs[d]))
    blob = json.dumps(cards, ensure_ascii=False)
    for bad in ("Martin Rehn", "martin.rehn", "@cambio.se"):
        if bad.lower() in blob.lower():
            raise SystemExit("redaction failed: %s" % bad)
    doc = {
        "version": 1,
        "note": "Tech glossary cards for Lo · Cambio. One scored card per glossary entry; types mixed.",
        "areas": [AREA],
        "cards": cards,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False) + "\n", encoding="utf-8")
    print("wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    build()
