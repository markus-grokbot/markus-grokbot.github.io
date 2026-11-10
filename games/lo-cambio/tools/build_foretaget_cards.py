#!/usr/bin/env python3
"""Cambio · företaget scored cards. Facts only from research 00–06 / SOURCES.md."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "foretaget-cards.json"

AREA = {
    "id": "foretaget",
    "name": "Cambio · företaget",
    "description": "Company, products, customers, regulation and the public job ad — facts from the cited research pack (00–06 / SOURCES.md).",
    "level": 1,
    "defaultOn": True,
    "decisions": [],
}


def scored(cid, difficulty, prompt, choices, correct, hint, reword, explain):
    values = [v for _, v in choices]
    if correct not in values:
        raise SystemExit("%s: correct %r not in %s" % (cid, correct, values))
    if len(choices) < 3:
        raise SystemExit("%s: need >=3 options" % cid)
    if not hint or not reword or not explain:
        raise SystemExit("%s: need hint, reword and explain" % cid)
    return {
        "id": cid,
        "area": "foretaget",
        "level": 1,
        "difficulty": difficulty,
        "type": "choice",
        "prompt": prompt,
        "options": [
            {"label": lab, "pref": "cam:cf:%s:%s" % (cid, val), "value": val}
            for lab, val in choices
        ],
        "correct": correct,
        "hint": hint,
        "reword": reword,
        "explain": explain,
        "scored": True,
        "adaptive": True,
        "source": "research-2026-11-10",
    }


CARDS = [
    scored(
        "cf-founded", 1,
        "När och var grundades Cambio?",
        [
            ("1993 i Linköping", "ok"),
            ("1998 i Stockholm", "1998-sthlm"),
            ("1993 i Colombo", "1993-cmb"),
            ("2019 i Stockholm, när Sanolium bildades", "2019-sanolium"),
        ],
        "ok",
        "Två studenter, tidigt 90-tal, Östergötland.",
        "Cambio was founded in which year and city?",
        "Cambio’s history page: founded in Linköping in 1993 by two students. The first assignment was a journal system for private clinics in Stockholm County. [S2]",
    ),
    scored(
        "cf-hq", 1,
        "Where does the 2025 annual report place Cambio’s head office?",
        [
            ("Stockholm", "ok"),
            ("Linköping", "linkoping"),
            ("Colombo", "colombo"),
            ("Reading", "reading"),
        ],
        "ok",
        "Årsredovisningens rubrik anger huvudkontoret i huvudstaden.",
        "Var ligger huvudkontoret enligt årsredovisningen 2025?",
        "The 2025 annual report headline places the head office in Stockholm. The founding story and the MDR manufacturer address are Linköping — HQ versus historic/legal manufacturing site. [S4, S2, S37]",
    ),
    scored(
        "cf-cosmic-what", 1,
        "Vad är Cambio COSMIC?",
        [
            ("Ett journalsystem (EHR) för regional hälso- och sjukvård", "ok"),
            ("Ett kommunalt omsorgssystem", "viva"),
            ("En öppen hälsodataplattform enligt openEHR", "platform"),
            ("Ett intensivvårdssystem (PDMS)", "cis"),
        ],
        "ok",
        "Det system vårdpersonalen journalför i.",
        "What kind of product is COSMIC?",
        "COSMIC is positioned as the leading electronic health record system in the Nordics: a coordinated regional EHR so bookings, results, medications and treatments share one patient view. [S9]",
    ),
    scored(
        "cf-regions-19", 1,
        "Hur många av Sveriges 21 regioner använder eller ska använda COSMIC enligt årsredovisningen 2025?",
        [
            ("19 av 21", "ok"),
            ("17 av 21", "seventeen"),
            ("21 av 21", "all"),
            ("14 av 21", "mittvaccin"),
        ],
        "ok",
        "Inte alla, men nästan alla — två saknas.",
        "According to the 2025 annual report, COSMIC is contracted in how many of 21 regions?",
        "The 2025 annual report and the Swedish about-page: 19 of 21 regions use or will use COSMIC. The English about-page’s “17 of 21” is the older live count, before Stockholm and Gotland. 14 of 21 is MittVaccin’s contracted figure. [S4, S1, S5, S18]",
    ),
    scored(
        "cf-viva", 1,
        "What is Cambio Viva for?",
        [
            ("Municipal social services, healthcare and care", "ok"),
            ("The regional main electronic health record", "ehr"),
            ("Ambient clinical documentation inside COSMIC", "companion"),
            ("A national vaccination record", "mittvaccin"),
        ],
        "ok",
        "Kommun, inte region.",
        "Vad används Cambio Viva till?",
        "Viva is a process system for municipal social services, healthcare and care, with published modules such as Viva HSL, IFO, UTF and ÄO. [S14]",
    ),
    scored(
        "cf-role-internal", 1,
        "Vad handlar Associate AI Engineer-annonsen främst om?",
        [
            ("Att hjälpa kollegor internt att arbeta smartare med AI", "ok"),
            ("Att sitta i Companion-produktteamet och skriva i patientens journal", "companion-team"),
            ("Att sälja COSMIC till nya regioner", "sales"),
            ("Att träna egna grundmodeller på patientdata", "train-phi"),
        ],
        "ok",
        "Annonsens nyckelmening: helping hundreds of colleagues work smarter through AI.",
        "On the face of the job ad, who are the main users of what this associate would build?",
        "The public ad (DevJobs mirror) leads with helping hundreds of colleagues work smarter through AI: discover pain points, prototype agents and automations, measure impact. That is an internal-enablement role, not a job description for shipping COSMIC Companion. [S51]",
    ),
    scored(
        "cf-hybrid", 1,
        "What office pattern does the Associate AI Engineer ad state?",
        [
            ("Hybrid, three days per week in the office", "ok"),
            ("Fully remote", "remote"),
            ("Five days a week on-site", "five"),
            ("Two weeks in Stockholm and two in Linköping", "split"),
        ],
        "ok",
        "Ett visst antal kontorsdagar i veckan stod i annonsen.",
        "Hur mycket kontorstid nämner annonsen?",
        "The ad: hybrid, three days per week in-office. Place: Stockholm or Linköping. [S51]",
    ),
    scored(
        "cf-takecare", 1,
        "Vilket journalsystem ska COSMIC ersätta i Region Stockholm?",
        [
            ("TakeCare", "ok"),
            ("Millennium", "millennium"),
            ("Epic", "epic"),
            ("Viva", "viva"),
        ],
        "ok",
        "Systemet som använts i Stockholm sedan 1995.",
        "Which incumbent EHR will Cosmic replace in Region Stockholm?",
        "Region Stockholm awarded Cosmic to replace TakeCare (in use since 1995), with Cosmic targeted in place by December 2029. [S26]",
    ),
    scored(
        "cf-headcount", 2,
        "Vilket personalantal ska du föredra om någon frågar hur stort Cambio är?",
        [
            ("1 100 i headcount vid utgången av 2025, enligt den reviderade årsredovisningen", "ok"),
            ("Around 900, som på den engelska about-sidan", "stale-900"),
            ("Cirka 170 000 — det är koncernens anställda", "users"),
            ("Cirka 250, som i Stockholms upphandlingsprojekt", "sthlm-staff"),
        ],
        "ok",
        "Svenska about-sidan säger «runt 1 100»; lita på 2025 års tabell framför den engelska sidan.",
        "Which headcount figure is the one to quote from the 2025 annual report?",
        "Year-end 2025 sustainability KPIs: 1,100 headcount / 1,081 FTE / average FTE 1,021. The English about-page still says “around 900” and should be treated as stale. “More than 170,000 users” is a usage figure, not staff. [S4, S1, S5, S6]",
    ),
    scored(
        "cf-offices-eng", 2,
        "Stockholm, Linköping and Colombo all appear in Cambio’s office list. What is Colombo described as?",
        [
            ("A software-engineering location, not a published customer market", "ok"),
            ("Cambio’s head office", "hq"),
            ("The group’s main Nordic sales market", "sales"),
            ("A regional EHR customer", "customer"),
        ],
        "ok",
        "Sri Lanka i årsredovisningen är utveckling, inte en säljmarknad.",
        "Vad är kontoret i Colombo enligt källorna?",
        "The contact page lists Cambio Software Engineering in Colombo. The 2025 report treats Sri Lanka as engineering headcount (353 average employees / 376 headcount), not as a customer geography. [S3, S4]",
    ),
    scored(
        "cf-ownership", 2,
        "Vem äger Cambio-koncernen i grova drag enligt årsredovisningen 2025?",
        [
            ("Ungefär 80 % Investcorp via holdingbolag, ungefär 20 % medarbetare och nyckelpersoner", "ok"),
            ("Börsnoterat med spritt aktieägarägande", "listed"),
            ("Helägt av Region Stockholm", "region"),
            ("Helägt av grundarna utan extern ägare", "founders"),
        ],
        "ok",
        "Ett investmentbolag har majoriteten; personal har en minoritetspost.",
        "Who is the majority owner described in the 2025 annual report?",
        "Sanolium Group Holding AB is owned approximately 80% by Investcorp and approximately 20% by employees and other key individuals. The reporting parent is Sanolium AB (publ). Prefer that picture rather than inventing a cleaner registry diagram. [S4]",
    ),
    scored(
        "cf-platform", 2,
        "What sits at the heart of Cambio Platform as publicly described?",
        [
            ("A Clinical Data Repository fully based on openEHR", "ok"),
            ("A FHIR-only integration bus with no data store", "fhir-bus"),
            ("Ambient speech-to-text", "scribe"),
            ("A municipal case-management module", "viva"),
        ],
        "ok",
        "En CDR enligt en öppen journaldatamodell.",
        "Vad är kärnan i Cambio Platform?",
        "Cambio Platform is publicly “the future health data platform”. At its heart is a Clinical Data Repository fully based on openEHR, plus Core Services (patient register mapped to an openEHR EHR id, SNOMED CT) and openEHR-forms. [S10]",
    ),
    scored(
        "cf-open-services", 2,
        "Vad är standarden Cambio Open Services främst exponerar?",
        [
            ("FHIR-profiler, plus några REST-API:er som de vill fasa mot FHIR", "ok"),
            ("Enbart HL7 v2-meddelanden", "hl7v2"),
            ("Enbart openEHR AQL utåt", "aql"),
            ("GraphQL som enda offentliga gränssnitt", "graphql"),
        ],
        "ok",
        "Default för integrationer och partners, enligt FHIR Demo 2024 och utvecklarportalen.",
        "What API style is default in Cambio Open Services?",
        "Most Open Services APIs are FHIR profiles adapted to COSMIC; remaining REST APIs are intended to be replaced with FHIR over time. At FHIR Demo 2024 Cambio wrote that FHIR is its default standard for integrations and partners. The developer portal is powered by Azure API Management — that is the portal, not a claim about COSMIC production hosting. [S22, S35]",
    ),
    scored(
        "cf-companion", 2,
        "Vad är första steget i COSMIC Companion?",
        [
            ("En inbyggd ambient scribe som skriver journalutkast från samtalet, som klinikern ska granska", "ok"),
            ("Ett regelbaserat strokelarm (CHA2DS2-VASc)", "cds"),
            ("Ett fristående fönster utanför COSMIC", "standalone"),
            ("Automatiska beställningar som skickas utan godkännande", "auto-order"),
        ],
        "ok",
        "Digital kollega inuti COSMIC: utkast, inte autoskick.",
        "What does COSMIC Companion do first, according to the product page?",
        "Companion’s first step is Ambient Scribe: it listens to the clinician–patient conversation and creates structured draft notes in real time, following COSMIC’s patient context. Upcoming “smarta beställningar” are suggestions for the clinician to review and approve — not silent send. [S13]",
    ),
    scored(
        "cf-leapscribe", 2,
        "What is Cambio’s published direction for LeapScribe?",
        [
            ("Acquired in 2025, folded into COSMIC Companion; standalone LeapScribe is being wound down", "ok"),
            ("It remains the main standalone AI product", "standalone"),
            ("It was never acquired", "never"),
            ("It replaced COSMIC as the regional EHR", "replaced"),
        ],
        "ok",
        "Köpt 27 juni 2025; den 2 november 2026 sade de att fristående LeapScribe fasas ut på tre månader.",
        "Vad hände med LeapScribe enligt Cambio?",
        "LeapScribe Sverige AB was acquired on 27 June 2025. On 13 October 2025 the ambient scribe was renamed Cambio COSMIC Companion. On 2 November 2026 Cambio said it will wind down standalone LeapScribe over three months and put AI directly into COSMIC and the wider portfolio. [S4, S20, S21]",
    ),
    scored(
        "cf-seventeen", 2,
        "Hur räknas «19 av 21 regioner» ihop?",
        [
            ("17 regioner kör redan COSMIC; Stockholm och Gotland är kontrakterade utöver det", "ok"),
            ("19 regioner är redan live", "all-live"),
            ("Alla 21 regioner plus två sjukhus", "21-plus"),
            ("Bara de nio Sussa-regionerna", "sussa-only"),
        ],
        "ok",
        "Live-siffran på Sussa-sidan är 17; två stora avtal tillkom 2025.",
        "Why do some pages say 17 regions and others say 19?",
        "Cambio’s Sussa page: COSMIC is used in 17 regions plus Capio S:t Göran. Stockholm and Gotland take the contracted total to 19 of 21. [S24, S4]",
    ),
    scored(
        "cf-sussa", 3,
        "What is Sussa Samverkan in Cambio’s telling?",
        [
            ("Nine regions that jointly procured COSMIC, now all live, delivered as a managed service", "ok"),
            ("The eight long-standing KGC regions plus Capio S:t Göran", "kgc"),
            ("Stockholm and Gotland’s shared implementation office", "sthlm"),
            ("A Danish intensive-care network", "dk"),
        ],
        "ok",
        "Nio regioner, live 2024–2025, managed service.",
        "Vad är Sussa i Cambio-sammanhang?",
        "Sussa’s nine regions: Blekinge, Dalarna, Gävleborg, Halland, Norrbotten, Sörmland, Västerbotten, Västernorrland and Örebro län. Joint procurement awarded in 2018; Cambio says all nine are now live, implemented as a managed service. [S24, S4]",
    ),
    scored(
        "cf-sthlm-deal", 3,
        "Vad stämmer om Region Stockholm och Region Gotlands COSMIC-avtal?",
        [
            ("Tilldelning 18 feb 2025, kontrakt 18 nov 2025, införande sikte december 2029, ersätter TakeCare", "ok"),
            ("Kontrakt 2018 som redan är live i hela regionen", "2018"),
            ("Införande redan klart under 2025", "done-2025"),
            ("Ersätter Viva i Stockholms stad", "stad"),
        ],
        "ok",
        "Överklaganden efter tilldelningen; påskrift i november 2025.",
        "When was the Stockholm/Gotland Cosmic contract signed, and when is go-live targeted?",
        "Regionstyrelsen awarded the main EHR contract to Cambio / Cosmic on 18 February 2025, jointly with Gotland. After appeals the contract was signed on 18 November 2025. TakeCare remains until the new system is in place, estimated December 2029. [S26, S27, S28]",
    ),
    scored(
        "cf-cds-vs-companion", 3,
        "How should you tell CDS apart from Companion?",
        [
            ("CDS is published as rules-and-guidelines decision support; Companion is generative/ambient documentation with human review", "ok"),
            ("They are two names for the same generative model", "same"),
            ("CDS drafts notes from the consultation; Companion computes CHA2DS2-VASc", "swapped"),
            ("Companion is only for municipalities; CDS is only for vaccination", "domains"),
        ],
        "ok",
        "Det ena är riktlinjer och regler; det andra skriver utkast från samtalet.",
        "Vad är skillnaden mellan Cambio CDS och COSMIC Companion?",
        "CDS combines patient-specific data with evidence-based rules (the published Stroke Prevention App adapts Socialstyrelsen guidelines and computes CHA2DS2-VASc). Recommendations are described as non-intrusive; the clinician decides. Companion is an in-COSMIC ambient scribe first, later suggested actions with explicit review. Don’t blur the two. [S11, S13]",
    ),
    scored(
        "cf-same-cosmic", 3,
        "Finns det ett «nytt» och ett «gammalt» Cosmic enligt Cambio?",
        [
            ("Nej — alla svenska kunder använder samma Cosmic, men konfigurationen skiljer sig åt", "ok"),
            ("Ja, Sussa kör en ny produkt och KGC en gammal", "two-products"),
            ("Ja, Stockholm får en moln-only-variant som ingen annan har", "cloud-only"),
            ("Ja, Companion ersätter Cosmic som journalsystem", "replaced"),
        ],
        "ok",
        "Samma produkt i versioner; den kan se olika ut i två regioner.",
        "Is there a separate “new Cosmic” and “old Cosmic”?",
        "Cambio says there is not a new and an old Cosmic: all Swedish customers use the same Cosmic, released in versions, but configuration differs by customer — which is why it can look different in two regions. [S24, S27]",
    ),
    scored(
        "cf-openehr-fhir", 3,
        "openEHR eller FHIR — vad använder Cambio enligt de publika sidorna?",
        [
            ("Båda, till olika jobb: openEHR i Platforms datalager, FHIR som default för integrationer", "ok"),
            ("Bara openEHR, aldrig FHIR", "only-openehr"),
            ("Bara FHIR, ingen datalagring", "only-fhir"),
            ("De har bytt till en egen sluten modell", "closed"),
        ],
        "ok",
        "Inte antingen-eller.",
        "Do Cambio’s public pages treat openEHR and FHIR as an either/or choice?",
        "openEHR is how Platform describes the CDR and forms. FHIR is how they say they want to expose and integrate — default for new interfaces and partners, plus Open Services. They solve different jobs. [S10, S22, S35]",
    ),
    scored(
        "cf-controller", 3,
        "In IMY’s general description, who is the controller when a vendor runs a journal system for a region?",
        [
            ("The care provider (vårdgivaren) is controller; the supplier is typically a processor", "ok"),
            ("The EHR vendor is always the controller", "vendor"),
            ("The patient is the controller for the whole record", "patient"),
            ("The group’s majority owner is the controller", "owner"),
        ],
        "ok",
        "Vårdgivaren är personuppgiftsansvarig; leverantören är typiskt biträde.",
        "Vem är personuppgiftsansvarig när en leverantör kör ett journalsystem åt en region?",
        "IMY’s general description of an IT journal-system vendor — not a Cambio-specific legal opinion: the care provider remains controller (personuppgiftsansvarig); the supplier is typically a processor (biträde). Health data are a special category under GDPR; Swedish complements include patientdatalagen (2008:355). [S39, S40, S38]",
    ),
    scored(
        "cf-epic", 3,
        "Är Epic ett regionalt huvudjournalsystem i Sverige enligt källorna i research-packen?",
        [
            ("Nej — den levande nordiska jämförelsen är Danmark (Köpenhamn); svenska jätteupphandlingar har gällt Cosmic, TakeCare, Systematic och Millennium", "ok"),
            ("Ja, Epic vann Stockholm 2025", "won-sthlm"),
            ("Ja, Skåne kör Epic live som huvudjournal", "skane"),
            ("Ja, alla regioner utanför Sussa kör Epic", "outside-sussa"),
        ],
        "ok",
        "Sundhedsplatformen, inte en svensk regionvinnare i de här källorna.",
        "What do the cited sources say about Epic in Sweden versus Denmark?",
        "SVT refers to Epic in Copenhagen (Sundhedsplatformen). No source in this pack names Epic as a live main EHR in a Swedish region. Recent Swedish mega-procurements have been Cosmic versus TakeCare/CGM, Systematic and Millennium. [S49, S26]",
    ),
    scored(
        "cf-safety-how", 3,
        "Om de frågar om den offentliga kritiken mot Cosmic och patientsäkerhet — vad är den mest rimliga hållningen?",
        [
            ("Erkänn att det finns offentlig rapportering och en pågående regionsgranskning; diagnostisera inte enskilda fall du inte har läst", "ok"),
            ("Lista detaljer från granskningen som om du själv utrett fallen", "recite"),
            ("Avfärda journalistiken som påhitt utan att ha läst underlaget", "dismiss"),
            ("Påstå att du känner den medicinska orsaken i varje omtalat fall", "diagnose"),
        ],
        "ok",
        "Acknowledge, don’t litigate.",
        "If asked about public Cosmic patient-safety coverage, what should you do?",
        "The research pack’s advice: acknowledge the public reporting and that regions have commissioned a review; do not invent clinical conclusions; do not attack journalists or defend case facts you have not read. Large EHR go-lives are socio-technical — product, configuration, training and workflow all show up in deviations. [S47, S48, S24]",
    ),
    scored(
        "cf-stale-english", 4,
        "The English about-page still says “around 900” staff and “17 of 21 regions”. What should you do with that?",
        [
            ("Treat it as stale; prefer the Swedish about-page and the 2025 annual report", "ok"),
            ("Prefer the English page because it is written for international readers", "prefer-en"),
            ("Average the two headcounts and say about 1 000 without a source", "average"),
            ("Ignore the annual report when it disagrees with the website", "ignore-ar"),
        ],
        "ok",
        "SOURCES.md säger uttryckligen att den engelska sidan släpar efter [S1] och [S4].",
        "Vilka siffror ska du inte citera från cambiogroup.com/about-us utan reservation?",
        "The English about-page ([S5]) still says “around 900” and “17 of 21 regions”, which conflict with the Swedish about-page and the 2025 annual report (about 1,100 staff; 19 of 21 regions). Prefer [S1] and [S4]. [S5, S1, S4]",
    ),
    scored(
        "cf-sanolium", 4,
        "Vad är Sanolium AB i förhållande till Cambio?",
        [
            ("Moderbolaget i årsredovisningen 2025; publikt obligationsemittent, inte ett noterat aktiebolag", "ok"),
            ("Det danska säljbolaget", "denmark"),
            ("Ett regionägt holdingbolag", "region-owned"),
            ("Namnet på journalsystemet före COSMIC", "old-name"),
        ],
        "ok",
        "Org.nr 559176-1423; ägs uppåt via Sanolium Holding / Group Holding.",
        "What is Sanolium AB (publ)?",
        "The 2025 annual and sustainability report is issued by Sanolium AB (publ). The group issued a corporate bond in 2019 and is therefore a public bond issuer, not listed equity. The employer on the Associate AI Engineer ad is Cambio Healthcare Systems AB. [S4, S51]",
    ),
    scored(
        "cf-two-left", 4,
        "Vilka två regioner saknar Cosmic-avtal enligt rapportering i augusti 2026?",
        [
            ("Skåne och Västra Götaland, som gått Millennium-vägar som båda senare övergavs", "ok"),
            ("Stockholm och Gotland", "sthlm-gotland"),
            ("Uppsala och Östergötland", "kgc-pair"),
            ("Halland och Blekinge", "sussa-pair"),
        ],
        "ok",
        "De två storregionerna i söder och väst.",
        "Which two regions were reported as being outside a Cosmic contract in August 2026?",
        "Svensk Farmaci (20 August 2026): only Skåne and Västra Götaland had chosen Millennium. In April 2026 Region Skåne decided to stop its Millennium variant (SDV) and compare alternatives; VGR decided the same month to scrap Millennium and pursue a modular system. [S48]",
    ),
    scored(
        "cf-kgc", 4,
        "What is KGC — Kundgrupp Cosmic?",
        [
            ("Eight long-standing regions plus privately owned Capio S:t Göran", "ok"),
            ("The nine Sussa regions that went live in 2024–2025", "sussa"),
            ("Stockholm City’s municipal IT board", "stad"),
            ("Cambio’s Sri Lanka engineering organisation", "lk"),
        ],
        "ok",
        "Bildad 2007; åtta regioner plus ett sjukhus.",
        "Vad ingår i KGC utöver åtta regioner?",
        "KGC (formed 2007) is eight long-standing regions — Jämtland Härjedalen, Jönköping, Kalmar, Kronoberg, Uppsala, Värmland, Västmanland and Östergötland — plus Capio S:t Göran. Their support and maintenance agreement was extended from 1 January 2024 for five years, with a possible further three. [S25]",
    ),
    scored(
        "cf-stad-vs-region", 4,
        "Varför ska du inte blanda ihop Region Stockholm och Stockholms stad här?",
        [
            ("Regionen upphandlar Cosmic (ersätter TakeCare); staden skrev 2026 avtal med Tieto Caretech Lifecare för kommunala utförare", "ok"),
            ("De är samma kund och samma system", "same"),
            ("Staden kör COSMIC som huvudjournal", "stad-cosmic"),
            ("Regionen valde Lifecare som huvudjournalsystem", "region-lifecare"),
        ],
        "ok",
        "Hälso- och sjukvård kontra kommunal omsorg.",
        "How is Stockholms stad’s March 2026 system choice different from Region Stockholm’s EHR deal?",
        "Region Stockholm is healthcare: Cosmic replacing TakeCare by about 2029. On 25 March 2026 Stockholms stad signed Tieto Caretech Lifecare for executors in social services, elderly care and municipal healthcare, for up to 13 years. Different customer, different product. [S26, S53]",
    ),
    scored(
        "cf-ai-act", 4,
        "What should you not claim about Companion and the EU AI Act?",
        [
            ("That Companion is formally classified as a high-risk AI system — Cambio has not published that classification here", "ok"),
            ("That the AI Act can never apply alongside GDPR or patientdatalagen", "never-parallel"),
            ("That IMY has stated Companion is outside the AI Act", "imy-exempt"),
            ("That NIS2 replaced the AI Act for all EHR vendors", "nis2-replaced"),
        ],
        "ok",
        "Förordningen kan gälla parallellt med GDPR/PDL; Companion-klassningen är inte publicerad i packen.",
        "Vad ska du inte hitta på om COSMIC Companion och AI-förordningen?",
        "The AI Act is Regulation (EU) 2024/1689. IMY states that if personal data are processed when an organisation develops or uses AI, the AI Act may apply in parallel with GDPR/PDL. Do not tell an interviewer that Companion is formally classified as a high-risk AI system — that classification is not published on the pages fetched for this pack. [S39, S42]",
    ),
    scored(
        "cf-no-cloud", 4,
        "Vilket påstående om hosting ska du undvika?",
        [
            ("Att produktionen av COSMIC körs hos en namngiven molnleverantör", "ok"),
            ("Att Open Services-portalen anges som powered by Azure API Management", "apim"),
            ("Att MittVaccin beskrivs som svensk SaaS med lagring och bearbetning i Sverige", "mittvaccin"),
            ("Att Sussa-COSMIC levereras som managed service", "managed"),
        ],
        "ok",
        "Ingen publik uppgift namnger molnleverantören för kärn-EHR:n.",
        "What cloud claim is not supported by the cited sources?",
        "No public statement was found naming the cloud vendor that hosts production COSMIC. Azure API Management is stated only for the Open Services developer portal. MittVaccin is described as Swedish SaaS with storage and processing in Sweden at a procured partner. Sussa COSMIC is delivered as a managed service without a named host. [S22, S18, S4]",
    ),
    scored(
        "cf-role-terms", 4,
        "Which set of terms matches the public Associate AI Engineer ad?",
        [
            ("Stockholm or Linköping; permanent with a 6-month trial; Swedish and English; background check; not described as the Companion product team", "ok"),
            ("Remote-only from Colombo; English only", "colombo"),
            ("Fixed-term three months as Companion product owner in Reading", "reading"),
            ("No screening, because the posting says the work is unsensitive", "no-check"),
        ],
        "ok",
        "Plats, språk, prövotid och bakgrundskontroll står i annonsen; teamplacering på Companion gör det inte.",
        "Vad stämmer om den utannonserade associate-rollen?",
        "Employer: Cambio Healthcare Systems AB. Place: Stockholm or Linköping. Full-time, permanent, six-month trial period. Hybrid, three office days. Swedish and English. Background check on the final candidate because the role involves access to sensitive information. The ad is internal enablement on its face, not a Companion team placement. [S51]",
    ),
    scored(
        "cf-mdr", 2,
        "Which MDR class are COSMIC and CDS certified under?",
        [
            ("Class IIa", "ok"),
            ("Class I, same as MittVaccin", "class-i"),
            ("Class III only", "class-iii"),
            ("They are not medical devices", "not-devices"),
        ],
        "ok",
        "BSI-certifikat för både journalsystemet och beslutsstödet.",
        "Vilken MDR-klass har COSMIC och CDS enligt certifikatet Cambio publicerar?",
        "Compliance page and BSI certificate MDR 771804 R000: Cambio COSMIC EHR — Class IIa and Cambio CDS — Class IIa. First issued 13 August 2024, expires 12 August 2029. MittVaccin is separately described as CE-marked under MDR Class I. [S36, S37, S18]",
    ),
    # Wait I already have 8 D2 cards before this. Adding cf-mdr as D2 would make 9 D2.
    # I'll leave it - actually let me recount after building.
    scored(
        "cf-sthlm-value", 5,
        "Vilket avtalsvärde anger Region Stockholm för första perioden?",
        [
            ("2 375 miljoner kronor över tolv år", "ok"),
            ("331,3 MSEK — det är Q1 2026-koncernintäkten", "q1"),
            ("85 miljoner euro, som i en pressuppgift om Åland", "aland"),
            ("1 000 MSEK, som obligationsramen", "bond"),
        ],
        "ok",
        "Första perioden, kvalitet plus pris, tolvårigt.",
        "What first-term contract value did Region Stockholm state for Cosmic?",
        "Region Stockholm states a first-term contract value of 2,375 million SEK over twelve years, chosen on a mix of price and quality. Cosmic is targeted in place by December 2029. The EUR 85 million over 18 years figure is press-reported for Åland, not Stockholm, and is not in Cambio’s award text. [S26, S33]",
    ),
    scored(
        "cf-mittvaccin", 5,
        "How does MittVaccin differ from COSMIC and CDS on MDR class, as published?",
        [
            ("MittVaccin is CE-marked under MDR Class I; COSMIC and CDS are Class IIa", "ok"),
            ("All three are Class IIa", "all-iia"),
            ("MittVaccin is Class III; the others are Class I", "swapped"),
            ("None of them are described as medical devices", "none"),
        ],
        "ok",
        "En lättare klass än journalsystemet och CDS.",
        "Vilken MDR-klass anger MittVaccins produktsida?",
        "MittVaccin’s product page: CE-marked under MDR Class I. COSMIC and CDS are Class IIa. The annual report: MittVaccin contracted by 14 of 21 regions plus private providers at year-end 2025. [S18, S37, S4]",
    ),
    scored(
        "cf-nis2", 5,
        "Hur är NIS2 infört i svensk rätt enligt research-packen?",
        [
            ("Delvis genom cybersäkerhetslagen (2025:1506), som trädde i kraft 15 januari 2026", "ok"),
            ("Genom patientdatalagen (2008:355)", "pdl"),
            ("Genom MDR (EU) 2017/745", "mdr"),
            ("Det är inte infört och gäller bara banker", "not-se"),
        ],
        "ok",
        "En svensk lag från december 2025, i kraft i januari 2026.",
        "When did Sweden’s NIS2-related cybersäkerhetslag enter into force?",
        "NIS2 is Directive (EU) 2022/2555. Sweden implemented it in part through cybersäkerhetslagen (2025:1506), issued 11 December 2025 and in force 15 January 2026. Healthcare is an in-scope sector. The pack does not classify whether Cambio itself is a direct operator under the Act; customers who are regions will still pass supply-chain expectations to a core EHR vendor. [S43, S44]",
    ),
    scored(
        "cf-iso27001", 5,
        "What does the published ISO/IEC 27001 certificate for Cambio Healthcare Systems AB say?",
        [
            ("ISO/IEC 27001:2022, valid until 11 January 2027, covering development, maintenance and sales of EHR applications and related services", "ok"),
            ("It expired in 2024 and was not renewed", "expired"),
            ("It certifies only the Colombo office", "colombo-only"),
            ("It is the MDR Class IIa device certificate", "mdr"),
        ],
        "ok",
        "Intertek 0164637, utfärdat 6 november 2024.",
        "Vad gäller Cambio:s publicerade ISO 27001-certifikat?",
        "Intertek certificate 0164637 for Cambio Healthcare Systems AB, ISO/IEC 27001:2022, issued 6 November 2024 and valid until 11 January 2027. Scope: development, maintenance and sales of EHR applications and related implementation and support services. Additional certified sites include Linköping, Reading, Colombo and Aarhus. [S7]",
    ),
    scored(
        "cf-pdl-retention", 5,
        "Vad gäller som huvudregel för hur länge journaluppgifter och åtkomstloggar ska sparas, enligt PDL/IMY-materialet i packen?",
        [
            ("Journalhandlingar minst tio år efter sista anteckningen; åtkomstloggar minst fem år", "ok"),
            ("Allt får raderas efter 30 dagar", "30d"),
            ("Journaler två år, loggar tio år", "swapped"),
            ("Inget bevarandekrav finns i svensk rätt", "none"),
        ],
        "ok",
        "Journal längre än logg.",
        "Under the Swedish record-keeping rules cited via IMY, how long must records and access logs generally be kept?",
        "Journal documents must as a rule be retained at least ten years after the last entry (patientdatalagen 3 kap. 17 §). Access logs must be stored at least five years (HSLF-FS 2016:40 4 kap. 9 b §). [S38, S39]",
    ),
    scored(
        "cf-cis-cdc", 5,
        "How do Cambio CIS and CDC relate?",
        [
            ("CIS is a PDMS for anaesthesia and intensive care; CDC connects medical devices and translates their data", "ok"),
            ("CDC is the regional EHR and CIS is the municipal system", "swapped"),
            ("Both are names for COSMIC Companion", "companion"),
            ("CIS is only the FHIR sandbox", "sandbox"),
        ],
        "ok",
        "IVA och anestesi kontra koppling av mer än 900 medicintekniska produkter.",
        "Vad är skillnaden mellan Cambio CIS och CDC?",
        "CIS is a patient data management system for anaesthesia and intensive care (modules CIS IVA & NEO and CIS AN), described as integrated with COSMIC. CDC (Cambio Device Connectivity) connects more than 900 medical devices onto one platform and translates the data into a uniform language. [S15, S16]",
    ),
    scored(
        "cf-systematic", 5,
        "Vilken roll hade Systematic i Stockholm/Gotland-upphandlingen enligt presskällorna?",
        [
            ("De tävlade om avtalet och överklagade tilldelningen; kammarrätten meddelade inte prövningstillstånd", "ok"),
            ("De vann och levererar TakeCare", "won"),
            ("De är Epic-återförsäljare i Sverige", "epic"),
            ("De äger Cambio", "owns"),
        ],
        "ok",
        "Dansk leverantör; nämns tillsammans med CGM i överklaganden.",
        "What do cited sources say Systematic did in the Stockholm/Gotland EHR procurement?",
        "Systematic competed for Stockholm/Gotland and appealed the award. Läkartidningen reported that the Administrative Court of Appeal refused leave (27 October 2025). [S29]",
    ),
    scored(
        "cf-millennium", 5,
        "What happened to Oracle Health / Cerner Millennium in the cited Swedish stories?",
        [
            ("Excluded from the Stockholm/Gotland qualification; Skåne and VGR later abandoned their Millennium paths in April 2026", "ok"),
            ("It won Stockholm and goes live in 2026", "won"),
            ("It is Cambio’s partner for Companion", "partner"),
            ("It replaced Cosmic in the Sussa regions", "sussa"),
        ],
        "ok",
        "Diskvalificerad i Stockholm; två storregioner backade 2026.",
        "Vad säger källorna om Millennium i Sverige?",
        "Millennium was excluded from the Stockholm/Gotland procurement at qualification; the appeal was lost. Svensk Farmaci reported that both Skåne and Västra Götaland decided in April 2026 to abandon their Millennium paths. [S26, S48]",
    ),
]


def main():
    ids = [c["id"] for c in CARDS]
    dups = [i for i, n in Counter(ids).items() if n > 1]
    if dups:
        raise SystemExit("duplicate ids: %s" % dups)
    blob = json.dumps(CARDS, ensure_ascii=False)
    for bad in ["Martin Rehn", "martin.rehn", "@cambio.se", "3,210 deviations", "seven deaths", "sju dödsfall"]:
        if bad.lower() in blob.lower():
            raise SystemExit("redaction or safety-specific leak: %s" % bad)
    by = Counter(c["difficulty"] for c in CARDS)
    print("count", len(CARDS), "by difficulty", dict(sorted(by.items())))
    for d in range(1, 6):
        if by[d] < 5:
            raise SystemExit("need a 1–5 spread, difficulty %d has %d" % (d, by[d]))
    doc = {
        "version": 1,
        "note": "Scored company-research cards for Lo Cambio. Facts from research/00–06 and SOURCES.md only.",
        "areas": [AREA],
        "cards": CARDS,
    }
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("wrote", OUT, OUT.stat().st_size, "bytes")


if __name__ == "__main__":
    main()
