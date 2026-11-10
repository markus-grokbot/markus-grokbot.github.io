/* Verified Cambio interview-prep items. Facts from the public demo and the 2026-11-10 briefing. No invented numbers. */
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
  }
];
