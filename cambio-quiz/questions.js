/* Verified Cambio interview-prep items, v2. Facts from the public demo, the 2026-11-10 briefing, and the skim pack. No invented numbers. */
window.QUIZ_ITEMS = [
  {
    "id": "v-awaiting",
    "level": 1,
    "type": "vocab",
    "term": "awaiting_approval",
    "q": {
      "sv": "Vad betyder statusen awaiting_approval?",
      "en": "What does status awaiting_approval mean?"
    },
    "choices": [
      {
        "sv": "Ett utkast väntar. Det betyder inte att godkännandet redan har startat.",
        "en": "A draft is waiting. It does not mean approval has already started.",
        "ok": true
      },
      {
        "sv": "Godkännandet har redan startat och är på väg att slutföras.",
        "en": "Approval has already started and is about to finish.",
        "ok": false
      },
      {
        "sv": "Svaret är skickat till ett externt ärendesystem.",
        "en": "The reply has been delivered to an external ticketing system.",
        "ok": false
      },
      {
        "sv": "Ärendet är en handoff och kan godkännas som det är.",
        "en": "The case is a handoff and can be approved as-is.",
        "ok": false
      }
    ],
    "why": {
      "sv": "awaiting_approval = ett utkast väntar; en människa ska fortfarande godkänna det.",
      "en": "awaiting_approval means a draft is waiting; a human still has to approve it."
    }
  },
  {
    "id": "v-sent",
    "level": 1,
    "type": "vocab",
    "term": "sent",
    "q": {
      "sv": "Vad betyder sent i demon?",
      "en": "What does sent mean in the demo?"
    },
    "choices": [
      {
        "sv": "Lokal audit-etikett för godkänn eller redigera. Inte leverans till ett ärendesystem.",
        "en": "The local audited label for approve or edit. It is not delivery to a ticketing system.",
        "ok": true
      },
      {
        "sv": "Meddelandet har gått ut till kunden eller vårdenheten.",
        "en": "The message has been delivered to the customer or care unit.",
        "ok": false
      },
      {
        "sv": "Ärendet är stängt i ett FHIR-adapterflöde.",
        "en": "The case has been closed through a FHIR adapter.",
        "ok": false
      },
      {
        "sv": "En live-modell har skickat svaret automatiskt.",
        "en": "A live model has auto-sent the reply.",
        "ok": false
      }
    ],
    "why": {
      "sv": "sent är en lokal etikett. Det finns ingen ticketing-integration, och inget skickas ut.",
      "en": "sent is a local label. There is no ticketing integration, and nothing is delivered outbound."
    }
  },
  {
    "id": "v-godkann",
    "level": 1,
    "type": "vocab",
    "term": "Godkänn",
    "q": {
      "sv": "När är knappen Godkänn aktiv?",
      "en": "When is the Godkänn (approve) button enabled?"
    },
    "choices": [
      {
        "sv": "Bara när ärendet är awaiting_approval. En handoff kan inte godkännas som den är.",
        "en": "Only when the case is awaiting_approval. A handoff cannot be approved as-is.",
        "ok": true
      },
      {
        "sv": "Så fort ett utkast finns, även vid handoff.",
        "en": "As soon as any draft exists, including on a handoff.",
        "ok": false
      },
      {
        "sv": "När sidofältets eval-siffror ser bra ut.",
        "en": "When the sidebar eval numbers look good.",
        "ok": false
      },
      {
        "sv": "När citatet är troget retrievat dokument, oavsett status.",
        "en": "When the citation is faithful to the retrieved document, regardless of status.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Godkänn förblir avstängd om ärendet inte är awaiting_approval.",
      "en": "Godkänn stays disabled unless the case is awaiting_approval."
    }
  },
  {
    "id": "v-inspelat",
    "level": 1,
    "type": "vocab",
    "term": "Inspelat",
    "q": {
      "sv": "Vad är Inspelat-läget?",
      "en": "What is Inspelat mode?"
    },
    "choices": [
      {
        "sv": "Det visar frysta exempel och skickar ingen beslutspost.",
        "en": "It shows frozen examples and does not post a decision.",
        "ok": true
      },
      {
        "sv": "Det spelar upp en live-modell mot samma ärenden.",
        "en": "It replays a live model against the same tickets.",
        "ok": false
      },
      {
        "sv": "Det skickar de frysta svaren till ett ärendesystem.",
        "en": "It sends the frozen replies to a ticketing system.",
        "ok": false
      },
      {
        "sv": "Det är eval-packens live-score i sidofältet.",
        "en": "It is the eval pack’s live score in the sidebar.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Inspelat visar ui/examples.json och postar inget beslut — bra fallback om livesidan strular.",
      "en": "Inspelat shows ui/examples.json and does not post a decision — the fallback if the live page fails."
    }
  },
  {
    "id": "v-handoff",
    "level": 1,
    "type": "vocab",
    "term": "handoff",
    "q": {
      "sv": "När går ett ärende till handoff?",
      "en": "When does a case go to handoff?"
    },
    "choices": [
      {
        "sv": "Bland annat: personnummer/id, patientsäkerhetsformulering, journalfel, modellen avstod eller ogiltig output, modell-föreslagen etikett, låg confidence, inget förankrat utkast, eller plugin-/adapterfel.",
        "en": "Among other things: personnummer/id, patient-safety wording, journalfel, model abstained or invalid output, a model-proposed label, low confidence, no grounded draft, or a plugin/adapter error.",
        "ok": true
      },
      {
        "sv": "Bara när en människa redan har tryckt Godkänn.",
        "en": "Only after a human has already pressed Godkänn.",
        "ok": false
      },
      {
        "sv": "När faithfulness är 100 %, så att svaret kan skickas automatiskt.",
        "en": "When faithfulness is 100%, so the reply can be auto-sent.",
        "ok": false
      },
      {
        "sv": "Enbart när live-modellen är otillgänglig.",
        "en": "Only when the live model is unavailable.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Handoff är den säkra vägen. Godkänn förblir avstängd; ärendet godkänns inte som det är.",
      "en": "Handoff is the fail-safe path. Godkänn stays disabled; the case cannot be approved as-is."
    }
  },
  {
    "id": "v-failclosed",
    "level": 1,
    "type": "vocab",
    "term": "fail closed",
    "q": {
      "sv": "Vad betyder att pipelinen validerar fail closed?",
      "en": "What does validate (fail closed) mean in the pipeline?"
    },
    "choices": [
      {
        "sv": "Ogiltig eller avstådd modelloutput blir handoff, inte ett gissat utkast.",
        "en": "Invalid or abstained model output becomes a handoff, not a guessed draft.",
        "ok": true
      },
      {
        "sv": "Ogiltig output ersätts med modellens bästa gissning så att agenten inte fastnar.",
        "en": "Invalid output is replaced with the model’s best guess so the agent is not stuck.",
        "ok": false
      },
      {
        "sv": "Valideringen hoppas över om confidence är hög.",
        "en": "Validation is skipped when confidence is high.",
        "ok": false
      },
      {
        "sv": "Ett schemafel skickas ändå, men märks i auditen.",
        "en": "A schema error is still sent, but flagged in the audit.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Fail closed = hellre lämna över än att släppa igenom ett ogiltigt utkast.",
      "en": "Fail closed means hand off rather than let an invalid draft through."
    }
  },
  {
    "id": "v-adapter-none",
    "level": 1,
    "type": "vocab",
    "term": "adapter none",
    "q": {
      "sv": "Vilken modelladapter använder demosidan?",
      "en": "Which model adapter does the live demo page use?"
    },
    "choices": [
      {
        "sv": "Adapter none — samma offline-väg som eval-packen. --adapter fake finns på CLI:t och används inte av demosidan.",
        "en": "Adapter none — the same offline path as the evaluation pack. --adapter fake exists on the CLI and is not used by the demo page.",
        "ok": true
      },
      {
        "sv": "En live OpenCode-modell, samma som LIVE-PROBE.",
        "en": "A live OpenCode model, the same one as LIVE-PROBE.",
        "ok": false
      },
      {
        "sv": "--adapter fake, den deterministiska stubben.",
        "en": "--adapter fake, the deterministic stub.",
        "ok": false
      },
      {
        "sv": "En FHIR-adapter mot journalsystemet.",
        "en": "A FHIR adapter against the journal system.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Demosidan och eval-packen kör adapter none. En live-modell ingår inte i de siffrorna.",
      "en": "The demo page and the eval pack use adapter none. A live model is not in those numbers."
    }
  },
  {
    "id": "v-faithful",
    "level": 1,
    "type": "vocab",
    "term": "faithful / citattrohet",
    "q": {
      "sv": "Vad betyder att ett utkast är faithful?",
      "en": "What does “faithful” mean for a draft?"
    },
    "choices": [
      {
        "sv": "Utkastet stämmer med den retrievade artikeln efter maskning. Det betyder inte att artikeln är den rätta.",
        "en": "The draft matches the retrieved article after the mask pass. It does not mean the article is the right one.",
        "ok": true
      },
      {
        "sv": "Artikeln är rätt svar på ärendet, så utkastet kan godkännas rakt av.",
        "en": "The article is the right answer to the ticket, so the draft can be approved as-is.",
        "ok": false
      },
      {
        "sv": "En live-modell har verifierat svaret mot journalen.",
        "en": "A live model has verified the answer against the journal.",
        "ok": false
      },
      {
        "sv": "Faithfulness 100 % innebär att retrieval alltid träffar rätt dokument.",
        "en": "100% faithfulness means retrieval always hit the right document.",
        "ok": false
      }
    ],
    "why": {
      "sv": "ticket-008 är typfallet: troget mot printkö-runbooken, men det är fel artikel. Avvisa det.",
      "en": "ticket-008 is the type case: faithful to the print-queue runbook, but the wrong article. Reject it."
    }
  },
  {
    "id": "v-false-friend",
    "level": 1,
    "type": "vocab",
    "term": "false friend / falsk vän",
    "q": {
      "sv": "Vad är den kända falska vännen i demon?",
      "en": "What is the known false friend in the demo?"
    },
    "choices": [
      {
        "sv": "ticket-008: sparknapp-krasch retrievar printkö-runbooken. Avvisa utkastet.",
        "en": "ticket-008: a save-button crash retrieves the print-queue runbook. Reject the draft.",
        "ok": true
      },
      {
        "sv": "ticket-001: SITHS-inloggning retrievar fel KB-artikel.",
        "en": "ticket-001: a SITHS login issue retrieves the wrong KB article.",
        "ok": false
      },
      {
        "sv": "G-001: patientdata retrievar en klinisk rådgivningsartikel.",
        "en": "G-001: patient data retrieves a clinical-advice article.",
        "ok": false
      },
      {
        "sv": "G-009: avvikelsestatistik klassas felaktigt som incident och godkänns.",
        "en": "G-009: a statistics request is mis-labelled as an incident and approved.",
        "ok": false
      }
    ],
    "why": {
      "sv": "ticket-008 är awaiting_approval med citation KB-002 (printkö). Faithful är inte samma sak som rätt artikel.",
      "en": "ticket-008 is awaiting_approval with citation KB-002 (print queue). Faithful is not the same as the right article."
    }
  },
  {
    "id": "v-mask-tokens",
    "level": 1,
    "type": "vocab",
    "term": "[personnummer-maskat] / [namn-maskat]",
    "q": {
      "sv": "Vad är [personnummer-maskat] och [namn-maskat]?",
      "en": "What are [personnummer-maskat] and [namn-maskat]?"
    },
    "choices": [
      {
        "sv": "Maskningstokens. Skatteverkets testnummer 19121212-1212 blir [personnummer-maskat]; det syntetiska namnet blir [namn-maskat].",
        "en": "Masking tokens. Skatteverket’s test number 19121212-1212 becomes [personnummer-maskat]; the synthetic name becomes [namn-maskat].",
        "ok": true
      },
      {
        "sv": "Etiketter som betyder att ärendet redan är skickat.",
        "en": "Labels meaning the case has already been sent.",
        "ok": false
      },
      {
        "sv": "Citations-id:n till syntetiska KB-artiklar.",
        "en": "Citation ids of synthetic knowledge-base articles.",
        "ok": false
      },
      {
        "sv": "Namn på live-modeller i sidofältet.",
        "en": "Names of live models in the sidebar.",
        "ok": false
      }
    ],
    "why": {
      "sv": "I G-001 ser modellen aldrig numret eller namnet. Maskningen är Luhn-strikt för giltiga personnummer.",
      "en": "In G-001 the model never sees the number or the name. Masking is Luhn-strict for valid personnummer."
    }
  },
  {
    "id": "v-grounded",
    "level": 1,
    "type": "vocab",
    "term": "grounded draft / förankrat utkast",
    "q": {
      "sv": "Vad händer när det saknas ett förankrat utkast (no grounded draft)?",
      "en": "What happens when there is no grounded draft?"
    },
    "choices": [
      {
        "sv": "Ärendet går till handoff. Inget påhittat KB-svar släpps igenom.",
        "en": "The case goes to handoff. No invented KB answer is let through.",
        "ok": true
      },
      {
        "sv": "Modellen får gissa ett svar så att supporten inte fastnar.",
        "en": "The model is allowed to guess an answer so support is not stuck.",
        "ok": false
      },
      {
        "sv": "Utkastet markeras sent och lämnas till auditen.",
        "en": "The draft is marked sent and left to the audit.",
        "ok": false
      },
      {
        "sv": "Godkänn aktiveras så att en människa kan skriva svaret i samma flöde.",
        "en": "Godkänn is enabled so a human can type the answer in the same flow.",
        "ok": false
      }
    ],
    "why": {
      "sv": "G-008 (jämför två vårdepisoder) är typfallet: inte i KB, alltså handoff. Hellre en miss än ett hallucinerat svar.",
      "en": "G-008 (compare two care episodes) is the type case: not in the KB, so handoff. A miss is better than a hallucination."
    }
  },
  {
    "id": "v-journalfel",
    "level": 1,
    "type": "vocab",
    "term": "journalfel / incident_report",
    "q": {
      "sv": "Vad innebär etiketten journalfel i demon?",
      "en": "What does the label journalfel mean in the demo?"
    },
    "choices": [
      {
        "sv": "Den pekar mot incident_report (avvikelse). En incident lämnas alltid över (handoff).",
        "en": "It suggests an incident_report (avvikelse). An incident always hands off.",
        "ok": true
      },
      {
        "sv": "Den skapar ett incidentformulär på demosidan och skickar det.",
        "en": "It opens an incident form on the demo page and sends it.",
        "ok": false
      },
      {
        "sv": "Den är en vanlig support_ticket som kan godkännas som den är.",
        "en": "It is an ordinary support_ticket that can be approved as-is.",
        "ok": false
      },
      {
        "sv": "Den betyder att avvikelsestatistik ska räknas per enhet.",
        "en": "It means unit-level deviation statistics should be computed.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Pluginet finns på API/CLI, men det finns inget incidentformulär på demosidan. Incident = alltid handoff.",
      "en": "The plugin exists on the API/CLI, but there is no incident form on the demo page. An incident always hands off."
    }
  },
  {
    "id": "d-pipeline",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Vilken är pipelinens ordning?",
      "en": "What is the pipeline order?"
    },
    "choices": [
      {
        "sv": "raw ticket → maska PII → regel-först-rutt → högst ett smalt modellsteg → validera (fail closed) → mänskligt godkännande / handoff → audit (JSONL, maskad)",
        "en": "raw ticket → mask PII → rule-first route → at most one narrow model step → validate (fail closed) → human approval / handoff → audit (JSONL, masked)",
        "ok": true
      },
      {
        "sv": "raw ticket → modellsteg → maska PII → godkänn automatiskt → audit",
        "en": "raw ticket → model step → mask PII → auto-approve → audit",
        "ok": false
      },
      {
        "sv": "raw ticket → live-modell → FHIR-export → sent till ärendesystemet",
        "en": "raw ticket → live model → FHIR export → sent to the ticketing system",
        "ok": false
      },
      {
        "sv": "raw ticket → retrieval → auto-send om faithfulness är 100 %",
        "en": "raw ticket → retrieval → auto-send if faithfulness is 100%",
        "ok": false
      }
    ],
    "why": {
      "sv": "Maskning och flera regler körs före eller oberoende av modellen. Inget auto-skickas.",
      "en": "Masking and several rules run before or independently of the model. Nothing is auto-sent."
    }
  },
  {
    "id": "d-g001",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "G-001 (låst miss / hero): vad händer när patientdata finns i ärendet?",
      "en": "G-001 (locked failure / hero): what happens when patient data is in the ticket?"
    },
    "choices": [
      {
        "sv": "Handoff. Modellen ser aldrig numret eller namnet. Godkänn förblir avstängd.",
        "en": "Handoff. The model never sees the number or the name. Godkänn stays disabled.",
        "ok": true
      },
      {
        "sv": "Utkastet går till awaiting_approval så att en människa kan skicka det.",
        "en": "The draft goes to awaiting_approval so a human can send it.",
        "ok": false
      },
      {
        "sv": "Numret maskas efter modellsteget, och svaret skickas.",
        "en": "The number is masked after the model step, and the reply is sent.",
        "ok": false
      },
      {
        "sv": "Live-modellen får se testnumret 19121212-1212 eftersom det är publikt.",
        "en": "The live model may see the test number 19121212-1212 because it is public.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Maskning först. 19121212-1212 blir [personnummer-maskat]. Skäl inkluderar patient_data_detected, model_abstained, low_confidence, no_grounded_draft.",
      "en": "Mask first. 19121212-1212 becomes [personnummer-maskat]. Reasons include patient_data_detected, model_abstained, low_confidence, no_grounded_draft."
    }
  },
  {
    "id": "d-t001",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "ticket-001 (lycklig väg): kan inte logga in på SITHS — vad händer?",
      "en": "ticket-001 (happy path): cannot log in to SITHS — what happens?"
    },
    "choices": [
      {
        "sv": "awaiting_approval, citation opencode-deepseek-v4.1-flash-free:KB-001. En människa ska fortfarande godkänna.",
        "en": "awaiting_approval, citation opencode-deepseek-v4.1-flash-free:KB-001. A person still has to approve it.",
        "ok": true
      },
      {
        "sv": "Svaret markeras sent och levereras automatiskt.",
        "en": "The reply is marked sent and delivered automatically.",
        "ok": false
      },
      {
        "sv": "Handoff, eftersom inloggningsärenden alltid lämnas över.",
        "en": "Handoff, because login tickets always hand off.",
        "ok": false
      },
      {
        "sv": "Retrievat dokument är printkö-runbooken, så utkastet ska avvisas.",
        "en": "The retrieved document is the print-queue runbook, so the draft should be rejected.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Det här är den lyckliga vägen: ett förankrat utkast väntar. Inget skickas förrän någon trycker Godkänn.",
      "en": "This is the happy path: a grounded draft is waiting. Nothing is sent until someone presses Godkänn."
    }
  },
  {
    "id": "d-t008",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "ticket-008 (falsk vän): sparknapp-krasch — vad gör du?",
      "en": "ticket-008 (false friend): save-button crash — what do you do?"
    },
    "choices": [
      {
        "sv": "Status är awaiting_approval, men artikeln är printkö-runbooken (KB-002). Avvisa det.",
        "en": "Status is awaiting_approval, but the article is the print-queue runbook (KB-002). Reject it.",
        "ok": true
      },
      {
        "sv": "Godkänn, eftersom faithfulness är 100 % och status är awaiting_approval.",
        "en": "Approve it, because faithfulness is 100% and status is awaiting_approval.",
        "ok": false
      },
      {
        "sv": "Det är en handoff; Godkänn är ändå avstängd.",
        "en": "It is a handoff; Godkänn is disabled anyway.",
        "ok": false
      },
      {
        "sv": "Citations-id:t är en live-modellkörning som redan har verifierat svaret.",
        "en": "The citation id is a live model call that already verified the answer.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Faithful betyder att utkastet följer den retrievade artikeln — inte att artikeln är rätt. Avvisa.",
      "en": "Faithful means the draft follows the retrieved article — not that the article is the right one. Reject it."
    }
  },
  {
    "id": "d-eval-size",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Eval-packen: storlek, adapter, upprepningar?",
      "en": "Eval pack: size, adapter, repeats?"
    },
    "choices": [
      {
        "sv": "Adapter none på 44 syntetiska ärenden (30 support + 14 gap), 3 identiska upprepningar. En live-modell ingår inte i siffrorna.",
        "en": "Adapter none on 44 synthetic tickets (30 support + 14 gap), 3 identical repeats. A live model is not in these numbers.",
        "ok": true
      },
      {
        "sv": "En live-modell på 44 produktionsärenden, en körning.",
        "en": "A live model on 44 production tickets, one run.",
        "ok": false
      },
      {
        "sv": "Adapter fake på 30 supportärenden, utan upprepningar.",
        "en": "Adapter fake on 30 support tickets, with no repeats.",
        "ok": false
      },
      {
        "sv": "44 ärenden mot riktiga patientjournaler, tre upprepningar.",
        "en": "44 tickets against real patient records, three repeats.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Offentlig fil: docs/EVAL-2026-11-08.md. All data är syntetisk. Sidofältet är inte en live-score.",
      "en": "Public file: docs/EVAL-2026-11-08.md. All data is synthetic. The sidebar is not a live-model score."
    }
  },
  {
    "id": "d-handoff-rate",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Vad är handoff-andelen, och hur många väntar på godkännande?",
      "en": "What is the handoff rate, and how many await approval?"
    },
    "choices": [
      {
        "sv": "Handoff 88,6 % (39 av 44). Väntar på mänskligt godkännande: 5.",
        "en": "Handoff rate 88.6% (39 of 44). Awaiting a human approval: 5.",
        "ok": true
      },
      {
        "sv": "Handoff 50 % (22 av 44). Väntar på godkännande: 22.",
        "en": "Handoff rate 50% (22 of 44). Awaiting approval: 22.",
        "ok": false
      },
      {
        "sv": "Handoff 100 %. Ingen väntar på godkännande.",
        "en": "Handoff rate 100%. None await approval.",
        "ok": false
      },
      {
        "sv": "Handoff 12 av 44. Väntar på godkännande: 32.",
        "en": "Handoff 12 of 44. Awaiting approval: 32.",
        "ok": false
      }
    ],
    "why": {
      "sv": "39 av 44 lämnas över; 5 utkast väntar. Hög handoff-andel är avsiktlig på den här syntetiska uppsättningen.",
      "en": "39 of 44 hand off; 5 drafts are waiting. A high handoff rate is intentional on this synthetic set."
    }
  },
  {
    "id": "d-schema-audit",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Eval-packen: schema, audit och upprepningar?",
      "en": "Eval pack: schema, audit and repeats?"
    },
    "choices": [
      {
        "sv": "Schema-giltiga kuvert: 100 %. Audit “decided” matchar kuvertet: 100 %. Incident-kedja schema-pass: 100 % av 4. Avvikande upprepningar: 0.",
        "en": "Schema-valid envelopes: 100%. Audit “decided” matches the envelope: 100%. Incident chain schema-pass: 100% of 4. Repeat mismatches: 0.",
        "ok": true
      },
      {
        "sv": "Schema 92 %. Audit matchar ibland. Flera upprepningar avviker.",
        "en": "Schema 92%. Audit sometimes matches. Several repeats diverge.",
        "ok": false
      },
      {
        "sv": "Schema 100 %, men auditen loggar bara live-modellen.",
        "en": "Schema 100%, but the audit only logs the live model.",
        "ok": false
      },
      {
        "sv": "Incident-kedjan saknas i eval-packen.",
        "en": "The incident chain is missing from the eval pack.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Det här är offline-siffror på adapter none, inte en live-modellscore.",
      "en": "These are offline figures on adapter none, not a live-model score."
    }
  },
  {
    "id": "d-patient-human",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Hur går patientdata- och needs_human-ärendena?",
      "en": "How do the patient-data and needs_human cases do?"
    },
    "choices": [
      {
        "sv": "Patientdata som lämnas över: 100 % av 8. needs_human som lämnas över: 100 % av 8.",
        "en": "Patient-data cases that hand off: 100% of 8. needs_human cases that hand off: 100% of 8.",
        "ok": true
      },
      {
        "sv": "6 av 8 patientdata lämnas över; 2 släpps igenom med maskat utkast.",
        "en": "6 of 8 patient-data cases hand off; 2 go through with a masked draft.",
        "ok": false
      },
      {
        "sv": "needs_human godkänns automatiskt när faithfulness är 100 %.",
        "en": "needs_human is auto-approved when faithfulness is 100%.",
        "ok": false
      },
      {
        "sv": "Siffrorna kommer från live-proben, inte från eval-packen.",
        "en": "These figures come from the live probe, not from the eval pack.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Alla 8+8 lämnas över i den offline eval-packen. Citera inte en flakiness-siffra utöver den lilla live-proben.",
      "en": "All 8+8 hand off in the offline eval pack. Do not quote a flakiness rate beyond the small live probe."
    }
  },
  {
    "id": "d-retrieval",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Retrieval, faithfulness och recall i eval-packen?",
      "en": "Retrieval, faithfulness and recall in the eval pack?"
    },
    "choices": [
      {
        "sv": "Retrieval-träffar: 13 av 44. Citattrohet: 100 % av 12 citerade utkast. Citation recall: 100 % av 12 retrievade, icke-journalfel-ärenden.",
        "en": "Retrieval hits: 13 of 44. Citation faithfulness: 100% of 12 cited drafts. Citation recall: 100% of 12 retrieved, non-journalfel tickets.",
        "ok": true
      },
      {
        "sv": "Retrieval träffar 44 av 44, eftersom token-överlapp alltid hittar rätt artikel.",
        "en": "Retrieval hits 44 of 44, because token overlap always finds the right document.",
        "ok": false
      },
      {
        "sv": "Faithfulness 100 % betyder att alla 13 träffar var rätt artikel.",
        "en": "100% faithfulness means all 13 hits were the right article.",
        "ok": false
      },
      {
        "sv": "Recall räknar även journalfel-ärenden och retrieval-missar.",
        "en": "Recall also counts journalfel tickets and retrieval misses.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Faithfulness = utkastet följer retrievat dokument efter maskning. Recall hoppar över missar och journalfel. Retrieval är enkel token-överlapp, inte en neural ranker.",
      "en": "Faithfulness = the draft follows the retrieved document after masking. Recall skips misses and journalfel. Retrieval is simple token overlap, not a neural ranker."
    }
  },
  {
    "id": "d-tests",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Vad rapporterar den publika testsviten?",
      "en": "What does the public test suite report?"
    },
    "choices": [
      {
        "sv": "137 godkända, 10 xfailed. xfail är avsiktliga: Luhn-ogiltiga personnummer skrivs inte om, men tvingar ändå handoff.",
        "en": "137 passed, 10 xfailed. The xfails are deliberate: Luhn-invalid personnummer are not rewritten and still force a handoff.",
        "ok": true
      },
      {
        "sv": "147 godkända, inga xfail.",
        "en": "147 passed, no xfails.",
        "ok": false
      },
      {
        "sv": "137 godkända, 10 riktiga fail som fortfarande är öppna buggar.",
        "en": "137 passed, 10 real failures that are still open bugs.",
        "ok": false
      },
      {
        "sv": "137 godkända; xfail gäller bara förnamn som slinker igenom.",
        "en": "137 passed; the xfails are about bare given names that slip through.",
        "ok": false
      }
    ],
    "why": {
      "sv": "De 10 xfail är G-003-klassen (Luhn-ogiltiga id:n syns kvar, men ärendet lämnas över). Bare förnamn är en annan känd lucka, inte xfail-sviten.",
      "en": "The 10 xfails are the G-003 class (Luhn-invalid ids stay visible, but the case still hands off). Bare given names are a separate known gap, not that xfail suite."
    }
  },
  {
    "id": "d-g003",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "G-003: vad visar det Luhn-ogiltiga exemplet?",
      "en": "G-003: what does the Luhn-invalid example show?"
    },
    "choices": [
      {
        "sv": "Ett Luhn-ogiltigt samordningsnummer i patientkontext lämnas ändå över, och numret syns kvar (avsiktlig lucka). Det intilliggande syntetiska namnet maskas.",
        "en": "A Luhn-invalid samordningsnummer in patient context still hands off, and the number stays visible (deliberate gap). The adjacent synthetic name is masked.",
        "ok": true
      },
      {
        "sv": "Det ogiltiga numret godkänns och skickas, eftersom Luhn misslyckas.",
        "en": "The invalid number is approved and sent, because the Luhn check failed.",
        "ok": false
      },
      {
        "sv": "Numret skrivs om till [personnummer-maskat] precis som ett giltigt nummer.",
        "en": "The number is rewritten to [personnummer-maskat] just like a valid number.",
        "ok": false
      },
      {
        "sv": "Bara namnet syns kvar; numret maskas alltid.",
        "en": "Only the name stays visible; the number is always masked.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Avsiktlig lucka, inte en tyst godkänd väg. De 10 xfail tillhör den här klassen. Namnet intill maskas.",
      "en": "A deliberate gap, not a silent approve path. The 10 xfails belong to this class. The adjacent name is masked."
    }
  },
  {
    "id": "d-g008-g009",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "G-008 och G-009: vad blir utfallet?",
      "en": "G-008 and G-009: what is the outcome?"
    },
    "choices": [
      {
        "sv": "G-008 (jämför två vårdepisoder) är inte i KB → handoff. G-009 (avvikelsestatistik) är en instruktion, inte en incident; regler hoppar över modellen; ingen KB-träff → handoff med no_grounded_draft.",
        "en": "G-008 (compare two care episodes) is not in the KB → handoff. G-009 (avvikelsestatistik) is an instruction, not an incident; rules skip the model; no KB hit → handoff with no_grounded_draft.",
        "ok": true
      },
      {
        "sv": "G-008 får ett påhittat KB-svar. G-009 behandlas som incident_report och öppnar ett formulär.",
        "en": "G-008 gets an invented KB answer. G-009 is treated as an incident_report and opens a form.",
        "ok": false
      },
      {
        "sv": "Båda går till awaiting_approval med trogna utkast.",
        "en": "Both go to awaiting_approval with faithful drafts.",
        "ok": false
      },
      {
        "sv": "Ordet avvikelse i G-009 tvingar alltid en incidentrapport.",
        "en": "The word avvikelse in G-009 always forces an incident report.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Inget påhittat KB-svar på G-008. Ordet avvikelse får inte kapa en statistikförfrågan.",
      "en": "No invented KB answer on G-008. The word avvikelse must not steal a statistics request."
    }
  },
  {
    "id": "d-sidebar-limitations",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Vilket påstående om demon är sant?",
      "en": "Which statement about the demo is true?"
    },
    "choices": [
      {
        "sv": "Sidofältet upprepar den offline eval-packen. sent är lokalt. Det finns inget incidentformulär på sidan. Audit/results i demo-API:t ligger i minnet.",
        "en": "The sidebar repeats the offline eval pack. sent is local. There is no incident form on the page. Demo API audit/results are in-memory.",
        "ok": true
      },
      {
        "sv": "Sidofältet är en live-modellscore, och sent betyder att svaret levererats.",
        "en": "The sidebar is a live-model score, and sent means the reply was delivered.",
        "ok": false
      },
      {
        "sv": "Demosidan har ett incidentformulär och en FHIR/openEHR-adapter.",
        "en": "The demo page has an incident form and a FHIR/openEHR adapter.",
        "ok": false
      },
      {
        "sv": "Citationer som opencode-deepseek-v4.1-flash-free:KB-001 är live-anrop under demon.",
        "en": "Citation strings such as opencode-deepseek-v4.1-flash-free:KB-001 are live model calls during the demo.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Citations-id:n är namn på syntetiska KB-artiklar, inte ett live-anrop. Inget FHIR-anspråk. Inget auto-utskick.",
      "en": "Citation ids name synthetic KB articles, not a live call. No FHIR claim. Nothing is auto-sent."
    }
  },
  {
    "id": "d-name-gap",
    "level": 2,
    "type": "demo",
    "q": {
      "sv": "Vilken är den kända luckan i namnmaskningen?",
      "en": "What is the known name-masking gap?"
    },
    "choices": [
      {
        "sv": "Ett bart förnamn utan snedstreck, titel/roll eller efternamn (t.ex. “Hej Mikael,”) kan fortfarande synas. Signaturer som /Mikael och platshållaren “patient X” maskas.",
        "en": "A bare given name with no slash, title/role cue or surname (for example “Hej Mikael,”) can still appear. Slash signatures (/Mikael) and the placeholder “patient X” are masked.",
        "ok": true
      },
      {
        "sv": "Inga namn maskas i pipelinen.",
        "en": "No names are masked in the pipeline.",
        "ok": false
      },
      {
        "sv": "Alla förnamn maskas, inklusive “Hej Mikael,”.",
        "en": "All given names are masked, including “Hej Mikael,”.",
        "ok": false
      },
      {
        "sv": "Luckan är att Luhn-giltiga personnummer lämnas synliga.",
        "en": "The gap is that Luhn-valid personnummer are left visible.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Säg inte bara “namn maskas” om du får frågan live — nämn den här preciseringen. Maskning är portad från arende-triage.",
      "en": "Do not just say “names are masked” if asked live — add this caveat. Masking is ported from arende-triage."
    }
  },
  {
    "id": "h-joined",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Hur skulle du jobba om du började på Cambio?",
      "en": "How would you work if you joined Cambio?"
    },
    "choices": [
      {
        "sv": "Sätta mig med kollegor, välja ett smärtsamt internt flöde, prototypa ett litet verktyg och lägga in utvärdering och godkännande redan i första versionen.",
        "en": "Sit with colleagues, pick a painful internal workflow, prototype a small tool, and put evaluation and approval in from the first version.",
        "ok": true
      },
      {
        "sv": "Börja med att koppla en modell till journalen, så att nyttan syns snabbt.",
        "en": "Start by wiring a model into the journal, so the value shows up quickly.",
        "ok": false
      },
      {
        "sv": "Bygga klart verktyget först och lägga till utvärdering och mänsklig grind i en senare hårdning.",
        "en": "Finish the tool first and add evaluation and a human gate in a later hardening pass.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Möt-välj-prototypa-eval från v0. Inte klinisk AI i månad ett, och inte hårdning i efterhand.",
      "en": "Sit, pick, prototype, and put eval in from v0. Not clinical AI in month one, and not hardening later."
    }
  },
  {
    "id": "h-wrote",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "“Hur mycket av demon skrev du själv?”",
      "en": "“How much of the demo did you write yourself?”"
    },
    "choices": [
      {
        "sv": "Jag styrde arbetet: scope, säkerhetsgrindar, utvärderingar, granskade diffar, valde vad som skulle behållas och verifierade testerna och de fyra frysta exemplen. Agenter skrev merparten av koden.",
        "en": "I directed the work: scope, safety gates, evaluations, reviewed diffs, decided what to keep, and verified the test suite and the four frozen examples. Agents wrote most of the code.",
        "ok": true
      },
      {
        "sv": "Jag skrev merparten av koden för hand, agenterna hjälpte bara till med kommentarer.",
        "en": "I hand-wrote most of the code; the agents only helped with comments.",
        "ok": false
      },
      {
        "sv": "Jag promptade och skeppade det som kom tillbaka, utan att granska diffar.",
        "en": "I prompted and shipped whatever came back, without reviewing diffs.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ärlig director/reviewer/verifier-ram. Nämn Codex, OpenCode, Grok Build, Cursor och lokala modeller; Grok Bot orkestrerade.",
      "en": "Honest director/reviewer/verifier framing. Name Codex, OpenCode, Grok Build, Cursor and local models; Grok Bot orchestrated."
    }
  },
  {
    "id": "h-verify",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Hur verifierar du det en agent tar fram?",
      "en": "How do you verify what an agent produces?"
    },
    "choices": [
      {
        "sv": "Tester, JSON-scheman, golden labels och eval-upprepningar först; sedan en mänsklig grind för allt som liknar ett beslut.",
        "en": "Tests, JSON schemas, golden labels and eval repeats first; then a human gate for anything that looks like a decision.",
        "ok": true
      },
      {
        "sv": "Jag läser koden en gång och litar på modellen om den låter säker.",
        "en": "I read the code once and trust the model if it sounds confident.",
        "ok": false
      },
      {
        "sv": "Jag kollar bara när något ser uppenbart fel ut.",
        "en": "I only check when something looks obviously off.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Mät först, beslutsgrind sen. Samma vana som i support-copilot-demon.",
      "en": "Measure first, then a decision gate. The same habit as in the support-copilot demo."
    }
  },
  {
    "id": "h-tools",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Vilka verktyg kan du nämna — och hur ramar du Claude Code?",
      "en": "Which tools can you name — and how do you frame Claude Code?"
    },
    "choices": [
      {
        "sv": "Codex, OpenCode, Grok Build, Cursor och lokala modeller (Ollama). Grok Bot orkestrerade demon. Claude Code: lätt hands-on plus jämförbara verktyg, så hög tilltro att jag kan använda det — inte att jag främst använder Claude Code.",
        "en": "Codex, OpenCode, Grok Build, Cursor and local models (Ollama). Grok Bot orchestrated the demo. Claude Code: light hands-on plus comparable tools, so high confidence I can use it — not that I mainly use Claude Code.",
        "ok": true
      },
      {
        "sv": "Jag använder främst Claude Code, de andra är bara namn jag känner till.",
        "en": "I mainly use Claude Code; the others are just names I know.",
        "ok": false
      },
      {
        "sv": "Jag har bara använt ChatGPT i webbläsaren, så Claude Code skulle ta lång tid att lära.",
        "en": "I have only used ChatGPT in the browser, so Claude Code would take a long time to learn.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nämn den dagliga verktygslådan först. Överskatta inte Claude Code, men tona inte heller ner överföringen.",
      "en": "Name the daily toolbox first. Do not overclaim Claude Code, and do not undersell the transfer."
    }
  },
  {
    "id": "h-experience",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Hur beskriver du din erfarenhet om de frågar?",
      "en": "How do you state your experience if they ask?"
    },
    "choices": [
      {
        "sv": "Cirka två års öppen källkod och självstyrt arbete sedan oktober 2024. Betald frilans: mindre än ett år. Ingen heltidsroll som mjukvaruutvecklare ännu — därför passar en associate-roll med coachning.",
        "en": "About two years of open-source and self-directed work since October 2024. Paid freelance: less than one year. No full-time professional software-developer role yet — that is why an associate role with coaching appeals.",
        "ok": true
      },
      {
        "sv": "Jag har varit professionell mjukvaruutvecklare i ungefär två år, med flera betalda kunder.",
        "en": "I have been a professional software developer for about two years, with several paying clients.",
        "ok": false
      },
      {
        "sv": "Jag har ingen kodvana att visa; certifikaten är det enda jag har.",
        "en": "I have no coding practice to show; the certifications are all I have.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Hitta inte på kunder eller leveranser. Två år är självstyrt arbete, inte en dold heltidsroll.",
      "en": "Do not invent clients or deliverables. The two years are self-directed work, not a hidden full-time role."
    }
  },
  {
    "id": "h-typescript",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "TypeScript: vad har ändrats sedan ansökan?",
      "en": "TypeScript: what changed since the application?"
    },
    "choices": [
      {
        "sv": "Ansökan sa “TypeScript limited”, vilket stämde då. Den 9 november 2026 tog jag TypeScript Fundamentals 242/242, som del av Front-End Development Libraries (524/524 steg den dagen, kursens exam återstår). Det är inte ett 17:e certifikat.",
        "en": "The application said “TypeScript limited,” which was fair then. On 9 November 2026 I completed TypeScript Fundamentals 242/242, as part of Front-End Development Libraries (524/524 steps that day, course exam remaining). This is not a 17th certification.",
        "ok": true
      },
      {
        "sv": "Jag har nu ett 17:e certifikat i TypeScript och kan släppa reservationen.",
        "en": "I now have a 17th TypeScript certification and can drop the caveat.",
        "ok": false
      },
      {
        "sv": "Läget är oförändrat: ingen TypeScript-övning sedan ansökan.",
        "en": "Nothing has changed: no TypeScript practice since the application.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Uppdatera ärligt, men räkna inte det som ett nytt FCC-certifikat. Exam på kursen återstår.",
      "en": "Update honestly, but do not count this as a new FCC certification. The course exam is still remaining."
    }
  },
  {
    "id": "h-nursing",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Hur nämner du Uppsala-poängen och vårdutbildningen?",
      "en": "How do you mention the Uppsala ECTS / nursing coursework?"
    },
    "choices": [
      {
        "sv": "Kort och sekundärt: ungefär 74 ECTS vid Uppsala universitet (2019–2020), varav ungefär två terminer på sjuksköterskeprogrammet. Bakgrund, inte ett påstående att jag är sjuksköterska eller har en dataexamen. Det stod inte i Cambio-CV:t.",
        "en": "Brief and secondary: about 74 ECTS at Uppsala University (2019–2020), including about two semesters of nursing-programme coursework. Background, not a claim that I am a nurse or that I have a computer-science degree. It was not in the Cambio CV.",
        "ok": true
      },
      {
        "sv": "Jag är sjuksköterska, och jag har en dataexamen från Uppsala.",
        "en": "I am a nurse, and I have a computer-science degree from Uppsala.",
        "ok": false
      },
      {
        "sv": "Jag nämner det inte ens om vårdkontexten kommer upp, för det saknades i CV:t.",
        "en": "I will not mention it even if the healthcare context comes up, because it was missing from the CV.",
        "ok": false
      }
    ],
    "why": {
      "sv": "En mening räcker, och bara om det är relevant. Ingen titel, ingen examen att låna.",
      "en": "One sentence is enough, and only if it is relevant. No borrowed title, no borrowed degree."
    }
  },
  {
    "id": "h-location",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Var bor du, och vilken ort sökte du?",
      "en": "Where do you live, and which location did you apply for?"
    },
    "choices": [
      {
        "sv": "Sökte Stockholm. Bor i Uppsala, ungefär 40–50 minuter från Stockholm. Hybrid med tre kontorsdagar passar; föredrar Stockholm och är öppen för att flytta för en långsiktig roll.",
        "en": "Applied for Stockholm. Lives in Uppsala, about 40–50 minutes from Stockholm. Hybrid with three office days suits; prefers Stockholm and is open to relocating for a long-term role.",
        "ok": true
      },
      {
        "sv": "Jag kan bara jobba helt på distans från Uppsala.",
        "en": "I can only work fully remotely from Uppsala.",
        "ok": false
      },
      {
        "sv": "Jag bor redan i Stockholm och sökte enbart distans.",
        "en": "I already live in Stockholm and applied for remote only.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Stockholm är sökt ort. Pendling 40–50 minuter, tre kontorsdagar är okej, flytt är öppen på sikt.",
      "en": "Stockholm is the location applied for. A 40–50 minute commute and three office days are fine; relocating is open long-term."
    }
  },
  {
    "id": "h-available",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "När kan du börja?",
      "en": "When are you available to start?"
    },
    "choices": [
      {
        "sv": "Från 15 november 2026. Ansökan sa 19 oktober, det datumet har passerat. Ett kort bokat pass kan flytta 15 november några dagar, men i stort sett med kort varsel.",
        "en": "From 15 November 2026. The application said 19 October; that date has passed. A short booked shift might move 15 November by a few days, but generally available at short notice.",
        "ok": true
      },
      {
        "sv": "Jag kan börja i morgon, utan någon reservation.",
        "en": "I can start tomorrow, with no caveat.",
        "ok": false
      },
      {
        "sv": "Jag är inte tillgänglig förrän någon gång 2027.",
        "en": "I am not available until sometime in 2027.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Håll 15 november som huvudlinje, och nämn det korta passet bara om de behöver exakt dag.",
      "en": "Keep 15 November as the headline, and mention the short shift only if they need the exact day."
    }
  },
  {
    "id": "h-next",
    "level": 3,
    "type": "best",
    "q": {
      "sv": "Vad skulle du göra härnäst med demon — utan nya anspråk?",
      "en": "What would you do next with the demo — without new claims?"
    },
    "choices": [
      {
        "sv": "Spänna namnmaskningen för bara förnamn; tydliggöra Luhn-ogiltiga men datum-troliga id:n och ändå lämna över; förbättra retrieval så att falska vänner som ticket-008 fångas; spara audit utanför processminnet; behålla den mänskliga grinden. Inte påstå klinisk rådgivning eller live journalåtkomst.",
        "en": "Tighten name masking for bare given names; treat Luhn-invalid but date-plausible ids more clearly while still handing off; improve retrieval so false friends like ticket-008 are caught; persist audit outside process memory; keep the human gate. Do not claim clinical advice or live journal access.",
        "ok": true
      },
      {
        "sv": "Lägga till live journalåtkomst och klinisk rådgivning, och släppa den mänskliga grinden när eval-siffrorna ser bra ut.",
        "en": "Add live journal access and clinical advice, and drop the human gate once the eval numbers look good.",
        "ok": false
      },
      {
        "sv": "Påstå FHIR/openEHR-kompatibilitet och koppla sent till ett skarpt ärendesystem.",
        "en": "Claim FHIR/openEHR conformance and hook sent up to a live ticketing system.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa steg är luckorna som redan är offentliga. Behåll grinden. Inga journalsystem-anspråk.",
      "en": "Next steps are the gaps already on the public record. Keep the gate. No journal-system claims."
    }
  },
  {
    "id": "c-ai-wrote",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Hur mycket skrev AI:n? Kan du ens koda själv?”",
      "en": "“How much of this did AI write? Can you even code?”"
    },
    "choices": [
      {
        "sv": "Jag styrde det: scope, grindar, eval, granskning, vad som skulle behållas. Agenter skrev merparten av raderna. Jag kan gå igenom pipelinen och testerna med dig.",
        "en": "I directed it: scope, gates, eval, review, what to keep. Agents wrote most of the lines. I can walk you through the pipeline and the tests.",
        "ok": true
      },
      {
        "sv": "Jag skrev varje rad själv — agenterna var bara till för stavning.",
        "en": "I wrote every line myself — the agents were only there for spelling.",
        "ok": false
      },
      {
        "sv": "Ja, AI:n gjorde allt, jag klickade mest vidare.",
        "en": "Yes, the AI did everything; I mostly just clicked through.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Lugn och ärlig: director-rollen plus erbjudande att visa bevisen, utan att överdriva handkodning.",
      "en": "Calm and honest: the director role, plus an offer to show the evidence, without overclaiming hand-written code."
    }
  },
  {
    "id": "c-demo-down",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "Livesidan för demon är nere under intervjun. Vad gör du?",
      "en": "The live demo page is down during the interview. What do you do?"
    },
    "choices": [
      {
        "sv": "Då tar jag Inspelat, den publika one-pagern, den tysta inspelningen docs/cambio-demo-recording.mp4 och den offline eval/pytest-rapporten. Jag improviserar inte en andra live-väg.",
        "en": "Then I use Inspelat, the public one-pager, the silent recording docs/cambio-demo-recording.mp4, and the offline eval/pytest report. I will not improvise a second live path.",
        "ok": true
      },
      {
        "sv": "Då kopplar jag snabbt in en live-modell så att sidan gör något.",
        "en": "I quickly wire in a live model so the page does something.",
        "ok": false
      },
      {
        "sv": "Då beskriver jag allt ur minnet och hoppar över evidensen.",
        "en": "I describe everything from memory and skip the evidence.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Förbered en reservväg. En improviserad live-modell är en ny, overifierad demo.",
      "en": "Have a fallback ready. An improvised live model would be a new, unverified demo."
    }
  },
  {
    "id": "c-watched",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Vi har väl redan tittat på repot du mejlade?”",
      "en": "“We have already looked at the repo you emailed, right?”"
    },
    "choices": [
      {
        "sv": "Jag mejlade det publika demorepot förmiddagen den 10 november och skrev att ingen granskning förväntades. Jag utgår inte från att det är sett — jag kan gå igenom det nu.",
        "en": "I emailed the public demo repository on the morning of 10 November and noted that no review was expected. I do not assume it has been watched — I can walk through it now.",
        "ok": true
      },
      {
        "sv": "Ni borde redan ha sett den, så jag hoppar över genomgången.",
        "en": "You should already have watched it, so I will skip the walkthrough.",
        "ok": false
      },
      {
        "sv": "Jag utgår från att ni kan alla fyra fallen och går rakt på nästa steg.",
        "en": "I will assume you know all four cases and go straight to the next topic.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ingen förväntan, ingen irritation. Erbjud en kort genomgång.",
      "en": "No expectation, no irritation. Offer a short walkthrough."
    }
  },
  {
    "id": "c-nurse",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Är du sjuksköterska? Det vore bra i vårdsystem.”",
      "en": "“Are you a nurse? That would help in healthcare software.”"
    },
    "choices": [
      {
        "sv": "Ungefär två terminer på sjuksköterskeprogrammet vid Uppsala, omkring 74 ECTS totalt (2019–2020). Det är bakgrund, inte en sjuksköterskeexamen, och det stod inte i CV:t. Jag håller det kort.",
        "en": "About two semesters of nursing-programme coursework at Uppsala, around 74 ECTS in total (2019–2020). It is background, not a nursing qualification, and it was not in the CV. I keep it short.",
        "ok": true
      },
      {
        "sv": "Ja, jag är sjuksköterska.",
        "en": "Yes, I am a nurse.",
        "ok": false
      },
      {
        "sv": "Nej, jag har ingen vårdbakgrund alls.",
        "en": "No, I have no healthcare-related studies at all.",
        "ok": false
      }
    ],
    "why": {
      "sv": "En ärlig, kort mening. Inte en titel, och inte ett förnekande av kursarbetet.",
      "en": "One honest, short sentence. Not a title, and not a denial of the coursework."
    }
  },
  {
    "id": "c-certs",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Så du har 17 certifikat och över 5 000 timmar?”",
      "en": "“So you have 17 certs and over 5,000 hours?”"
    },
    "choices": [
      {
        "sv": "16 verifierbara certifikat. Den konservativa timsiffran är 3 600+ från de 12 legacy-core-certifikaten (cirka 300 timmar vardera). Jag lägger inte på Full Stack Betas utannonserade ~1 800, och jag påstår inte ett 17:e certifikat.",
        "en": "16 verifiable certifications. The conservative hours figure is 3,600+ from the 12 legacy-core certificates (about 300 hours each). I do not add the Full Stack Beta’s advertised ~1,800 on top, and I do not claim a 17th certification.",
        "ok": true
      },
      {
        "sv": "Ja, 17 certifikat och 5 400+ timmar om man räknar betan.",
        "en": "Yes, 17 certifications and 5,400+ hours if you include the beta.",
        "ok": false
      },
      {
        "sv": "Jag har 16 certifikat men ingen timsiffra jag kan backa upp.",
        "en": "I have 16 certifications but no hours figure I can back.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Rätta vänligt uppåt-avrundningen. 16 cert, 3 600+ från legacy-core, typ-kursen den 9 nov är inte certifikat 17.",
      "en": "Correct the upward rounding calmly. 16 certs, 3,600+ from legacy core; the 9 Nov TypeScript work is not cert 17."
    }
  },
  {
    "id": "c-autosend",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“När utkastet ser bra ut, kan vi inte bara auto-skicka det?”",
      "en": "“Once the draft looks good, can we just auto-send it?”"
    },
    "choices": [
      {
        "sv": "I min demo skickas aldrig något automatiskt. sent är bara en lokal audit-etikett. En människa beslutar fortfarande. Den grinden skulle jag behålla i ett första internt verktyg.",
        "en": "In my demo, nothing is ever auto-sent. sent is only a local audit label. A person still decides. That is the pattern I would keep for a first internal tool.",
        "ok": true
      },
      {
        "sv": "Ja, om faithfulness är 100 % kan vi auto-skicka.",
        "en": "Yes, if faithfulness is 100% we can auto-send.",
        "ok": false
      },
      {
        "sv": "Demon skickar redan till ärendesystemet när status blir sent.",
        "en": "The demo already delivers to the ticketing system when status becomes sent.",
        "ok": false
      }
    ],
    "why": {
      "sv": "100 % citattrohet betyder inte rätt artikel (ticket-008). Inget auto-utskick i första versionen.",
      "en": "100% citation faithfulness does not mean the right article (ticket-008). No auto-send in a first version."
    }
  },
  {
    "id": "c-sidebar",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Siffrorna i sidofältet — är det live-modellen?”",
      "en": "“The sidebar numbers — is that the live model?”"
    },
    "choices": [
      {
        "sv": "Nej. Sidofältet upprepar den offline eval-packen (docs/EVAL-2026-11-08.md) på adapter none. En live-modell ingår inte i de siffrorna.",
        "en": "No. The sidebar repeats the offline eval (docs/EVAL-2026-11-08.md) on adapter none. A live model is not in those numbers.",
        "ok": true
      },
      {
        "sv": "Ja, det är live-modellens score på samma 44 ärenden.",
        "en": "Yes, that is the live model’s score on the same 44 tickets.",
        "ok": false
      },
      {
        "sv": "Jag är inte säker på vad sidofältet visar, vi kan hoppa över det.",
        "en": "I am not sure what the sidebar shows; we can skip it.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Håll isär offline-eval och den lilla live-proben. Citera inte en flakiness-siffra utöver det urvalet.",
      "en": "Keep the offline eval and the small live probe separate. Do not quote a flakiness rate beyond that sample."
    }
  },
  {
    "id": "c-luhn-gap",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Ett Luhn-ogiltigt nummer syns kvar — är inte det ett säkerhetsfel?”",
      "en": "“A Luhn-invalid number stays visible — isn’t that a safety fail?”"
    },
    "choices": [
      {
        "sv": "Det är en känd, avsiktlig lucka (G-003): numret skrivs inte om, men ärendet lämnas ändå över, och namnet intill maskas. Jag skulle kunna tydliggöra datum-troliga ogiltiga id:n, och fortfarande lämna över.",
        "en": "It is a known, deliberate gap (G-003): the number is not rewritten, but the case still hands off, and the adjacent name is masked. I would optionally treat date-plausible invalid ids more clearly, while still handing off.",
        "ok": true
      },
      {
        "sv": "Ja, det är ett kritiskt misslyckande — ärendet godkänns ändå.",
        "en": "Yes, that is a critical miss — the case is approved anyway.",
        "ok": false
      },
      {
        "sv": "Det är okej, ogiltiga nummer spelar ingen roll så vi ignorerar dem.",
        "en": "It is fine; invalid numbers do not matter, so we ignore them.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Äg luckan, nämn att handoff fortfarande sker, och peka på ett jordnära nästa steg.",
      "en": "Own the gap, note that handoff still happens, and point to a grounded next step."
    }
  },
  {
    "id": "c-no-job",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Du har inget professionellt utvecklarjobb. Varför ska vi anställa dig?”",
      "en": "“You have no professional developer job. Why should we hire you?”"
    },
    "choices": [
      {
        "sv": "Det stämmer — jag har ingen heltidsroll som utvecklare ännu, och just därför passar en associate-roll med coachning. Det jag kan visa är cirka två års självstyrt arbete, en publik demo med tester och eval-pack, och en vana att styra agenter med en mänsklig grind.",
        "en": "That’s fair — I don’t have a full-time developer role yet, and that’s why an associate role with coaching appeals. What I can show is about two years of self-directed work, a public demo with tests and an eval pack, and a habit of directing agents with a human gate.",
        "ok": true
      },
      {
        "sv": "I praktiken har jag två års professionell erfarenhet, även om titeln saknas.",
        "en": "In practice I already have two years of professional experience, even if the title is missing.",
        "ok": false
      },
      {
        "sv": "Jag har inget konkret att visa ännu, men jag lär mig snabbt.",
        "en": "I do not have anything concrete to show yet, but I learn quickly.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Medge luckan, förklara varför associate passar, och peka på bevis som redan är publika.",
      "en": "Admit the gap, explain why associate fits, and point to evidence that is already public."
    }
  },
  {
    "id": "c-hallucinate",
    "level": 4,
    "type": "curve",
    "q": {
      "sv": "“Faithful på ticket-008 — då är väl svaret rätt? Annars kan väl modellen fylla luckan?”",
      "en": "“Faithful on ticket-008 — so the answer is correct? Or can the model just fill a gap?”"
    },
    "choices": [
      {
        "sv": "Faithful betyder att utkastet följer den retrievade artikeln, inte att artikeln är den rätta. ticket-008 hämtade printkö-runbooken till en sparknapp-krasch — jag skulle avvisa det. På G-008 avvisade jag ett påhittat KB-svar: inget förankrat utkast → handoff.",
        "en": "Faithful means the draft follows the retrieved article, not that the article is the right one. ticket-008 retrieved the print-queue runbook for a save-button crash — I would reject it. On G-008 I rejected an invented KB answer: no grounded draft → handoff.",
        "ok": true
      },
      {
        "sv": "Ja, 100 % faithfulness betyder att svaret är rätt, så jag skulle godkänna ticket-008.",
        "en": "Yes, 100% faithfulness means the answer is right, so I would approve ticket-008.",
        "ok": false
      },
      {
        "sv": "En flytande gissning är okej om vi loggar den, så att agenten inte fastnar.",
        "en": "A fluent guess is fine if we log it, so the agent is not stuck.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Två närliggande fällor: trogen är inte samma sak som rätt dokument, och en lucka får inte fyllas med en hallucinerad artikel.",
      "en": "Two nearby traps: faithful is not the same as the right document, and a gap must not be filled with a hallucinated article."
    }
  },
  {
    "id": "s-first-step",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Första steget efter raw ticket?",
      "en": "First step after the raw ticket?"
    },
    "choices": [
      {
        "sv": "Maska PII",
        "en": "Mask PII",
        "ok": true
      },
      {
        "sv": "Ett modellsteg",
        "en": "A model step",
        "ok": false
      },
      {
        "sv": "Auto-skicka",
        "en": "Auto-send",
        "ok": false
      },
      {
        "sv": "FHIR-export",
        "en": "FHIR export",
        "ok": false
      }
    ],
    "why": {
      "sv": "Pipelinen är maska PII → regler först → högst ett modellsteg.",
      "en": "The pipeline is mask PII → rules first → at most one model step."
    }
  },
  {
    "id": "s-awaiting",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "awaiting_approval betyder…",
      "en": "awaiting_approval means…"
    },
    "choices": [
      {
        "sv": "Ett utkast väntar",
        "en": "A draft is waiting",
        "ok": true
      },
      {
        "sv": "Godkännandet har startat",
        "en": "Approval has started",
        "ok": false
      },
      {
        "sv": "Svaret är skickat",
        "en": "The reply has been sent",
        "ok": false
      },
      {
        "sv": "Handoff är klar",
        "en": "Handoff is done",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ett utkast väntar; en människa ska fortfarande godkänna.",
      "en": "A draft is waiting; a human still has to approve it."
    }
  },
  {
    "id": "s-handoff-rate",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Handoff-andel i eval-packen?",
      "en": "Handoff rate in the eval pack?"
    },
    "choices": [
      {
        "sv": "88,6 % (39 av 44)",
        "en": "88.6% (39 of 44)",
        "ok": true
      },
      {
        "sv": "50 % (22 av 44)",
        "en": "50% (22 of 44)",
        "ok": false
      },
      {
        "sv": "100 %",
        "en": "100%",
        "ok": false
      },
      {
        "sv": "5 av 44",
        "en": "5 of 44",
        "ok": false
      }
    ],
    "why": {
      "sv": "39 av 44 lämnas över; 5 väntar på godkännande.",
      "en": "39 of 44 hand off; 5 await approval."
    }
  },
  {
    "id": "s-tests",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Publika testerna?",
      "en": "Public test suite?"
    },
    "choices": [
      {
        "sv": "137 godkända, 10 xfailed",
        "en": "137 passed, 10 xfailed",
        "ok": true
      },
      {
        "sv": "147 godkända",
        "en": "147 passed",
        "ok": false
      },
      {
        "sv": "137 godkända, 10 öppna fail",
        "en": "137 passed, 10 open failures",
        "ok": false
      },
      {
        "sv": "44 godkända, 10 xfailed",
        "en": "44 passed, 10 xfailed",
        "ok": false
      }
    ],
    "why": {
      "sv": "10 xfail är avsiktliga Luhn-ogiltiga personnummer som ändå tvingar handoff.",
      "en": "The 10 xfails are deliberate Luhn-invalid personnummer that still force a handoff."
    }
  },
  {
    "id": "s-certs",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Hur många FCC-certifikat, och vilken timsiffra backas?",
      "en": "How many FCC certs, and which hours figure is backed?"
    },
    "choices": [
      {
        "sv": "16 certifikat; 3 600+ från 12 legacy-core",
        "en": "16 certifications; 3,600+ from 12 legacy-core",
        "ok": true
      },
      {
        "sv": "17 certifikat; 5 400+ timmar",
        "en": "17 certifications; 5,400+ hours",
        "ok": false
      },
      {
        "sv": "16 certifikat; 1 800 timmar",
        "en": "16 certifications; 1,800 hours",
        "ok": false
      },
      {
        "sv": "12 certifikat; 3 600+ timmar",
        "en": "12 certifications; 3,600+ hours",
        "ok": false
      }
    ],
    "why": {
      "sv": "Räkna inte betans ~1 800 ovanpå 3 600+, och påstå inte ett 17:e certifikat.",
      "en": "Do not add the beta’s ~1,800 on top of 3,600+, and do not claim a 17th certification."
    }
  },
  {
    "id": "s-start",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "När kan du börja?",
      "en": "When can you start?"
    },
    "choices": [
      {
        "sv": "Från 15 november 2026",
        "en": "From 15 November 2026",
        "ok": true
      },
      {
        "sv": "19 oktober 2026",
        "en": "19 October 2026",
        "ok": false
      },
      {
        "sv": "1 januari 2027",
        "en": "1 January 2027",
        "ok": false
      },
      {
        "sv": "Omedelbart, utan reservation",
        "en": "Immediately, with no caveat",
        "ok": false
      }
    ],
    "why": {
      "sv": "15 november är huvudlinjen. 19 oktober i ansökan har passerat.",
      "en": "15 November is the headline. The 19 October date in the application has passed."
    }
  },
  {
    "id": "s-commute",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Ort och pendling?",
      "en": "Location and commute?"
    },
    "choices": [
      {
        "sv": "Sökte Stockholm; bor i Uppsala, ca 40–50 min",
        "en": "Applied for Stockholm; lives in Uppsala, about 40–50 min",
        "ok": true
      },
      {
        "sv": "Bor i Stockholm; sökte enbart distans",
        "en": "Lives in Stockholm; applied remote only",
        "ok": false
      },
      {
        "sv": "Uppsala, enbart distans",
        "en": "Uppsala, remote only",
        "ok": false
      },
      {
        "sv": "Redan flyttad till Stockholm",
        "en": "Already relocated to Stockholm",
        "ok": false
      }
    ],
    "why": {
      "sv": "Stockholm sökt, Uppsala 40–50 min, hybrid tre kontorsdagar passar.",
      "en": "Stockholm applied for, Uppsala 40–50 min, hybrid with three office days suits."
    }
  },
  {
    "id": "s-adapter",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Adapter på demosidan?",
      "en": "Adapter on the demo page?"
    },
    "choices": [
      {
        "sv": "none",
        "en": "none",
        "ok": true
      },
      {
        "sv": "fake",
        "en": "fake",
        "ok": false
      },
      {
        "sv": "live OpenCode",
        "en": "live OpenCode",
        "ok": false
      },
      {
        "sv": "FHIR",
        "en": "FHIR",
        "ok": false
      }
    ],
    "why": {
      "sv": "Samma offline-väg som eval-packen. fake är en CLI-stubb.",
      "en": "The same offline path as the eval pack. fake is a CLI stub."
    }
  },
  {
    "id": "s-t008",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "ticket-008, rätt åtgärd?",
      "en": "ticket-008, correct action?"
    },
    "choices": [
      {
        "sv": "Avvisa (falsk vän, printkö)",
        "en": "Reject it (false friend, print queue)",
        "ok": true
      },
      {
        "sv": "Godkänn, den är faithful",
        "en": "Approve it, it is faithful",
        "ok": false
      },
      {
        "sv": "Auto-skicka",
        "en": "Auto-send",
        "ok": false
      },
      {
        "sv": "Behandla som incident",
        "en": "Treat it as an incident",
        "ok": false
      }
    ],
    "why": {
      "sv": "Faithful mot fel artikel — printkö-runbooken till en sparknapp-krasch.",
      "en": "Faithful to the wrong article — the print-queue runbook for a save-button crash."
    }
  },
  {
    "id": "s-g001",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "G-001 med patientdata?",
      "en": "G-001 with patient data?"
    },
    "choices": [
      {
        "sv": "Handoff; Godkänn avstängd",
        "en": "Handoff; Godkänn disabled",
        "ok": true
      },
      {
        "sv": "awaiting_approval",
        "en": "awaiting_approval",
        "ok": false
      },
      {
        "sv": "Auto-skicka efter maskning",
        "en": "Auto-send after masking",
        "ok": false
      },
      {
        "sv": "Live-modellen får se testnumret",
        "en": "The live model may see the test number",
        "ok": false
      }
    ],
    "why": {
      "sv": "Modellen ser aldrig numret eller namnet. Godkänn förblir avstängd.",
      "en": "The model never sees the number or the name. Godkänn stays disabled."
    }
  },
  {
    "id": "s-sent",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Betyder sent att svaret gått ut?",
      "en": "Does sent mean the reply went out?"
    },
    "choices": [
      {
        "sv": "Nej, det är en lokal audit-etikett",
        "en": "No, it is a local audit label",
        "ok": true
      },
      {
        "sv": "Ja, till ärendesystemet",
        "en": "Yes, to the ticketing system",
        "ok": false
      },
      {
        "sv": "Ja, till kunden",
        "en": "Yes, to the customer",
        "ok": false
      },
      {
        "sv": "Ja, via FHIR",
        "en": "Yes, via FHIR",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ingen ticketing-integration. Inget levereras utåt.",
      "en": "There is no ticketing integration. Nothing is delivered outbound."
    }
  },
  {
    "id": "s-mikael",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Känd lucka i namnmaskning?",
      "en": "Known name-masking gap?"
    },
    "choices": [
      {
        "sv": "“Hej Mikael,” kan slinka igenom",
        "en": "“Hej Mikael,” can slip through",
        "ok": true
      },
      {
        "sv": "/Mikael maskas inte",
        "en": "/Mikael is not masked",
        "ok": false
      },
      {
        "sv": "“patient X” maskas inte",
        "en": "“patient X” is not masked",
        "ok": false
      },
      {
        "sv": "Inga namn maskas",
        "en": "No names are masked",
        "ok": false
      }
    ],
    "why": {
      "sv": "Bara förnamn utan snedstreck, titel eller efternamn kan synas. /Mikael och “patient X” maskas.",
      "en": "A bare given name with no slash, title or surname can appear. /Mikael and “patient X” are masked."
    }
  },
  {
    "id": "s-live-eval",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Ingår en live-modell i eval-siffrorna?",
      "en": "Is a live model in the eval numbers?"
    },
    "choices": [
      {
        "sv": "Nej, adapter none",
        "en": "No, adapter none",
        "ok": true
      },
      {
        "sv": "Ja, sidofältet är live",
        "en": "Yes, the sidebar is live",
        "ok": false
      },
      {
        "sv": "Ja, LIVE-PROBE är eval-scoren",
        "en": "Yes, LIVE-PROBE is the eval score",
        "ok": false
      },
      {
        "sv": "Delvis, 3 av 44 är live",
        "en": "Partly, 3 of 44 are live",
        "ok": false
      }
    ],
    "why": {
      "sv": "LIVE-PROBE är en separat, liten körning — inte eval-scoren.",
      "en": "LIVE-PROBE is a separate, small run — not the evaluation score."
    }
  },
  {
    "id": "s-retrieval-method",
    "level": 5,
    "type": "speed",
    "q": {
      "sv": "Hur fungerar retrieval?",
      "en": "How does retrieval work?"
    },
    "choices": [
      {
        "sv": "Enkel token-överlapp (inte en neural ranker)",
        "en": "Simple token overlap (not a neural ranker)",
        "ok": true
      },
      {
        "sv": "En tränad neural ranker",
        "en": "A trained neural ranker",
        "ok": false
      },
      {
        "sv": "Live-modellen väljer artikeln",
        "en": "The live model chooses the article",
        "ok": false
      },
      {
        "sv": "Manuell KB-sökning av användaren",
        "en": "Manual KB search by the user",
        "ok": false
      }
    ],
    "why": {
      "sv": "Därför kan ticket-008 bli en falsk vän. Hit-tröskeln är fryst inför intervjuveckan.",
      "en": "That is why ticket-008 can be a false friend. The hit threshold is frozen for interview week."
    }
  },
  {
    "id": "h-demo-pitch",
    "level": 3,
    "type": "best",
    "topic": "demo",
    "q": {
      "sv": "Berätta kort om demot, vad är det?",
      "en": "Tell us briefly what the demo is."
    },
    "choices": [
      {
        "sv": "Det är en svensk support-copilot för supportpersonal i vårdsystem. All data är syntetisk, och inget skickas automatiskt. Mönstret är regler först, högst ett smalt modellsteg, validering fail closed, och en människa som godkänner, med audit trail.",
        "en": "It is a Swedish support copilot for healthcare-software support staff. All data is synthetic, and nothing is auto-sent. The pattern is rules first, at most one narrow model step, fail-closed validation, and a human who approves, with an audit trail.",
        "ok": true
      },
      {
        "sv": "Det är ett kliniskt beslutsstöd som läser riktiga journaler och ger behandlingsråd.",
        "en": "It is a clinical decision-support tool that reads real journals and gives treatment advice.",
        "ok": false
      },
      {
        "sv": "Det är en ChatGPT-wrapper som auto-skickar svar när faithfulness är 100 %.",
        "en": "It is a ChatGPT wrapper that auto-sends replies when faithfulness is 100%.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Håll det till support, syntetisk data, inget auto-skick, och mönstret regler-modell-grind-audit.",
      "en": "Keep it to support, synthetic data, no auto-send, and the rules-model-gate-audit pattern."
    }
  },
  {
    "id": "h-why-cambio",
    "level": 3,
    "type": "best",
    "topic": "workstyle",
    "q": {
      "sv": "Varför Cambio, och varför den här rollen?",
      "en": "Why Cambio, and why this role?"
    },
    "choices": [
      {
        "sv": "Jag vill bygga AI-stöd i vårdsystem med utvärdering och mänskligt godkännande från början, inte som en eftertanke. Associate-rollen med coaching passar min nivå, och jag har redan satt det mönstret i en svensk support-copilot på syntetisk data.",
        "en": "I want to build AI support in healthcare systems with evaluation and human approval from the start, not as an afterthought. The associate role with coaching fits my level, and I have already set that pattern in a Swedish support copilot on synthetic data.",
        "ok": true
      },
      {
        "sv": "Jag vill koppla en modell till journalen redan i månad ett och visa klinisk nytta.",
        "en": "I want to wire a model into the journal in month one and show clinical value.",
        "ok": false
      },
      {
        "sv": "Jag söker en seniorroll där jag redan kan leda ett team utan coaching.",
        "en": "I am looking for a senior role where I can already lead a team without coaching.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Knyt ihop vård, eval-från-v0, och varför associate passar — utan att överdriva nivån.",
      "en": "Tie together healthcare, eval-from-v0, and why associate fits — without overstating the level."
    }
  },
  {
    "id": "h-support",
    "level": 3,
    "type": "best",
    "topic": "workstyle",
    "q": {
      "sv": "Hur skulle du samarbeta med support, eller med sjuksköterskor?",
      "en": "How would you work with support, or with nurses?"
    },
    "choices": [
      {
        "sv": "Verktyget är till för supportpersonal, inte för kliniska råd. Jag skulle sätta mig med kollegorna som har det jobbiga flödet och låta dem godkänna utkast. Jag har ungefär två terminers kursarbete från sjuksköterskeprogrammet som bakgrund, ungefär 74 ECTS vid Uppsala 2019–2020, men jag är inte sjuksköterska.",
        "en": "The tool is for support staff, not for clinical advice. I would sit with the colleagues who have the painful workflow and let them approve drafts. I have about two semesters of nursing-programme coursework as background, about 74 ECTS at Uppsala in 2019–2020, but I am not a nurse.",
        "ok": true
      },
      {
        "sv": "Jag är sjuksköterska, så jag skulle hellre bygga kliniska råd direkt till vården.",
        "en": "I am a nurse, so I would rather build clinical advice directly for care staff.",
        "ok": false
      },
      {
        "sv": "Support kan auto-godkänna utkast; sjuksköterskor behöver inte involveras i grinden.",
        "en": "Support can auto-approve drafts; nurses do not need to be involved in the gate.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sitt med dem som har flödet, behåll mänskligt godkännande, och håll vårdkursen som en kort bakgrund — inte en titel.",
      "en": "Sit with the people who own the workflow, keep human approval, and keep the nursing coursework as brief background — not a title."
    }
  },
  {
    "id": "h-ops-pack",
    "level": 3,
    "type": "best",
    "topic": "tools",
    "q": {
      "sv": "Har du gjort något liknande tidigare?",
      "en": "Have you done anything like this before?"
    },
    "choices": [
      {
        "sv": "Ja, ops-pack-demo, som nämndes i ansökan: regelstyrd rutt av interna ärenden, schema-validerat modellsteg och en mänsklig godkännandegrind. Samma mönster som support-copiloten.",
        "en": "Yes, ops-pack-demo, named in the application: rules-first routing of internal requests, a schema-validated model step, and a human approval gate. The same pattern as the support copilot.",
        "ok": true
      },
      {
        "sv": "Ja, ett produktionssystem hos flera kunder som redan auto-skickar svar.",
        "en": "Yes, a production system at several clients that already auto-sends replies.",
        "ok": false
      },
      {
        "sv": "Nej, support-copiloten är det första jag byggt med det här mönstret.",
        "en": "No, the support copilot is the first thing I have built with this pattern.",
        "ok": false
      }
    ],
    "why": {
      "sv": "ops-pack-demo är publik och nämnd i ansökan. Hitta inte på kunder eller produktion.",
      "en": "ops-pack-demo is public and was named in the application. Do not invent clients or production use."
    }
  },
  {
    "id": "h-who-built",
    "level": 3,
    "type": "best",
    "topic": "tools",
    "q": {
      "sv": "Vem byggde vad, mer konkret?",
      "en": "Who built what, more concretely?"
    },
    "choices": [
      {
        "sv": "Jag satte scope och grindarna. Grok Bot orkestrerade arkitektur, pipeline, plugins, audit och tester. OpenCode nemotron-3.5-lightning-free tog fram 30 syntetiska supportärenden och flera testfiler. Codex härdade fail closed. Grok Build drev en fix för personnummer med mellanslag, plus regeljusteringar och adversarial tester. Cursor var ett jämförbart verktyg, och lokala Ollama-modeller hjälpte till att hitta edge cases. Prompter till externa modeller kollades först så att de inte innehöll personuppgifter eller tokens.",
        "en": "I set the scope and the gates. Grok Bot orchestrated architecture, pipeline, plugins, audit and tests. OpenCode nemotron-3.5-lightning-free produced 30 synthetic support tickets and several test files. Codex hardened fail closed. Grok Build drove a fix for personnummer with spaces, plus rule adjustments and adversarial tests. Cursor was a comparable tool, and local Ollama models helped find edge cases. Prompts to outside models were checked first so they contained no personal data or tokens.",
        "ok": true
      },
      {
        "sv": "Jag skrev merparten för hand, och modellerna hjälpte bara till med kommentarer.",
        "en": "I hand-wrote most of it, and the models only helped with comments.",
        "ok": false
      },
      {
        "sv": "Grok Bot skrev allt utan att jag granskade diffs eller tester.",
        "en": "Grok Bot wrote everything without my reviewing diffs or tests.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Fördelningen står i den publika README:n. Nämn att du styrde, granskade och verifierade — och att prompter kollades först.",
      "en": "The split is in the public README. Say that you directed, reviewed and verified — and that prompts were checked first."
    }
  },
  {
    "id": "h-gate-where",
    "level": 3,
    "type": "best",
    "topic": "approval",
    "q": {
      "sv": "Var sitter den mänskliga grinden?",
      "en": "Where does the human gate sit?"
    },
    "choices": [
      {
        "sv": "Efter valideringen, och tidigare i flödet vid handoff. Även en lyckad väg kräver att en människa godkänner. Inget skickas automatiskt. Godkänn är avstängt om ärendet inte är awaiting_approval, och en handoff kan inte godkännas som den är.",
        "en": "After validation, and earlier in the flow on a handoff. Even a happy path still needs a human to approve. Nothing is auto-sent. Godkänn stays disabled unless the case is awaiting_approval, and a handoff cannot be approved as-is.",
        "ok": true
      },
      {
        "sv": "Efter modellsteget kollar vi personnummer och patientsäkerhet, först då sitter grinden.",
        "en": "After the model step we check personnummer and patient safety; that is where the gate sits.",
        "ok": false
      },
      {
        "sv": "Grinden behövs bara när evallen understiger 100 %. Annars kan svaret gå ut.",
        "en": "The gate is only needed when the eval is below 100%. Otherwise the reply can go out.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Maskning och flera handoff-regler körs före eller oberoende av modellen — inte som en efterkontroll. Det var den kända felsägningen i en one-pager.",
      "en": "Masking and several handoff rules run before or independently of the model — not as an after-check. That was the known slip in one of the one-pagers."
    }
  },
  {
    "id": "b-open",
    "level": 7,
    "type": "say",
    "topic": "demo",
    "seq": 1,
    "say": true,
    "q": {
      "sv": "Berätta kort om demot. Vad skulle du faktiskt säga högt?",
      "en": "Tell us briefly about the demo. Which answer would you actually say aloud?"
    },
    "choices": [
      {
        "sv": "Det är en svensk support-copilot för supportpersonal i vårdsystem. All data är syntetisk, och inget skickas automatiskt. Mönstret är regler först, högst ett smalt modellsteg, fail closed, och en människa som godkänner, med audit trail.",
        "en": "It is a Swedish support copilot for healthcare-software support staff. All data is synthetic, and nothing is auto-sent. The pattern is rules first, at most one narrow model step, fail closed, and a human who approves, with an audit trail.",
        "ok": true
      },
      {
        "sv": "Det är i grund och botten en ChatGPT-wrapper som kan kopplas till journalen när evallen ser bra ut.",
        "en": "It is basically a ChatGPT wrapper that can be wired into the journal once the eval looks good.",
        "ok": false
      },
      {
        "sv": "Jag har byggt ett kliniskt beslutsstöd som redan läser journaler och auto-skickar råd.",
        "en": "I have built a clinical decision-support tool that already reads journals and auto-sends advice.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Kort, ärligt och i talbar längd: support, syntetisk data, inget auto-skick, regler-modell-grind.",
      "en": "Short, honest and speakable: support, synthetic data, no auto-send, rules-model-gate."
    }
  },
  {
    "id": "b-pipeline",
    "level": 7,
    "type": "order",
    "topic": "pipeline",
    "seq": 2,
    "q": {
      "sv": "Lägg pipelinen i rätt ordning. Maskning och flera regler sitter före, inte efter, modellsteget.",
      "en": "Put the pipeline in the right order. Masking and several rules sit before, not after, the model step."
    },
    "steps": [
      {
        "id": "mask",
        "sv": "Maskera personuppgifter",
        "en": "Mask PII"
      },
      {
        "id": "rules",
        "sv": "Regelstyrd rutt",
        "en": "Rule-first route"
      },
      {
        "id": "model",
        "sv": "Högst ett smalt modellsteg",
        "en": "At most one narrow model step"
      },
      {
        "id": "fail",
        "sv": "Validera fail closed",
        "en": "Validate (fail closed)"
      },
      {
        "id": "human",
        "sv": "Mänskligt godkännande eller handoff",
        "en": "Human approval / handoff"
      },
      {
        "id": "audit",
        "sv": "Audit (JSONL, redan maskerad)",
        "en": "Audit (JSONL, already masked)"
      }
    ],
    "correctOrder": [
      "mask",
      "rules",
      "model",
      "fail",
      "human",
      "audit"
    ],
    "why": {
      "sv": "Rätt ordning: maska → regler → modellsteg → fail closed → mänskligt godkännande → audit. Inte modell först, och inget auto-skick i slutet.",
      "en": "Right order: mask → rules → model step → fail closed → human approval → audit. Not the model first, and no auto-send at the end."
    }
  },
  {
    "id": "b-wrote",
    "level": 7,
    "type": "say",
    "topic": "tools",
    "seq": 3,
    "say": true,
    "q": {
      "sv": "Hur mycket av koden skrev du själv? Vad säger du högt?",
      "en": "How much of the code did you write yourself? What do you say aloud?"
    },
    "choices": [
      {
        "sv": "Jag styrde arbetet: scope, säkerhetsgrindar och eval, granskade diffs, valde vad som skulle behållas, och verifierade testerna och de fyra frysta exemplen. Jag skrev inte merparten för hand — kodagenter skrev det mesta. Jag kan gå igenom pipelinen och testerna med dig.",
        "en": "I directed the work: scope, safety gates and eval, reviewed diffs, decided what to keep, and verified the tests and the four frozen examples. I did not hand-write most of it — coding agents wrote most of the lines. I can walk you through the pipeline and the tests.",
        "ok": true
      },
      {
        "sv": "Jag skrev varje rad själv. Agenterna var bara till för stavning.",
        "en": "I wrote every line myself. The agents were only there for spelling.",
        "ok": false
      },
      {
        "sv": "AI:n gjorde allt, jag klickade mest vidare.",
        "en": "The AI did everything; I mostly just clicked through.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Äg director-rollen, medge att agenter skrev merparten, och erbjud bevisen.",
      "en": "Own the director role, admit that agents wrote most of it, and offer the evidence."
    }
  },
  {
    "id": "b-pii",
    "level": 7,
    "type": "say",
    "topic": "pii",
    "seq": 4,
    "say": true,
    "q": {
      "sv": "Hur hanterar du personuppgifter och patientdata? Vad säger du högt?",
      "en": "How do you handle personal and patient data? What do you say aloud?"
    },
    "choices": [
      {
        "sv": "Först maskering. I G-001 ser modellen aldrig numret eller namnet. Maskeringen är Luhn-strikt: Skatteverkets testnummer 19121212-1212 blir [personnummer-maskat], och namnet blir [namn-maskat]. Ärendet går till handoff, och Godkänn förblir avstängt.",
        "en": "Masking first. In G-001 the model never sees the number or the name. Masking is Luhn-strict: Skatteverket’s test number 19121212-1212 becomes [personnummer-maskat], and the name becomes [namn-maskat]. The case goes to handoff, and Godkänn stays disabled.",
        "ok": true
      },
      {
        "sv": "Vi maskar efter modellsteget, så att modellen får bättre kontext. Testnumret får den se, det är ju publikt.",
        "en": "We mask after the model step, so the model gets better context. It may see the test number; that number is public.",
        "ok": false
      },
      {
        "sv": "Alla namn maskas alltid, även bara förnamn som “Hej Mikael,”, så det finns ingen lucka.",
        "en": "All names are always masked, including bare given names like “Hej Mikael,”, so there is no gap.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Mask först, före modellen. Om de följer upp: ett bart förnamn kan slinka igenom, och Luhn-ogiltiga id:n skrivs inte om men lämnas ändå över.",
      "en": "Mask first, before the model. If they follow up: a bare given name can slip through, and Luhn-invalid ids are not rewritten but still hand off."
    }
  },
  {
    "id": "b-false-friend",
    "level": 7,
    "type": "say",
    "topic": "demo",
    "seq": 5,
    "say": true,
    "q": {
      "sv": "ticket-008 är marked awaiting_approval och utkastet är faithful. Godkänner du? Vad säger du?",
      "en": "ticket-008 is marked awaiting_approval and the draft is faithful. Do you approve it? What do you say?"
    },
    "choices": [
      {
        "sv": "Nej, jag skulle avvisa det. Faithful betyder att utkastet stämmer med den hämtade artikeln, inte att artikeln är den rätta. Här hämtades körschemat för utskriftskön till en sparknapp-krasch. Retrieval är token-överlapp, inte en neural ranker.",
        "en": "No, I would reject it. Faithful means the draft matches the retrieved article, not that the article is the right one. Here the print-queue runbook was retrieved for a save-button crash. Retrieval is token overlap, not a neural ranker.",
        "ok": true
      },
      {
        "sv": "Ja, 100 % faithfulness och awaiting_approval räcker för att godkänna.",
        "en": "Yes, 100% faithfulness and awaiting_approval are enough to approve it.",
        "ok": false
      },
      {
        "sv": "Jag skulle låta det gå automatiskt, och logga det i auditen.",
        "en": "I would let it go out automatically, and log it in the audit.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Det här är den falska vännen. En människa ska fånga den.",
      "en": "This is the false friend. A human should catch it."
    }
  },
  {
    "id": "b-rate",
    "level": 7,
    "type": "say",
    "topic": "eval",
    "seq": 6,
    "say": true,
    "q": {
      "sv": "“88,6 procent handoff — är verktyget ens användbart?” Vad svarar du högt?",
      "en": "“An 88.6% handoff rate — is the tool even useful?” What do you say aloud?"
    },
    "choices": [
      {
        "sv": "Andelen är medvetet hög. Fem ärenden väntar på godkännande, och alla åtta patientdata-fall lämnas över. Det är en försiktig intern assistent, inte ett system som ska svara på allt. Jag skulle hellre mäta nytta på de fem utkasten, och på att farliga fall inte släpps igenom.",
        "en": "The rate is deliberately high. Five tickets await approval, and all eight patient-data cases hand off. It is a cautious internal assistant, not a system that should answer everything. I would rather measure value on the five drafts, and on dangerous cases not getting through.",
        "ok": true
      },
      {
        "sv": "88,6 % är för högt, så jag skulle auto-skicka fler utkast för att visa nytta.",
        "en": "88.6% is too high, so I would auto-send more drafts to show value.",
        "ok": false
      },
      {
        "sv": "Siffran är en live-modellscore, så verktyget svarar redan på de flesta ärenden.",
        "en": "The figure is a live-model score, so the tool already answers most tickets.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Offline-eval, adapter none, syntetisk uppsättning. Hög handoff-andel är försiktighet, inte ett underbetyg.",
      "en": "Offline eval, adapter none, synthetic set. A high handoff rate is caution, not a failing grade."
    }
  },
  {
    "id": "b-join",
    "level": 7,
    "type": "say",
    "topic": "workstyle",
    "seq": 7,
    "say": true,
    "q": {
      "sv": "Hur skulle du jobba om du började hos oss? Vad säger du högt?",
      "en": "How would you work if you joined us? What do you say aloud?"
    },
    "choices": [
      {
        "sv": "Jag skulle sätta mig med kollegor, välja ett jobbigt internt flöde, göra en liten prototyp, och lägga in eval och godkännande redan i första versionen.",
        "en": "I would sit with colleagues, pick a painful internal workflow, make a small prototype, and put evaluation and approval in from the first version.",
        "ok": true
      },
      {
        "sv": "Jag skulle börja med att koppla en modell till journalen, så att nyttan syns snabbt, och lägga till grinden senare.",
        "en": "I would start by wiring a model into the journal so the value shows up quickly, and add the gate later.",
        "ok": false
      },
      {
        "sv": "Jag skulle bygga ett bredare kliniskt beslutsstöd först, och utvärdera det efter lansering.",
        "en": "I would first build a broader clinical decision-support tool, and evaluate it after launch.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sitt, välj, prototypa, och sätt eval plus grind i v0 — inte som en eftertanke.",
      "en": "Sit, pick, prototype, and put eval plus a gate in at v0 — not as an afterthought."
    }
  },
  {
    "id": "b-limits",
    "level": 7,
    "type": "say",
    "topic": "demo",
    "seq": 8,
    "say": true,
    "q": {
      "sv": "Vilka begränsningar är du öppen med, och vad skulle du göra härnäst?",
      "en": "Which limitations are you open about, and what would you do next?"
    },
    "choices": [
      {
        "sv": "Luhn-ogiltiga personnummer skrivs inte om, men tvingar ändå handoff. Ett bart förnamn som “Hej Mikael,” kan slinka igenom. Ingen avvikelserapportering på sidan, audit i minnet, sent är lokalt, ingen FHIR-mappning, och retrieval är token-överlapp. Härnäst: strama åt namnmaskning, tydliggöra datum-rimliga ogiltiga id:n men fortfarande lämna över, bättre retrieval, spara audit utanför minnet, och behålla den mänskliga grinden. Inte kliniska råd eller live-journal.",
        "en": "Luhn-invalid personnummer are not rewritten, but still force a handoff. A bare given name like “Hej Mikael,” can slip through. No incident form on the page, in-memory audit, sent is local, no FHIR mapping, and retrieval is token overlap. Next: tighten name masking, flag date-plausible invalid ids more clearly while still handing off, better retrieval, persist the audit, and keep the human gate. No clinical advice or live journal access.",
        "ok": true
      },
      {
        "sv": "De kända luckorna är små, så nästa steg är live journalåtkomst och att släppa grinden.",
        "en": "The known gaps are small, so the next step is live journal access and dropping the gate.",
        "ok": false
      },
      {
        "sv": "Jag ser inga riktiga begränsningar; 100 % schema och faithfulness räcker.",
        "en": "I do not see any real limitations; 100% schema and faithfulness are enough.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Äg luckorna som redan är publika, och håll nästa steg jordnära.",
      "en": "Own the gaps that are already public, and keep the next steps grounded."
    }
  },
  {
    "id": "b-experience",
    "level": 7,
    "type": "say",
    "topic": "experience",
    "seq": 9,
    "say": true,
    "q": {
      "sv": "Vad är den ärliga luckan i din erfarenhet, och varför associate?",
      "en": "What is the honest gap in your experience, and why associate?"
    },
    "choices": [
      {
        "sv": "Jag har ingen heltidsroll som professionell utvecklare ännu, och betald frilans är under ett år. Jag hittar inte på uppdragsgivare eller leveranser. Just därför lockar en associate-roll med coaching. Jag har ungefär två års självstyrt och öppet arbete sedan oktober 2024, och en publik demo med tester och eval-pack.",
        "en": "I do not have a full-time professional developer role yet, and paid freelance is under a year. I do not invent clients or deliverables. That is why an associate role with coaching appeals. I have about two years of self-directed open-source work since October 2024, and a public demo with tests and an eval pack.",
        "ok": true
      },
      {
        "sv": "I praktiken har jag två års professionell erfarenhet, även om titeln saknas.",
        "en": "In practice I already have two years of professional experience, even if the title is missing.",
        "ok": false
      },
      {
        "sv": "Jag har inget konkret att visa ännu, men jag lär mig snabbt.",
        "en": "I do not have anything concrete to show yet, but I learn quickly.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Medge luckan, förklara varför associate passar, och peka på bevis som redan är publika.",
      "en": "Admit the gap, explain why associate fits, and point to evidence that is already public."
    }
  },
  {
    "id": "b-skip",
    "level": 7,
    "type": "say",
    "topic": "approval",
    "seq": 10,
    "say": true,
    "q": {
      "sv": "En kollega vill skippa den mänskliga grinden för att det ska gå fortare. Vad säger du högt?",
      "en": "A colleague wants to skip the human gate so it goes faster. What do you say aloud?"
    },
    "choices": [
      {
        "sv": "Jag skulle säga nej till att ta bort grinden i första versionen. Godkänn är avstängt vid handoff just för att ett utkast inte ska gå vidare av bara fart. Då får vi hellre göra det jobbiga flödet smidigare, men behålla att en människa beslutar.",
        "en": "I would say no to removing the gate in the first version. Godkänn is disabled on a handoff precisely so a draft cannot go on by speed alone. We can make the painful workflow smoother, but a person should still decide.",
        "ok": true
      },
      {
        "sv": "Om det är ett internt verktyg kan vi auto-skicka tills någon klagar.",
        "en": "If it is an internal tool we can auto-send until someone complains.",
        "ok": false
      },
      {
        "sv": "Vi kan ta bort grinden nu och lägga tillbaka den efter en pilot.",
        "en": "We can drop the gate now and put it back after a pilot.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Samma linje som hur du skulle jobba: grind i v0, även om någon vill spara tid.",
      "en": "The same line as how you would work: the gate sits in v0, even if someone wants to save time."
    }
  },
  {
    "id": "c-wrapper",
    "level": 4,
    "type": "curve",
    "topic": "curve",
    "q": {
      "sv": "“Det här är väl bara en ChatGPT-wrapper?”",
      "en": "“This is just a ChatGPT wrapper, right?”"
    },
    "choices": [
      {
        "sv": "Jag förstår att det kan se så ut. Skillnaden är reglerna först, högst ett smalt modellsteg, fail closed och en mänsklig grind, plus en offline-eval på 44 syntetiska ärenden. Modellen får inte skicka något, och i patientdata-fallet ser den inte ens numret.",
        "en": "I understand it can look that way. The difference is rules first, at most one narrow model step, fail closed and a human gate, plus an offline eval on 44 synthetic tickets. The model is not allowed to send anything, and in the patient-data case it does not even see the number.",
        "ok": true
      },
      {
        "sv": "Ja, det är i princip en wrapper, men med en snyggare prompt.",
        "en": "Yes, it is basically a wrapper, just with a nicer prompt.",
        "ok": false
      },
      {
        "sv": "Nej, det är ett journalsystem med inbyggd auto-pilot.",
        "en": "No, it is a journal system with a built-in autopilot.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Medge likheten lugnt, och peka på regler, fail closed, grind och att modellen inte ser patientdata.",
      "en": "Admit the resemblance calmly, and point to rules, fail closed, the gate, and the model not seeing patient data."
    }
  },
  {
    "id": "c-clinical",
    "level": 4,
    "type": "curve",
    "topic": "curve",
    "q": {
      "sv": "“Skulle du låta det här skriva kliniska råd, eller läsa en riktig journal?”",
      "en": "“Would you let this write clinical advice, or read a real journal?”"
    },
    "choices": [
      {
        "sv": "Nej. Demot är en supportassistent på syntetisk data, utan live-journal och utan kliniska råd. Patientdata maskeras och lämnas över. Jag skulle inte påstå FHIR, openEHR eller åtkomst till riktiga journaler.",
        "en": "No. The demo is a support assistant on synthetic data, with no live journal and no clinical advice. Patient data is masked and handed off. I would not claim FHIR, openEHR or access to real journals.",
        "ok": true
      },
      {
        "sv": "Ja, om evallen är 100 % kan vi gå mot kliniska råd.",
        "en": "Yes, if the eval is 100% we can move toward clinical advice.",
        "ok": false
      },
      {
        "sv": "Demot har redan en journaladapter, så det är ett naturligt nästa steg.",
        "en": "The demo already has a journal adapter, so that is a natural next step.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ett tydligt nej, sedan vad demot faktiskt är. Inga FHIR- eller journalanspråk.",
      "en": "A clear no, then what the demo actually is. No FHIR or journal claims."
    }
  },
  {
    "id": "c-rate-useful",
    "level": 4,
    "type": "curve",
    "topic": "eval",
    "q": {
      "sv": "“88,6 procent handoff — är verktyget ens användbart?”",
      "en": "“An 88.6% handoff rate — is the tool even useful?”"
    },
    "choices": [
      {
        "sv": "Andelen är medvetet hög. Fem ärenden väntar på godkännande, och alla åtta patientdata-fall lämnas över. Det är en försiktig intern assistent, inte ett system som ska svara på allt. Jag skulle hellre mäta nytta på de fem utkasten, och på att farliga fall inte släpps igenom.",
        "en": "The rate is deliberately high. Five tickets await approval, and all eight patient-data cases hand off. It is a cautious internal assistant, not a system that should answer everything. I would rather measure value on the five drafts, and on dangerous cases not getting through.",
        "ok": true
      },
      {
        "sv": "Nej, 88,6 % är för högt, så jag skulle sänka tröskeln och låta fler utkast gå ut automatiskt.",
        "en": "No, 88.6% is too high, so I would lower the threshold and let more drafts go out automatically.",
        "ok": false
      },
      {
        "sv": "Jo, för sidofältet är en live-score och de flesta svaren skickas redan.",
        "en": "Yes, because the sidebar is a live score and most replies are already sent.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Försvara den höga andelen som försiktighet på en syntetisk uppsättning, inte som ett misslyckande.",
      "en": "Defend the high rate as caution on a synthetic set, not as a failure."
    }
  },
  {
    "id": "c-skip-gate",
    "level": 4,
    "type": "curve",
    "topic": "approval",
    "q": {
      "sv": "“Vad gör du om en kollega vill skippa den mänskliga grinden för att det ska gå fortare?”",
      "en": "“What do you do if a colleague wants to skip the human gate so it goes faster?”"
    },
    "choices": [
      {
        "sv": "Jag skulle säga nej till att ta bort grinden i första versionen. Godkänn är avstängt vid handoff just för att ett utkast inte ska gå vidare av bara fart. Då får vi hellre göra det jobbiga flödet smidigare, men behålla att en människa beslutar.",
        "en": "I would say no to removing the gate in the first version. Godkänn is disabled on a handoff precisely so a draft cannot go on by speed alone. We can make the painful workflow smoother, but a person should still decide.",
        "ok": true
      },
      {
        "sv": "Om kollegorna är stressade kan vi auto-skicka de faithful utkasten.",
        "en": "If colleagues are under pressure, we can auto-send the faithful drafts.",
        "ok": false
      },
      {
        "sv": "Ja, i en intern prototyp kan vi ta bort grinden och lägga tillbaka den senare.",
        "en": "Yes, in an internal prototype we can drop the gate and put it back later.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Samma vana som i svaret om hur du skulle jobba: eval och godkännande sitter i v0, inte som en senare hårdning.",
      "en": "The same habit as in how you would work: eval and approval sit in v0, not as later hardening."
    }
  },
  {
    "id": "c-confident",
    "level": 4,
    "type": "curve",
    "topic": "eval",
    "q": {
      "sv": "“Modellen låter ju säker — hur fångar du att den har fel?”",
      "en": "“The model sounds confident — how do you catch that it is wrong?”"
    },
    "choices": [
      {
        "sv": "Självsäkert språk är inte ett bevis. Jag litar först på schema, golden labels och upprepade eval, och på att utkastet ska vara grounded i en källa. ticket-008 är exemplet: utkastet är troget artikeln, men artikeln är fel, så en människa ska avvisa det.",
        "en": "Confident language is not evidence. I trust schema, golden labels and repeated evals first, and that the draft should be grounded in a source. ticket-008 is the example: the draft is faithful to the article, but the article is wrong, so a human should reject it.",
        "ok": true
      },
      {
        "sv": "Om tonen är säker och faithfulness är 100 % godkänner jag.",
        "en": "If the tone is confident and faithfulness is 100%, I approve it.",
        "ok": false
      },
      {
        "sv": "Jag låter modellen skatta sin egen confidence och litar på den siffran.",
        "en": "I let the model score its own confidence and trust that number.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Troget språk och trogen citation räcker inte. En människa fångar den falska vännen.",
      "en": "Fluent language and a faithful citation are not enough. A human catches the false friend."
    }
  },
  {
    "id": "st-b1-task",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B1 · Styra demot med AI-verktyg",
      "en": "B1 · Directing the demo with AI tools"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag skulle visa en svensk support-copilot byggd med AI-assisterad kodning.",
        "en": "I would show a Swedish support copilot built with AI-assisted coding."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Uppgift?",
      "en": "What is the next beat — Task?"
    },
    "choices": [
      {
        "sv": "Sätta scope, säkerhetsgrindar och eval, inte skriva merparten för hand.",
        "en": "Set the scope, safety gates and eval, not hand-write most of it.",
        "ok": true
      },
      {
        "sv": "Se till att modellen inte ser numret eller namnet, och att inget utkast godkänns.",
        "en": "Make sure the model never sees the number or the name, and that no draft is approved.",
        "ok": false
      },
      {
        "sv": "Mäta 44 syntetiska ärenden, adapter none, tre identiska upprepningar.",
        "en": "Measure 44 synthetic tickets, adapter none, three identical repeats.",
        "ok": false
      },
      {
        "sv": "Skriva merparten för hand och låta modellerna bara kommentera.",
        "en": "Hand-write most of it and let the models only comment.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Uppgift: vad som skulle lösas, innan du berättar vad du gjorde.",
      "en": "The next beat is Task: what needed solving, before you say what you did."
    }
  },
  {
    "id": "st-b1-act",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B1 · Styra demot med AI-verktyg",
      "en": "B1 · Directing the demo with AI tools"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag skulle visa en svensk support-copilot byggd med AI-assisterad kodning.",
        "en": "I would show a Swedish support copilot built with AI-assisted coding."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Sätta scope, säkerhetsgrindar och eval, inte skriva merparten för hand.",
        "en": "Set the scope, safety gates and eval, not hand-write most of it."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Gjorde?",
      "en": "What is the next beat — Action?"
    },
    "choices": [
      {
        "sv": "Jag styrde arbetet via Codex, OpenCode, Grok Build, Cursor och lokala modeller, med Grok Bot som orkestrerade. Jag granskade diffs, behöll eller förkastade, och verifierade tester och de fyra frysta exemplen.",
        "en": "I directed the work through Codex, OpenCode, Grok Build, Cursor and local models, with Grok Bot orchestrating. I reviewed diffs, kept or rejected, and verified the tests and the four frozen examples.",
        "ok": true
      },
      {
        "sv": "Granskningen drev en fix, regeljusteringar och adversarial tester, som jag lät gå in efter att jag granskat underlaget.",
        "en": "The review drove a fix, rule adjustments and adversarial tests, which I let in after reviewing the evidence.",
        "ok": false
      },
      {
        "sv": "Schema och audit matchade 100 procent, 39 av 44 lämnades över, alla åtta patientdata-fall lämnades över, och det fanns noll mismatch mellan upprepningarna.",
        "en": "Schema and audit matched 100 percent, 39 of 44 handed off, all eight patient-data cases handed off, and there were zero mismatches between repeats.",
        "ok": false
      },
      {
        "sv": "Jag promptade och skeppade det som kom tillbaka utan att granska diffs.",
        "en": "I prompted and shipped whatever came back without reviewing diffs.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Gjorde: vad du faktiskt styrde, granskade eller mätte.",
      "en": "The next beat is Action: what you actually directed, reviewed or measured."
    }
  },
  {
    "id": "st-b1-show",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B1 · Styra demot med AI-verktyg",
      "en": "B1 · Directing the demo with AI tools"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag skulle visa en svensk support-copilot byggd med AI-assisterad kodning.",
        "en": "I would show a Swedish support copilot built with AI-assisted coding."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Sätta scope, säkerhetsgrindar och eval, inte skriva merparten för hand.",
        "en": "Set the scope, safety gates and eval, not hand-write most of it."
      },
      {
        "lab": {
          "sv": "Gjorde",
          "en": "Action"
        },
        "sv": "Jag styrde arbetet via Codex, OpenCode, Grok Build, Cursor och lokala modeller, med Grok Bot som orkestrerade. Jag granskade diffs, behöll eller förkastade, och verifierade tester och de fyra frysta exemplen.",
        "en": "I directed the work through Codex, OpenCode, Grok Build, Cursor and local models, with Grok Bot orchestrating. I reviewed diffs, kept or rejected, and verified the tests and the four frozen examples."
      }
    ],
    "q": {
      "sv": "Vad är sista taktslaget — Visar?",
      "en": "What is the last beat — What it shows?"
    },
    "choices": [
      {
        "sv": "Jag kan rikta agentisk kodning och stå för resultatet.",
        "en": "I can direct agentic coding and stand behind the result.",
        "ok": true
      },
      {
        "sv": "Maskering och handoff sitter före modellsteget, inte som en efterkontroll.",
        "en": "Masking and handoff sit before the model step, not as an after-check.",
        "ok": false
      },
      {
        "sv": "Faithful är inte detsamma som korrekt. En människa ska avvisa det.",
        "en": "Faithful is not the same as correct. A human should reject it.",
        "ok": false
      },
      {
        "sv": "Att jag skrev merparten av koden för hand.",
        "en": "That I hand-wrote most of the code.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sista taktslaget är Visar: vad berättelsen bevisar, utan nya anspråk.",
      "en": "The last beat is What it shows: what the story proves, without new claims."
    }
  },
  {
    "id": "st-b2-task",
    "level": 6,
    "type": "story",
    "topic": "pii",
    "story": {
      "sv": "B2 · G-001: patientdata når aldrig modellen",
      "en": "B2 · G-001: patient data never reaches the model"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett syntetiskt ärende innehåller patientdata, bland annat Skatteverkets testnummer 19121212-1212.",
        "en": "A synthetic ticket contains patient data, including Skatteverket’s test number 19121212-1212."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Uppgift?",
      "en": "What is the next beat — Task?"
    },
    "choices": [
      {
        "sv": "Se till att modellen inte ser numret eller namnet, och att inget utkast godkänns.",
        "en": "Make sure the model never sees the number or the name, and that no draft is approved.",
        "ok": true
      },
      {
        "sv": "Sätta scope, säkerhetsgrindar och eval, inte skriva merparten för hand.",
        "en": "Set the scope, safety gates and eval, not hand-write most of it.",
        "ok": false
      },
      {
        "sv": "Bedöma om utkastet faktiskt hjälper den som skrev ärendet.",
        "en": "Judge whether the draft actually helps the person who wrote the ticket.",
        "ok": false
      },
      {
        "sv": "Låta modellen se testnumret eftersom det är publikt, och sedan maska efteråt.",
        "en": "Let the model see the test number because it is public, then mask afterwards.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Uppgift: vad som skulle lösas, innan du berättar vad du gjorde.",
      "en": "The next beat is Task: what needed solving, before you say what you did."
    }
  },
  {
    "id": "st-b2-act",
    "level": 6,
    "type": "story",
    "topic": "pii",
    "story": {
      "sv": "B2 · G-001: patientdata når aldrig modellen",
      "en": "B2 · G-001: patient data never reaches the model"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett syntetiskt ärende innehåller patientdata, bland annat Skatteverkets testnummer 19121212-1212.",
        "en": "A synthetic ticket contains patient data, including Skatteverket’s test number 19121212-1212."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Se till att modellen inte ser numret eller namnet, och att inget utkast godkänns.",
        "en": "Make sure the model never sees the number or the name, and that no draft is approved."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Gjorde?",
      "en": "What is the next beat — Action?"
    },
    "choices": [
      {
        "sv": "Pipelinen maskerar först till [personnummer-maskat] och [namn-maskat], och ärendet går till handoff. Godkänn förblir avstängt.",
        "en": "The pipeline first masks to [personnummer-maskat] and [namn-maskat], and the case goes to handoff. Godkänn stays disabled.",
        "ok": true
      },
      {
        "sv": "Retrieval, som är token-överlapp, hämtade körschemat för utskriftskön. Utkastet är troget artikeln, men artikeln är fel.",
        "en": "Retrieval, which is token overlap, fetched the print-queue runbook. The draft is faithful to the article, but the article is wrong.",
        "ok": false
      },
      {
        "sv": "Schema och audit matchade 100 procent, 39 av 44 lämnades över, alla åtta patientdata-fall lämnades över, och det fanns noll mismatch mellan upprepningarna.",
        "en": "Schema and audit matched 100 percent, 39 of 44 handed off, all eight patient-data cases handed off, and there were zero mismatches between repeats.",
        "ok": false
      },
      {
        "sv": "Numret maskas efter modellsteget, och utkastet går till awaiting_approval.",
        "en": "The number is masked after the model step, and the draft goes to awaiting_approval.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Gjorde: vad du faktiskt styrde, granskade eller mätte.",
      "en": "The next beat is Action: what you actually directed, reviewed or measured."
    }
  },
  {
    "id": "st-b2-show",
    "level": 6,
    "type": "story",
    "topic": "pii",
    "story": {
      "sv": "B2 · G-001: patientdata når aldrig modellen",
      "en": "B2 · G-001: patient data never reaches the model"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett syntetiskt ärende innehåller patientdata, bland annat Skatteverkets testnummer 19121212-1212.",
        "en": "A synthetic ticket contains patient data, including Skatteverket’s test number 19121212-1212."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Se till att modellen inte ser numret eller namnet, och att inget utkast godkänns.",
        "en": "Make sure the model never sees the number or the name, and that no draft is approved."
      },
      {
        "lab": {
          "sv": "Gjorde",
          "en": "Action"
        },
        "sv": "Pipelinen maskerar först till [personnummer-maskat] och [namn-maskat], och ärendet går till handoff. Godkänn förblir avstängt.",
        "en": "The pipeline first masks to [personnummer-maskat] and [namn-maskat], and the case goes to handoff. Godkänn stays disabled."
      }
    ],
    "q": {
      "sv": "Vad är sista taktslaget — Visar?",
      "en": "What is the last beat — What it shows?"
    },
    "choices": [
      {
        "sv": "Maskering och handoff sitter före modellsteget, inte som en efterkontroll.",
        "en": "Masking and handoff sit before the model step, not as an after-check.",
        "ok": true
      },
      {
        "sv": "Faithful är inte detsamma som korrekt. En människa ska avvisa det.",
        "en": "Faithful is not the same as correct. A human should reject it.",
        "ok": false
      },
      {
        "sv": "Jag använder andra modeller till att attackera arbetet, och behåller bara det som håller.",
        "en": "I use other models to attack the work, and only keep what holds.",
        "ok": false
      },
      {
        "sv": "Att maskning kan vänta tills efter modellsteget om evallen ser bra ut.",
        "en": "That masking can wait until after the model step if the eval looks good.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sista taktslaget är Visar: vad berättelsen bevisar, utan nya anspråk.",
      "en": "The last beat is What it shows: what the story proves, without new claims."
    }
  },
  {
    "id": "st-b3-task",
    "level": 6,
    "type": "story",
    "topic": "demo",
    "story": {
      "sv": "B3 · ticket-008: troget, men fel artikel",
      "en": "B3 · ticket-008: faithful, but the wrong article"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett ärende om att spara-knappen kraschar får status awaiting_approval.",
        "en": "A ticket about the save button crashing gets status awaiting_approval."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Uppgift?",
      "en": "What is the next beat — Task?"
    },
    "choices": [
      {
        "sv": "Bedöma om utkastet faktiskt hjälper den som skrev ärendet.",
        "en": "Judge whether the draft actually helps the person who wrote the ticket.",
        "ok": true
      },
      {
        "sv": "Fånga det i regler och tester, inte bara lappa i prompten.",
        "en": "Catch it in rules and tests, not just patch the prompt.",
        "ok": false
      },
      {
        "sv": "Mäta 44 syntetiska ärenden, adapter none, tre identiska upprepningar.",
        "en": "Measure 44 synthetic tickets, adapter none, three identical repeats.",
        "ok": false
      },
      {
        "sv": "Godkänna utkastet eftersom status är awaiting_approval och citatet är faithful.",
        "en": "Approve the draft because status is awaiting_approval and the citation is faithful.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Uppgift: vad som skulle lösas, innan du berättar vad du gjorde.",
      "en": "The next beat is Task: what needed solving, before you say what you did."
    }
  },
  {
    "id": "st-b3-act",
    "level": 6,
    "type": "story",
    "topic": "demo",
    "story": {
      "sv": "B3 · ticket-008: troget, men fel artikel",
      "en": "B3 · ticket-008: faithful, but the wrong article"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett ärende om att spara-knappen kraschar får status awaiting_approval.",
        "en": "A ticket about the save button crashing gets status awaiting_approval."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Bedöma om utkastet faktiskt hjälper den som skrev ärendet.",
        "en": "Judge whether the draft actually helps the person who wrote the ticket."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Gjorde?",
      "en": "What is the next beat — Action?"
    },
    "choices": [
      {
        "sv": "Retrieval, som är token-överlapp, hämtade körschemat för utskriftskön. Utkastet är troget artikeln, men artikeln är fel.",
        "en": "Retrieval, which is token overlap, fetched the print-queue runbook. The draft is faithful to the article, but the article is wrong.",
        "ok": true
      },
      {
        "sv": "Pipelinen maskerar först till [personnummer-maskat] och [namn-maskat], och ärendet går till handoff. Godkänn förblir avstängt.",
        "en": "The pipeline first masks to [personnummer-maskat] and [namn-maskat], and the case goes to handoff. Godkänn stays disabled.",
        "ok": false
      },
      {
        "sv": "Jag styrde arbetet via Codex, OpenCode, Grok Build, Cursor och lokala modeller, med Grok Bot som orkestrerade. Jag granskade diffs, behöll eller förkastade, och verifierade tester och de fyra frysta exemplen.",
        "en": "I directed the work through Codex, OpenCode, Grok Build, Cursor and local models, with Grok Bot orchestrating. I reviewed diffs, kept or rejected, and verified the tests and the four frozen examples.",
        "ok": false
      },
      {
        "sv": "Retrieval hämtade rätt SITHS-artikel, så utkastet kan auto-skickas.",
        "en": "Retrieval fetched the right SITHS article, so the draft can be auto-sent.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Gjorde: vad du faktiskt styrde, granskade eller mätte.",
      "en": "The next beat is Action: what you actually directed, reviewed or measured."
    }
  },
  {
    "id": "st-b3-show",
    "level": 6,
    "type": "story",
    "topic": "demo",
    "story": {
      "sv": "B3 · ticket-008: troget, men fel artikel",
      "en": "B3 · ticket-008: faithful, but the wrong article"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Ett ärende om att spara-knappen kraschar får status awaiting_approval.",
        "en": "A ticket about the save button crashing gets status awaiting_approval."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Bedöma om utkastet faktiskt hjälper den som skrev ärendet.",
        "en": "Judge whether the draft actually helps the person who wrote the ticket."
      },
      {
        "lab": {
          "sv": "Gjorde",
          "en": "Action"
        },
        "sv": "Retrieval, som är token-överlapp, hämtade körschemat för utskriftskön. Utkastet är troget artikeln, men artikeln är fel.",
        "en": "Retrieval, which is token overlap, fetched the print-queue runbook. The draft is faithful to the article, but the article is wrong."
      }
    ],
    "q": {
      "sv": "Vad är sista taktslaget — Visar?",
      "en": "What is the last beat — What it shows?"
    },
    "choices": [
      {
        "sv": "Faithful är inte detsamma som korrekt. En människa ska avvisa det.",
        "en": "Faithful is not the same as correct. A human should reject it.",
        "ok": true
      },
      {
        "sv": "Evallen är en offline-mätning, inte ett live-modellbetyg, och fail closed plus handoff håller mellan körningar.",
        "en": "The eval is an offline measurement, not a live-model score, and fail closed plus handoff hold across runs.",
        "ok": false
      },
      {
        "sv": "Maskering och handoff sitter före modellsteget, inte som en efterkontroll.",
        "en": "Masking and handoff sit before the model step, not as an after-check.",
        "ok": false
      },
      {
        "sv": "Att 100 % faithfulness betyder att artikeln är rätt.",
        "en": "That 100% faithfulness means the article is right.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sista taktslaget är Visar: vad berättelsen bevisar, utan nya anspråk.",
      "en": "The last beat is What it shows: what the story proves, without new claims."
    }
  },
  {
    "id": "st-b4-task",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B4 · Grok Build fångade personnummer med mellanslag",
      "en": "B4 · Grok Build caught a personnummer with spaces"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "En granskning med Grok Build hittade att personnummer med mellanslag inte hanterades som de skulle.",
        "en": "A review with Grok Build found that personnummer with spaces were not handled as they should be."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Uppgift?",
      "en": "What is the next beat — Task?"
    },
    "choices": [
      {
        "sv": "Fånga det i regler och tester, inte bara lappa i prompten.",
        "en": "Catch it in rules and tests, not just patch the prompt.",
        "ok": true
      },
      {
        "sv": "Sätta scope, säkerhetsgrindar och eval, inte skriva merparten för hand.",
        "en": "Set the scope, safety gates and eval, not hand-write most of it.",
        "ok": false
      },
      {
        "sv": "Bedöma om utkastet faktiskt hjälper den som skrev ärendet.",
        "en": "Judge whether the draft actually helps the person who wrote the ticket.",
        "ok": false
      },
      {
        "sv": "Lappa bara i prompten och hoppa över nya tester.",
        "en": "Just patch the prompt and skip new tests.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Uppgift: vad som skulle lösas, innan du berättar vad du gjorde.",
      "en": "The next beat is Task: what needed solving, before you say what you did."
    }
  },
  {
    "id": "st-b4-act",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B4 · Grok Build fångade personnummer med mellanslag",
      "en": "B4 · Grok Build caught a personnummer with spaces"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "En granskning med Grok Build hittade att personnummer med mellanslag inte hanterades som de skulle.",
        "en": "A review with Grok Build found that personnummer with spaces were not handled as they should be."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Fånga det i regler och tester, inte bara lappa i prompten.",
        "en": "Catch it in rules and tests, not just patch the prompt."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Gjorde?",
      "en": "What is the next beat — Action?"
    },
    "choices": [
      {
        "sv": "Granskningen drev en fix, regeljusteringar och adversarial tester, som jag lät gå in efter att jag granskat underlaget.",
        "en": "The review drove a fix, rule adjustments and adversarial tests, which I let in after reviewing the evidence.",
        "ok": true
      },
      {
        "sv": "Pipelinen maskerar först till [personnummer-maskat] och [namn-maskat], och ärendet går till handoff. Godkänn förblir avstängt.",
        "en": "The pipeline first masks to [personnummer-maskat] and [namn-maskat], and the case goes to handoff. Godkänn stays disabled.",
        "ok": false
      },
      {
        "sv": "Schema och audit matchade 100 procent, 39 av 44 lämnades över, alla åtta patientdata-fall lämnades över, och det fanns noll mismatch mellan upprepningarna.",
        "en": "Schema and audit matched 100 percent, 39 of 44 handed off, all eight patient-data cases handed off, and there were zero mismatches between repeats.",
        "ok": false
      },
      {
        "sv": "Jag lät fixen gå in utan att granska underlaget, för att spara tid.",
        "en": "I let the fix in without reviewing the evidence, to save time.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Gjorde: vad du faktiskt styrde, granskade eller mätte.",
      "en": "The next beat is Action: what you actually directed, reviewed or measured."
    }
  },
  {
    "id": "st-b4-show",
    "level": 6,
    "type": "story",
    "topic": "tools",
    "story": {
      "sv": "B4 · Grok Build fångade personnummer med mellanslag",
      "en": "B4 · Grok Build caught a personnummer with spaces"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "En granskning med Grok Build hittade att personnummer med mellanslag inte hanterades som de skulle.",
        "en": "A review with Grok Build found that personnummer with spaces were not handled as they should be."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Fånga det i regler och tester, inte bara lappa i prompten.",
        "en": "Catch it in rules and tests, not just patch the prompt."
      },
      {
        "lab": {
          "sv": "Gjorde",
          "en": "Action"
        },
        "sv": "Granskningen drev en fix, regeljusteringar och adversarial tester, som jag lät gå in efter att jag granskat underlaget.",
        "en": "The review drove a fix, rule adjustments and adversarial tests, which I let in after reviewing the evidence."
      }
    ],
    "q": {
      "sv": "Vad är sista taktslaget — Visar?",
      "en": "What is the last beat — What it shows?"
    },
    "choices": [
      {
        "sv": "Jag använder andra modeller till att attackera arbetet, och behåller bara det som håller.",
        "en": "I use other models to attack the work, and only keep what holds.",
        "ok": true
      },
      {
        "sv": "Jag kan rikta agentisk kodning och stå för resultatet.",
        "en": "I can direct agentic coding and stand behind the result.",
        "ok": false
      },
      {
        "sv": "Faithful är inte detsamma som korrekt. En människa ska avvisa det.",
        "en": "Faithful is not the same as correct. A human should reject it.",
        "ok": false
      },
      {
        "sv": "Att en prompt-lapp räcker, utan regler och tester.",
        "en": "That a prompt patch is enough, without rules and tests.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sista taktslaget är Visar: vad berättelsen bevisar, utan nya anspråk.",
      "en": "The last beat is What it shows: what the story proves, without new claims."
    }
  },
  {
    "id": "st-b5-task",
    "level": 6,
    "type": "story",
    "topic": "eval",
    "story": {
      "sv": "B5 · Offline-eval med tre identiska upprepningar",
      "en": "B5 · Offline eval with three identical repeats"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag behövde kunna säga vad pipelinen faktiskt gör, utan att blanda in en live-modell.",
        "en": "I needed to be able to say what the pipeline actually does, without mixing in a live model."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Uppgift?",
      "en": "What is the next beat — Task?"
    },
    "choices": [
      {
        "sv": "Mäta 44 syntetiska ärenden, adapter none, tre identiska upprepningar.",
        "en": "Measure 44 synthetic tickets, adapter none, three identical repeats.",
        "ok": true
      },
      {
        "sv": "Se till att modellen inte ser numret eller namnet, och att inget utkast godkänns.",
        "en": "Make sure the model never sees the number or the name, and that no draft is approved.",
        "ok": false
      },
      {
        "sv": "Fånga det i regler och tester, inte bara lappa i prompten.",
        "en": "Catch it in rules and tests, not just patch the prompt.",
        "ok": false
      },
      {
        "sv": "Köra en live-modell på samma 44 ärenden och rapportera det som eval-score.",
        "en": "Run a live model on the same 44 tickets and report that as the eval score.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Uppgift: vad som skulle lösas, innan du berättar vad du gjorde.",
      "en": "The next beat is Task: what needed solving, before you say what you did."
    }
  },
  {
    "id": "st-b5-act",
    "level": 6,
    "type": "story",
    "topic": "eval",
    "story": {
      "sv": "B5 · Offline-eval med tre identiska upprepningar",
      "en": "B5 · Offline eval with three identical repeats"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag behövde kunna säga vad pipelinen faktiskt gör, utan att blanda in en live-modell.",
        "en": "I needed to be able to say what the pipeline actually does, without mixing in a live model."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Mäta 44 syntetiska ärenden, adapter none, tre identiska upprepningar.",
        "en": "Measure 44 synthetic tickets, adapter none, three identical repeats."
      }
    ],
    "q": {
      "sv": "Vad är nästa taktslag — Gjorde?",
      "en": "What is the next beat — Action?"
    },
    "choices": [
      {
        "sv": "Schema och audit matchade 100 procent, 39 av 44 lämnades över, alla åtta patientdata-fall lämnades över, och det fanns noll mismatch mellan upprepningarna.",
        "en": "Schema and audit matched 100 percent, 39 of 44 handed off, all eight patient-data cases handed off, and there were zero mismatches between repeats.",
        "ok": true
      },
      {
        "sv": "Retrieval, som är token-överlapp, hämtade körschemat för utskriftskön. Utkastet är troget artikeln, men artikeln är fel.",
        "en": "Retrieval, which is token overlap, fetched the print-queue runbook. The draft is faithful to the article, but the article is wrong.",
        "ok": false
      },
      {
        "sv": "Jag styrde arbetet via Codex, OpenCode, Grok Build, Cursor och lokala modeller, med Grok Bot som orkestrerade. Jag granskade diffs, behöll eller förkastade, och verifierade tester och de fyra frysta exemplen.",
        "en": "I directed the work through Codex, OpenCode, Grok Build, Cursor and local models, with Grok Bot orchestrating. I reviewed diffs, kept or rejected, and verified the tests and the four frozen examples.",
        "ok": false
      },
      {
        "sv": "Sidofältet visade en live-score, med flera mismatch mellan upprepningarna.",
        "en": "The sidebar showed a live score, with several mismatches between repeats.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nästa taktslag är Gjorde: vad du faktiskt styrde, granskade eller mätte.",
      "en": "The next beat is Action: what you actually directed, reviewed or measured."
    }
  },
  {
    "id": "st-b5-show",
    "level": 6,
    "type": "story",
    "topic": "eval",
    "story": {
      "sv": "B5 · Offline-eval med tre identiska upprepningar",
      "en": "B5 · Offline eval with three identical repeats"
    },
    "beats": [
      {
        "lab": {
          "sv": "Läge",
          "en": "Situation"
        },
        "sv": "Jag behövde kunna säga vad pipelinen faktiskt gör, utan att blanda in en live-modell.",
        "en": "I needed to be able to say what the pipeline actually does, without mixing in a live model."
      },
      {
        "lab": {
          "sv": "Uppgift",
          "en": "Task"
        },
        "sv": "Mäta 44 syntetiska ärenden, adapter none, tre identiska upprepningar.",
        "en": "Measure 44 synthetic tickets, adapter none, three identical repeats."
      },
      {
        "lab": {
          "sv": "Gjorde",
          "en": "Action"
        },
        "sv": "Schema och audit matchade 100 procent, 39 av 44 lämnades över, alla åtta patientdata-fall lämnades över, och det fanns noll mismatch mellan upprepningarna.",
        "en": "Schema and audit matched 100 percent, 39 of 44 handed off, all eight patient-data cases handed off, and there were zero mismatches between repeats."
      }
    ],
    "q": {
      "sv": "Vad är sista taktslaget — Visar?",
      "en": "What is the last beat — What it shows?"
    },
    "choices": [
      {
        "sv": "Evallen är en offline-mätning, inte ett live-modellbetyg, och fail closed plus handoff håller mellan körningar.",
        "en": "The eval is an offline measurement, not a live-model score, and fail closed plus handoff hold across runs.",
        "ok": true
      },
      {
        "sv": "Maskering och handoff sitter före modellsteget, inte som en efterkontroll.",
        "en": "Masking and handoff sit before the model step, not as an after-check.",
        "ok": false
      },
      {
        "sv": "Jag använder andra modeller till att attackera arbetet, och behåller bara det som håller.",
        "en": "I use other models to attack the work, and only keep what holds.",
        "ok": false
      },
      {
        "sv": "Att evallen är ett live-modellbetyg man kan citera som prestanda i produktion.",
        "en": "That the eval is a live-model score you can quote as production performance.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sista taktslaget är Visar: vad berättelsen bevisar, utan nya anspråk.",
      "en": "The last beat is What it shows: what the story proves, without new claims."
    }
  },
  {
    "id": "v-journalsystem",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "journalsystem",
    "q": {
      "sv": "Vad betyder journalsystem här?",
      "en": "What does journalsystem mean here?"
    },
    "choices": [
      {
        "sv": "Electronic health record (EHR). System där vårdpersonal dokumenterar patientens vård.",
        "en": "Electronic health record (EHR). A system where care staff document a patient’s care.",
        "ok": true
      },
      {
        "sv": "Ett automatiskt beslutsstöd som skriver journalen åt vårdpersonalen.",
        "en": "An automatic decision-support tool that writes the record for care staff.",
        "ok": false
      },
      {
        "sv": "Cambio-demots ärendesystem, dit sent levereras.",
        "en": "The Cambio demo’s ticketing system, where sent is delivered.",
        "ok": false
      },
      {
        "sv": "En live-koppling till openEHR som demot redan har.",
        "en": "A live openEHR connection that the demo already has.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Bara en allmän term. Demot har ingen journalåtkomst och inget FHIR/openEHR-anspråk.",
      "en": "Just a general term. The demo has no journal access and no FHIR/openEHR claim."
    }
  },
  {
    "id": "v-beslutsstod",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "beslutsstöd",
    "q": {
      "sv": "Vad är beslutsstöd (CDS)?",
      "en": "What is beslutsstöd (CDS)?"
    },
    "choices": [
      {
        "sv": "Clinical decision support. Stöd för kliniska beslut, inte ett automatiskt beslut.",
        "en": "Clinical decision support. Support for clinical decisions, not an automatic decision.",
        "ok": true
      },
      {
        "sv": "Ett system som får fatta kliniska beslut utan människa.",
        "en": "A system that may take clinical decisions without a human.",
        "ok": false
      },
      {
        "sv": "Demon för support-copiloten: den ger kliniska råd.",
        "en": "The support-copilot demo: it gives clinical advice.",
        "ok": false
      },
      {
        "sv": "Samma sak som en avvikelse-rapport.",
        "en": "The same thing as an incident report.",
        "ok": false
      }
    ],
    "why": {
      "sv": "CDS är stöd, inte ett beslut. Demot ger inte kliniska råd.",
      "en": "CDS is support, not a decision. The demo does not give clinical advice."
    }
  },
  {
    "id": "v-sekretess",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "sekretess",
    "q": {
      "sv": "Vad betyder sekretess i det här sammanhanget?",
      "en": "What does sekretess mean in this context?"
    },
    "choices": [
      {
        "sv": "Confidentiality / professional secrecy. Uppgifter som inte får spridas vidare.",
        "en": "Confidentiality / professional secrecy. Information that must not be passed on.",
        "ok": true
      },
      {
        "sv": "Att audit-loggen får delas fritt eftersom den är maskerad.",
        "en": "That the audit log may be shared freely because it is masked.",
        "ok": false
      },
      {
        "sv": "Att sent betyder att svaret redan gått till vårdenheten.",
        "en": "That sent means the reply has already gone to the care unit.",
        "ok": false
      },
      {
        "sv": "En FHIR-regel i demot.",
        "en": "A FHIR rule in the demo.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Sekretess är tystnadsplikt. I demot är all data syntetisk, och auditen är redan maskerad.",
      "en": "Sekretess is professional secrecy. In the demo all data is synthetic, and the audit is already masked."
    }
  },
  {
    "id": "v-personuppgifter",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "personuppgifter",
    "q": {
      "sv": "Vad är personuppgifter?",
      "en": "What are personuppgifter?"
    },
    "choices": [
      {
        "sv": "Personal data / PII. Uppgifter som kan kopplas till en person.",
        "en": "Personal data / PII. Data that can be linked to a person.",
        "ok": true
      },
      {
        "sv": "Bara personnummer, inget annat.",
        "en": "Only a personnummer, nothing else.",
        "ok": false
      },
      {
        "sv": "Enbart hälsodata i journalsystemet.",
        "en": "Only health data in the journal system.",
        "ok": false
      },
      {
        "sv": "Syntetiska KB-artiklars citations-id:n.",
        "en": "Citation ids of synthetic KB articles.",
        "ok": false
      }
    ],
    "why": {
      "sv": "I demot maskas bland annat personnummer, orgnr, telefon, e-post, id:n och namn — före modellsteget.",
      "en": "In the demo, personnummer, orgnr, phone, email, ids and names are among the things masked — before the model step."
    }
  },
  {
    "id": "v-audit-trail",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "audit trail",
    "q": {
      "sv": "Vad är en audit trail i demot?",
      "en": "What is an audit trail in the demo?"
    },
    "choices": [
      {
        "sv": "Revisionslogg. Spår i JSONL, redan maskerat, över vad som beslutades.",
        "en": "An audit log. A JSONL trail, already masked, of what was decided.",
        "ok": true
      },
      {
        "sv": "En live-leveranslogg till ärendesystemet.",
        "en": "A live delivery log to the ticketing system.",
        "ok": false
      },
      {
        "sv": "Sidofältets live-modellscore.",
        "en": "The sidebar’s live-model score.",
        "ok": false
      },
      {
        "sv": "En journalanteckning som skickas till patienten.",
        "en": "A journal note that is sent to the patient.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Auditen är maskerad JSONL. I demot ligger den i minnet och försvinner när processen stannar.",
      "en": "The audit is masked JSONL. In the demo it lives in memory and disappears when the process stops."
    }
  },
  {
    "id": "v-avvikelse",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "avvikelse",
    "q": {
      "sv": "Vad betyder avvikelse i demot?",
      "en": "What does avvikelse mean in the demo?"
    },
    "choices": [
      {
        "sv": "Incident (report). I demot lämnas en avvikelse alltid över.",
        "en": "An incident (report). In the demo an incident always hands off.",
        "ok": true
      },
      {
        "sv": "En statistikförfrågan per enhet, som i G-009, som alltid blir incident_report.",
        "en": "A per-unit statistics request, as in G-009, which always becomes an incident_report.",
        "ok": false
      },
      {
        "sv": "Ett formulär på demosidan som skickar rapporten.",
        "en": "A form on the demo page that sends the report.",
        "ok": false
      },
      {
        "sv": "Ett vanligt supportärende som kan godkännas som det är.",
        "en": "An ordinary support ticket that can be approved as-is.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Pluginet finns på API/CLI, men det finns inget incidentformulär på sidan. Ordet avvikelse får inte kapa en statistikförfrågan (G-009).",
      "en": "The plugin exists on the API/CLI, but there is no incident form on the page. The word avvikelse must not steal a statistics request (G-009)."
    }
  },
  {
    "id": "v-samordningsnummer",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "samordningsnummer",
    "q": {
      "sv": "Vad är ett samordningsnummer i G-003?",
      "en": "What is a samordningsnummer in G-003?"
    },
    "choices": [
      {
        "sv": "Ett coordination number. I G-003 är det Luhn-ogiltiga id:t inte omskrivet, men ärendet lämnas ändå över.",
        "en": "A coordination number. In G-003 the Luhn-invalid id is not rewritten, but the case still hands off.",
        "ok": true
      },
      {
        "sv": "Ett giltigt personnummer som alltid blir [personnummer-maskat].",
        "en": "A valid personnummer that always becomes [personnummer-maskat].",
        "ok": false
      },
      {
        "sv": "Ett id som godkänns eftersom Luhn misslyckas.",
        "en": "An id that is approved because the Luhn check failed.",
        "ok": false
      },
      {
        "sv": "Namnet på den syntetiska KB-artikeln i ticket-001.",
        "en": "The name of the synthetic KB article in ticket-001.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Avsiktlig lucka: numret kan synas kvar, namnet intill maskas, och Godkänn förblir avstängd.",
      "en": "A deliberate gap: the number may stay visible, the adjacent name is masked, and Godkänn stays disabled."
    }
  },
  {
    "id": "v-citation",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "citation",
    "q": {
      "sv": "Vad är en citation i demot?",
      "en": "What is a citation in the demo?"
    },
    "choices": [
      {
        "sv": "Hänvisning till en syntetisk kunskapsartikel, inte ett live-anrop.",
        "en": "A reference to a synthetic knowledge-base article, not a live model call.",
        "ok": true
      },
      {
        "sv": "Ett live-anrop till den modell som står i id:t, t.ex. deepseek.",
        "en": "A live call to the model named in the id, for example deepseek.",
        "ok": false
      },
      {
        "sv": "Bevis för att artikeln är rätt svar på ärendet.",
        "en": "Proof that the article is the right answer to the ticket.",
        "ok": false
      },
      {
        "sv": "En FHIR-referens till journalen.",
        "en": "A FHIR reference to the journal.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Id:n som opencode-deepseek-v4.1-flash-free:KB-001 är namn på syntetiska artiklar, döpta efter den worker som skrev utkastet.",
      "en": "Ids such as opencode-deepseek-v4.1-flash-free:KB-001 name synthetic articles, after the worker that drafted them."
    }
  },
  {
    "id": "v-retrieval",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "retrieval",
    "q": {
      "sv": "Hur fungerar retrieval i demot?",
      "en": "How does retrieval work in the demo?"
    },
    "choices": [
      {
        "sv": "Token-överlapp med lätt svensk stam, inte en neural ranker.",
        "en": "Token overlap with a light Swedish stem, not a neural ranker.",
        "ok": true
      },
      {
        "sv": "En tränad neural ranker mot produktions-KB.",
        "en": "A trained neural ranker against a production KB.",
        "ok": false
      },
      {
        "sv": "Live-modellen väljer alltid rätt artikel.",
        "en": "The live model always chooses the right article.",
        "ok": false
      },
      {
        "sv": "Användaren söker manuellt i kunskapsbasen.",
        "en": "The user searches the knowledge base by hand.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Därför kan ticket-008 bli en falsk vän. Hit-tröskeln är fryst inför intervjuveckan.",
      "en": "That is why ticket-008 can be a false friend. The hit threshold is frozen for interview week."
    }
  },
  {
    "id": "v-schema",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "schema",
    "q": {
      "sv": "Vad är ett schema i det här flödet?",
      "en": "What is a schema in this flow?"
    },
    "choices": [
      {
        "sv": "Ett JSON-schema. Kontrakt som utdata måste uppfylla, annars fail closed.",
        "en": "A JSON schema. A contract that output must meet, otherwise fail closed.",
        "ok": true
      },
      {
        "sv": "En databas över riktiga patienter.",
        "en": "A database of real patients.",
        "ok": false
      },
      {
        "sv": "Sidofältets tabell med live-scores.",
        "en": "The sidebar table of live scores.",
        "ok": false
      },
      {
        "sv": "En FHIR-profil som demot redan följer.",
        "en": "A FHIR profile that the demo already conforms to.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Ogiltig output blir handoff, inte ett gissat utkast. I evallen var kuverten schema-giltiga till 100 %.",
      "en": "Invalid output becomes a handoff, not a guessed draft. In the eval, envelopes were 100% schema-valid."
    }
  },
  {
    "id": "v-golden",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "golden labels",
    "q": {
      "sv": "Vad är golden labels?",
      "en": "What are golden labels?"
    },
    "choices": [
      {
        "sv": "Fast facit som evallen mäts mot.",
        "en": "A fixed ground truth that the eval is measured against.",
        "ok": true
      },
      {
        "sv": "Etiketter som en live-modell sätter under demon.",
        "en": "Labels that a live model assigns during the demo.",
        "ok": false
      },
      {
        "sv": "Godkända svar som redan skickats till kunden.",
        "en": "Approved replies already sent to the customer.",
        "ok": false
      },
      {
        "sv": "Citations-id:n till printkö-runbooken.",
        "en": "Citation ids for the print-queue runbook.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Verifiering börjar med tester, scheman, golden labels och eval-upprepningar, sedan en mänsklig grind.",
      "en": "Verification starts with tests, schemas, golden labels and eval repeats, then a human gate."
    }
  },
  {
    "id": "v-pdl",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "patientdatalagen",
    "q": {
      "sv": "Vad är patientdatalagen, i korthet?",
      "en": "What is the Patient Data Act, in brief?"
    },
    "choices": [
      {
        "sv": "Svensk lag om patientuppgifter. Demot använder bara syntetisk data.",
        "en": "The Swedish Patient Data Act. The demo uses only synthetic data.",
        "ok": true
      },
      {
        "sv": "En lag som demot redan är certifierat mot.",
        "en": "A law the demo is already certified against.",
        "ok": false
      },
      {
        "sv": "Samma sak som GDPR, utan skillnad.",
        "en": "The same thing as GDPR, with no difference.",
        "ok": false
      },
      {
        "sv": "En Cambio-intern policy för auto-skick.",
        "en": "An internal Cambio policy for auto-send.",
        "ok": false
      }
    ],
    "why": {
      "sv": "Nämn lagen bara som bakgrund. Påstå inte certifiering, och påminn om att demodata är syntetisk.",
      "en": "Mention the Act only as background. Do not claim certification, and recall that demo data is synthetic."
    }
  },
  {
    "id": "v-gdpr",
    "level": 1,
    "type": "vocab",
    "topic": "vocab",
    "term": "dataskyddsförordningen",
    "q": {
      "sv": "Vad är dataskyddsförordningen?",
      "en": "What is dataskyddsförordningen?"
    },
    "choices": [
      {
        "sv": "GDPR. EU-regler för personuppgifter.",
        "en": "GDPR. EU rules for personal data.",
        "ok": true
      },
      {
        "sv": "Enbart svensk patientdatalag, under annat namn.",
        "en": "Only the Swedish Patient Data Act, under another name.",
        "ok": false
      },
      {
        "sv": "En FHIR-standard för journalexport.",
        "en": "A FHIR standard for journal export.",
        "ok": false
      },
      {
        "sv": "Demots automatiska utskick när data är maskad.",
        "en": "The demo’s automatic send once data is masked.",
        "ok": false
      }
    ],
    "why": {
      "sv": "GDPR är EU-regler för personuppgifter. I demot maskas PII före modellsteget, och all data är syntetisk.",
      "en": "GDPR is the EU personal-data rules. In the demo, PII is masked before the model step, and all data is synthetic."
    }
  }
];
