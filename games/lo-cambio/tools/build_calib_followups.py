#!/usr/bin/env python3
"""Add spoken-answer calibration follow-ups. Facts only; no employee names."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from intervju_lib import OUT, cal

NEW = [
    cal(
        "cal-motivation-onesentence",
        "motivation_onesentence",
        "Säg din motivation i en mening, och börja meningen med Cambio — inte med dig själv.",
        [
            ("Leda med samhällsnytta och vård: Cambio bygger teknik som används i vården, och det väger extra för mig utöver att jag vill in i tech.", "lead-care"),
            ("Leda med foten i tech: jag vill få in en fot ordentligt i tech, och Cambio är extra intressant för att det är samhällsnytta.", "lead-foothold"),
            ("Nämn lojalitet: när villkoren är bra tenderar jag att stanna; Cambio lockar för samhällsnytta och vård, inte bara för att det är tech.", "mention-loyalty"),
        ],
        "Så här kan det låta: »Cambio lockar för att ni bygger samhällsnyttig teknik i vården, och jag vill få en ordentlig fot i tech i ett sammanhang jag kan bli långsiktigt lojal mot.«",
    ),
    cal(
        "cal-opening-two-sentences",
        "opening_spoken",
        "Din öppning på exakt två meningar. Vad säger du när du sätter dig?",
        [
            ("Mest demot: jag byggde det efter intervjuinbjudan för att visa hur jag använder AI-verktyg på något konkret.", "lead-demo"),
            ("Mest anpassning: jag utgick från offentliga uppgifter, och ju tydligare krav jag får desto mer specifikt kan jag bygga vidare.", "lead-adapt"),
            ("Båda: en mening om att demot kom efter inbjudan, en om att det bygger på publika fakta och att jag gärna går djupare om de vill.", "both"),
        ],
        "Så här kan det låta: »Jag byggde demot efter att jag fick frågan om intervju, utifrån offentliga uppgifter om Cambio, för att visa hur jag använder AI-verktyg konkret. Ju tydligare krav jag får, desto mer specifikt kan jag bygga vidare.«",
    ),
    cal(
        "cal-unwatched-ask-first",
        "unwatched_spoken",
        "De har inte tittat på demot. Formulera i en mening hur du frågar hur mycket du ska utgå från det.",
        [
            ("Fråga rakt: vill ni att jag utgår mycket, lite eller mittemellan från demot?", "ask-scale"),
            ("Erbjud valet: jag kan visa ett fall på en minut, berätta mönstret, eller lämna demot.", "offer-menu"),
            ("Kort check: hur mycket har ni sett, så anpassar jag mängden?", "how-much-seen"),
        ],
        "Så här kan det låta: »Hur mycket vill ni att jag utgår från demot — mycket, lite eller mittemellan? Jag anpassar mig efter det.«",
    ),
    cal(
        "cal-coaching-spoken",
        "coaching_spoken",
        "Säg i två korta meningar hur du vill ha coaching kontra eget utrymme.",
        [
            ("Lyssna först: seniorernas input är huvudspåret, och jag utgår från den.", "seniors-first"),
            ("Fråga efter utrymme: jag följer rutinerna, men ber om plats att testa verktyg och metoder som jag ser fungerar.", "ask-space"),
            ("Båda i samma andetag: uppmärksam på seniorerna, och tydlig med när jag vill få prova själv.", "both"),
        ],
        "Så här kan det låta: »Jag räknar med att lyssna noga på seniorerna och utgå från era rutiner. Samtidigt vill jag fråga efter utrymme att testa verktyg och metoder som jag ser fungerar.«",
    ),
    cal(
        "cal-tools-spoken",
        "tools_spoken",
        "De frågar vilka AI-verktyg du använder. Hur håller du svaret till en eller två meningar?",
        [
            ("Räkna snabbt upp setet, sen säg att bredden över modellfamiljer och harnesses är det mer relevanta.", "list-then-pivot"),
            ("Börja med harnesses och verifiering, nämn verktygsnamn bara om de ber om dem.", "harness-first"),
            ("Svara ärligt på namn om de frågar, och säg att du håller dig till deras stack om de vill det.", "follow-their-stack"),
        ],
        "Så här kan det låta: »Jag kan räkna upp verktygen jag använder, men det mer relevanta är att jag är van vid flera modellfamiljer och harnesses. Om ni vill att jag håller mig till ett visst verktyg gör jag det.«",
    ),
    cal(
        "cal-salary",
        "salary",
        "Hur vill du prata lön och förväntningar, om det kommer upp?",
        [
            ("Be först om deras spann för associate-rollen, och utgå från det.", "ask-band-first"),
            ("Säg att du söker en schysst ingång på associate-nivå och vill veta hur lönen ses över efter en tid, utan att låsa ett tal först.", "fair-start-review"),
            ("Om de pressar på en siffra: du har tidigare utgått från cirka 25 000 kr/mån som bas, och omkring 35 000 när spannet tydligt ligger högre, med att det kan ses över efter några månader.", "documented-range"),
        ],
        "Så här kan det låta: »Jag är mer intresserad av en schysst ingång på associate-nivå och hur lönen ses över än att låsa ett tal nu. Om ni har ett spann för rollen hör jag gärna det först.«",
    ),
    cal(
        "cal-availability",
        "availability",
        "Om de frågar när du kan börja, och om du har uppsägningstid — vad säger du?",
        [
            ("Kort varsel: tillgänglig från den 15 november 2026, med reservation för enstaka korta pass som kan flytta startdatumet någon dag.", "from-15-nov"),
            ("Betona att du inte har uppsägningstid från en heltidsanställning, så start är mer en kalenderfråga än en uppsägningsfråga.", "no-notice"),
            ("Fråga vad som passar dem, och säg att du i regel kan börja med kort varsel.", "ask-their-date"),
        ],
        "Så här kan det låta: »Jag har ingen uppsägningstid från en heltidsroll, så jag kan i regel börja med kort varsel — från den 15 november, med reservation för enstaka korta pass som kan flytta datumet någon dag.«",
    ),
    cal(
        "cal-remote-office",
        "remote_office",
        "Hur vill du beskriva distans kontra kontor, i en eller två meningar?",
        [
            ("Hybrid: kontor när teamet behöver det, distans när arbetet tillåter. Du föredrar den flexibiliteten.", "hybrid-flex"),
            ("Tre kontorsdagar fungerar, och pendlingen Uppsala–Stockholm på ungefär 40–50 minuter är redan tänkbar.", "three-days"),
            ("Du sökte Stockholm och kan tänka dig mer kontorstid om rollen är långsiktig, utan att lova ett flyttdatum.", "office-ok-longterm"),
        ],
        "Så här kan det låta: »Jag sökte Stockholm och bor i Uppsala, ungefär 40–50 minuter dit. Hybrid passar mig — kontor när det behövs, och jag är öppen för den kontorsrytm ni har i teamet.«",
    ),
    cal(
        "cal-dont-know",
        "unknown_answer",
        "Om du inte vet svaret på en fråga i rummet — vad gör du?",
        [
            ("Säg att du inte vet, säg vad du skulle kolla, och håll dig till det du faktiskt har sett.", "admit-then-lookup"),
            ("Avgränsa: det här har jag inte gjort hos er / inte mätt, så jag vill inte hitta på.", "dont-invent"),
            ("Erbjud en hypotes märkt som hypotes, och fråga om de vill att du tänker högt.", "mark-hypothesis"),
        ],
        "Så här kan det låta: »Det vet jag inte säkert, och jag vill inte hitta på. Det jag skulle göra är att kolla X, och återkomma med det jag faktiskt ser.«",
    ),
    cal(
        "cal-failure",
        "failure_story",
        "De ber om ett tillfälle då något gick snett. Vilken historia vill du berätta — utan att hitta på ett uppdrag?",
        [
            ("False friend: retrieval matchade fel ärende (ticket-008), och evallen visade det.", "false-friend"),
            ("Maskering: ett bart förnamn utan extra ledtråd kan slinka igenom.", "name-slip"),
            ("En promptändring gjorde evalen sämre: rulla tillbaka, jämför fall, ändra en sak i taget.", "eval-worse"),
        ],
        "Så här kan det låta: »I demot matchade enkel token-retrieval fel ärende — en false friend. Evallen fångade det, och nästa steg vore att förbättra retrieval och behålla den mänskliga grinden.«",
    ),
    cal(
        "cal-priorities",
        "conflicting_priorities",
        "Två saker krockar: till exempel en senior vill ha tempo, du vill ha eval och godkännande på plats först. Hur tar du det?",
        [
            ("Förklara risken kort, föreslå minsta mätbara steg, och följ sen teamets beslut om de äger risken.", "explain-then-follow"),
            ("Föreslå att mäta båda vägarna på syntetiska fall innan ni väljer.", "measure-both"),
            ("I patientdata-liknande fall stå kvar vid fail-closed; utanför det, var mer flexibel.", "fail-closed-when-needed"),
        ],
        "Så här kan det låta: »Då skulle jag säga vilken risk jag ser, föreslå minsta sättet att mäta det, och följa teamets beslut om de äger risken. I fall med patientdata skulle jag inte släppa fail-closed.«",
    ),
    cal(
        "cal-learn-y1",
        "first_year_learn",
        "Vad vill du lära dig det första året om du får rollen?",
        [
            ("Era rutiner: hur ni granskar AI-genererad kod, var ni drar handoff-linjen, och hur evallen får leva i vardagen.", "their-routines"),
            ("Domänen: tillräckligt mycket av det interna stödflödet och vårdsammanhanget för att inte gissa.", "domain"),
            ("Eget ägande: en liten prototyp från idé till något kollegor faktiskt använder, med coaching runt det.", "own-slice"),
        ],
        "Så här kan det låta: »Först era rutiner — hur ni granskar AI-genererad kod och var ni drar linjen för mänsklig handoff. Samtidigt vill jag lära mig tillräckligt av flödet för att äga en liten prototyp med eval från start.«",
    ),
    cal(
        "cal-why-not-dev",
        "why_not_developer",
        "En rekryterare frågar: varför söker du inte en utvecklarroll i stället?",
        [
            ("Associate med coaching passar min nivå just nu; jag har ingen heltidsroll som utvecklare bakom mig och vill inte låtsas annorlunda.", "level-fit"),
            ("Den här rollen ligger närmare det jag faktiskt har övat: eval, grindar och syntetisk data — inte en erfaren utvecklarstol från dag ett.", "role-fit"),
            ("Jag stänger inte dörren till mer kod senare, men jag söker inte en roll där ni förväntar er en etablerad utvecklare nu.", "door-open"),
        ],
        "Så här kan det låta: »Jag söker associate-rollen för att den passar min nivå: jag har ingen heltidsroll som utvecklare bakom mig, och jag vill lära mig era rutiner med coaching. Jag stänger inte dörren till mer kod senare, men jag söker inte en erfaren utvecklarroll nu.«",
    ),
    cal(
        "cal-ask-two",
        "questions_to_them",
        "Vilka två frågor vill du hinna ställa till dem?",
        [
            ("En om handoff- och audit-linjen, och en om hur första månaderna ser ut för en associate.", "handoff-and-onboard"),
            ("En om vilken evidens de vill se innan en intern pilot, och en om false friends.", "evidence-and-friends"),
            ("En teknisk och en om coaching: var ni drar gränsen, och hur mycket lotsning som faktiskt följer med.", "tech-and-coaching"),
            ("Två frågor du faktiskt är nyfiken på just nu — skriv dem hellre själv än att lära in en lista.", "write-your-own"),
        ],
        "Så här kan det låta: »Var drar ni linjen för mänsklig handoff i ett internt stödflöde? Och hur ser de första månaderna ut för en associate — hur mycket coaching följer med?« Namnge ingen person.",
    ),
    cal(
        "cal-close",
        "close",
        "Hur vill du runda av intervjun de sista trettio sekunderna?",
        [
            ("Tacka kort, säg att du är intresserad, och fråga vad nästa steg är.", "thanks-next"),
            ("Knyt ihop: en mening om varför rollen passar, sen fråga om process.", "fit-then-process"),
            ("Lämna en konkret öppning: du kan fördjupa demot eller ett fall om de vill se mer, utan att kräva att de har tittat.", "offer-followup"),
        ],
        "Så här kan det låta: »Tack, jag är intresserad av rollen. Hör gärna av er om ni vill att jag visar ett fall eller fördjupar något — vad är nästa steg?«",
    ),
    cal(
        "cal-motivation-reask",
        "motivation",
        "Om de frågar rakt: varför just vi, och varför den här rollen — inte en annan arbetsgivare?",
        [
            ("Var ärlig: foten i tech är huvudmålet, och det avgörande är inte bara vilken arbetsgivare — men samhällsnytta och vård väger extra här.", "honest-foothold"),
            ("Lyft samhällsnytta och vård som skälet att det är just Cambio, utöver att du vill in i tech.", "why-these-people"),
            ("Nämn att du tenderar att vara lojal när villkoren är bra, och att det här sammanhanget lockar av den anledningen.", "loyalty"),
        ],
        "Så här kan det låta: »Jag vill få in en fot ordentligt i tech, och det behöver inte bara vara här — men jag uppskattar påtagligt att ni gör samhällsnyttig teknik, med vård som extra plus. När villkoren är bra tenderar jag att stanna.«",
        consistency_of="cal-motivation",
    ),
    cal(
        "cal-coaching-reask",
        "coaching",
        "Första månaderna: hur mycket vill du bli lotsad, och när vill du få testa själv?",
        [
            ("Lotsning är huvudspåret i början; jag utgår från seniorernas rutiner.", "guided"),
            ("Jag ber aktivt om utrymme att testa verktyg och metoder som jag ser fungerar, när det inte krockar med era ramar.", "ask-room"),
            ("Först titta på hur ni granskar ett utkast tillsammans, sen iterera mer själv.", "together-then-solo"),
        ],
        "Så här kan det låta: »I början utgår jag från seniorernas input och era rutiner. Där jag ser verktyg eller metoder som fungerar vill jag fråga efter utrymme att testa mer fritt.«",
        consistency_of="cal-coaching",
    ),
    cal(
        "cal-opening-reask",
        "opening",
        "På trettio sekunder när du sätter dig: vad tar du upp först?",
        [
            ("Att jag byggde ett demo efter intervjuinbjudan för att visa hur jag använder AI-verktyg på något relevant.", "demo-after-invite"),
            ("Att demot bygger på publika uppgifter om Cambio, inte på intern information.", "public-data"),
            ("Mönstret i korthet, och sen fråga vad de vill att du fördjupar.", "pattern-then-ask"),
        ],
        "Så här kan det låta: »Jag byggde ett demo efter att jag fick frågan om intervju, utifrån publika uppgifter om Cambio, för att visa hur jag använder AI-verktyg. Vad vill ni att jag fördjupar?«",
        consistency_of="cal-lead-with",
    ),
    cal(
        "cal-demo-after-invite",
        "demo_origin",
        "De frågar om du byggde demot just för den här intervjun. Vad säger du?",
        [
            ("Ja: det var inte planerat innan jag fick frågan om intervju. Jag ville visa förmågan konkret.", "yes-after"),
            ("Ja, och betona att underlaget var offentliga uppgifter om Cambio — inte intern information.", "yes-public"),
            ("Ja, och att du gärna bygger mer specifikt om de ger tydligare krav.", "yes-and-more"),
        ],
        "Så här kan det låta: »Ja — det var inte planerat innan jag fick frågan om intervju. Jag utgick från offentliga uppgifter om Cambio, och jag bygger gärna mer specifikt om jag får tydligare krav.«",
    ),
    cal(
        "cal-loyalty-framing",
        "loyalty_framing",
        "Du har sagt att du tenderar att vara lojal när villkoren är bra. Hur säger du det utan att det låter som att det är likgiltigt var du hamnar?",
        [
            ("Säg lojaliteten som en styrka, och koppla den till samhällsnytta och vård så att Cambio ändå får en tydlig plats.", "loyalty-plus-why-here"),
            ("Var ärlig men kort: foten i tech är målet, och just det här sammanhanget lockar extra.", "honest-short"),
            ("Lämna villkors-bisatsen om den gör meningen för lång; nämn den bara om de frågar om långsiktighet.", "skip-conditions"),
        ],
        "Så här kan det låta: »När förutsättningarna är bra tenderar jag att stanna. Det som gör just Cambio intressant är samhällsnyttan och vårdinriktningen, inte bara att det är tech.«",
    ),
]


def main():
    doc = json.loads(OUT.read_text(encoding="utf-8"))
    existing = {c["id"] for c in doc["cards"]}
    add = []
    for c in NEW:
        if c["id"] in existing:
            raise SystemExit("id already present: %s" % c["id"])
        add.append(c)
    blob = json.dumps(add, ensure_ascii=False)
    for bad in ["Martin Rehn", "martin.rehn", "@cambio.se"]:
        if bad.lower() in blob.lower():
            raise SystemExit("redaction failed: %s" % bad)
    for c in add:
        if not (2 <= len(c["options"]) <= 4):
            raise SystemExit("%s: bad option count" % c["id"])
        if not c.get("tip") or c.get("scored") is not False or c.get("correct"):
            raise SystemExit("%s: not a calibration card" % c["id"])
    doc["cards"].extend(add)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    cal_n = sum(1 for c in doc["cards"] if c.get("kind") == "calibration")
    print("added", len(add), "calibration follow-ups; total calibration", cal_n, "total cards", len(doc["cards"]))


if __name__ == "__main__":
    main()
