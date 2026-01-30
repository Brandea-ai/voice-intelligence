# UNBEDINGT LESEN - Session-Einstieg

---

## STOPP! Lies das ZUERST!

Bevor du IRGENDETWAS machst, folge dieser Reihenfolge:

---

## Schritt 1: Projekt verstehen

Lies diese Dateien in DIESER Reihenfolge:

```
1. README.md              <-- Du bist hier (Hauptordner)
2. .claude/START.md       <-- Aktueller Stand, wo stehen wir?
3. .claude/RULES.md       <-- Goldene Regeln (NIEMALS brechen!)
4. .claude/CHECKLIST.md   <-- Was ist erledigt, was kommt als nächstes?
5. .claude/PROGRESS.md    <-- Was wurde in letzten Sessions gemacht?
6. .claude/reports/       <-- Alle Reports lesen (neueste zuletzt!)
7. .claude/KONZEPT.md     <-- Architektur und Design (bei Bedarf)
```

---

## Schreibregeln (PFLICHT)

### Deutsche Umlaute

**IMMER** deutsche Umlaute verwenden:
- ä, ö, ü, ß

**NIEMALS** Ersatzschreibweisen:
- ~~ae, oe, ue, ss~~

**Beispiele:**
- Richtig: "Änderung", "Lösung", "Prüfung", "Größe"
- Falsch: ~~"Aenderung", "Loesung", "Pruefung", "Groesse"~~

Dies gilt für: Dokumentation, Code-Kommentare, Commit-Messages, UI-Texte

---

## Schritt 2: Reports lesen

```
.claude/reports/
├── R0001.md        <-- Ältester Report
├── R0002.md
├── R0003.md
└── ...             <-- Neueste zuletzt lesen!
```

Reports enthalten:
- Was in der Session gemacht wurde
- Welche Dateien geändert wurden
- Wichtige Infos für Folge-Sessions
- Offene Punkte und Blocker

---

## Schritt 3: Aktuellen Task identifizieren

1. Öffne `.claude/CHECKLIST.md`
2. Finde den nächsten offenen Task: `[ ]`
3. Prüfe Abhängigkeiten
4. Beginne NUR mit diesem Task

---

## Schritt 4: Nach Arbeit dokumentieren

Nach JEDER erledigten Aufgabe:

1. **Report schreiben** in `.claude/reports/RXXXX.md`
2. **CHECKLIST.md** aktualisieren: `[ ]` zu `[x]`
3. **PROGRESS.md** Eintrag hinzufügen

---

## Ordnerstruktur

```
Everlast Projekt/
├── README.md                 <-- UNBEDINGT ZUERST LESEN (diese Datei)
└── .claude/
    ├── START.md              <-- Schnellstart, aktueller Stand
    ├── RULES.md              <-- Goldene Regeln
    ├── CHECKLIST.md          <-- Fortschritt mit [x]/[ ]
    ├── PROGRESS.md           <-- Historie (Einträge pro Session)
    ├── KONZEPT.md            <-- Architektur, Design, Tech Stack
    └── reports/              <-- Detaillierte Reports pro Task
        ├── R0001.md
        ├── R0002.md
        └── ...
```

---

## Design-Prinzipien

| Prinzip | Bedeutung |
|---------|-----------|
| Minimalismus | Nur was nötig ist |
| Barrierefrei | Selbsterklärend, wenige Klicks |
| Nativ | Fühlt sich wie macOS an |
| System-adaptiv | Hell/Dunkel je nach System |

### VERBOTEN im Design:
- Emojis (außer funktionaler Zweck)
- Dekorative Icons ohne Funktion
- Unnötige Animationen
- Überladene Layouts

---

## VERBOTEN

- Arbeiten ohne vorher alles gelesen zu haben
- Reports überspringen
- Mehrere Tasks gleichzeitig
- CHECKLIST.md nicht aktualisieren
- Ohne Dokumentation aufhören

---

## Bei Token-Limit / Neuer Session

1. Lies README.md (diese Datei)
2. Lies `.claude/START.md`
3. Lies `.claude/CHECKLIST.md`
4. Lies `.claude/PROGRESS.md` (letzte Einträge)
5. Lies ALLE Reports in `.claude/reports/`
6. Setze fort wo aufgehört wurde

---

## WICHTIG: Am Ende des Projekts

Der gesamte `.claude/` Ordner wird GELÖSCHT bevor das Projekt abgegeben wird!

Das ist Absicht - die interne Arbeitsweise ist Betriebsgeheimnis.

Diese README.md wird dann durch eine öffentliche README ersetzt.

---

*Dieses System garantiert nahtloses Weiterarbeiten über Sessions hinweg.*
