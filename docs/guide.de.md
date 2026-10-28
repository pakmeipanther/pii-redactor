**Lesen auf:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Benutzerhandbuch für Einsteiger

## Wofür ist dieses Tool gedacht?

Stellen Sie sich vor, Sie kopieren Ihren Ausweis für eine fremde Person — Sie würden sicher mit einem Stift Ihren Namen, Ihre Telefonnummer und Ihre Adresse abdecken, bevor Sie ihn weitergeben, oder? Genau das macht PII Redactor — aber mit Text, Screenshots und PDF-Dateien: Es findet und verbirgt automatisch sensible Informationen (E-Mails, Telefonnummern, IP-Adressen, Passwörter, Datenbank-Connection-Strings...), bevor Sie diesen Inhalt in ChatGPT, Claude oder ein anderes KI-Tool einfügen.

> **Das Wichtigste:** Diese Software stellt keine Internetverbindung her und sendet keinerlei Daten irgendwohin — die gesamte Verarbeitung erfolgt direkt auf Ihrem Computer. Sie können das WLAN beim Benutzen komplett ausschalten, und es funktioniert weiterhin normal — so können Sie dies auch selbst überprüfen.

![PII Redactor Demo: Ein erfundener Mitarbeiterausweis wird gescannt, der Text geschwärzt, das Gesicht mit einem Mosaik abgedeckt und ein zusätzlicher Bereich von Hand gezeichnet](images/demo.gif)

*(Alles in dieser Aufnahme sind erfundene Beispieldaten.)*

**Was das Tool kann, in einer Liste** — jeder Punkt hat unten einen eigenen Abschnitt:

- sensible Angaben in **Text** verbergen (E-Mails, Telefonnummern, IP-Adressen, Schlüssel, Passwörter ...);
- **Ihre eigene Liste** mit Wörtern führen, die immer verborgen werden (Firmenname, Servernamen ...);
- **vermutete Passwörter und Geheimnisse** markieren, damit Sie sie bestätigen;
- sensiblen Text in **Bildern und Screenshots** schwärzen;
- **Bereiche von Hand** prüfen, abschalten oder hinzufügen, bevor irgendetwas gespeichert wird;
- **Gesichter** in Bildern finden und abdecken;
- **PDF**-Dateien bereinigen und **Word**- und **PowerPoint**-Dateien in ein geschwärztes PDF umwandeln;
- die versteckten **Metadaten** jeder Datei anzeigen und entfernen und jedes Ergebnis vor dem Download noch einmal prüfen.

## Schritt 1 — Software herunterladen

1. Öffnen Sie Ihren Browser (Firefox oder Brave werden empfohlen — beide sind für Sicherheit/Datenschutz bekannt; Chrome, Safari und Edge funktionieren ebenfalls) und rufen Sie folgende Adresse auf:

   ```
   https://github.com/pakmeipanther/pii-redactor
   ```
1. Suchen Sie den grünen "Code"-Button, klicken Sie darauf und wählen Sie dann "Download ZIP".
1. Die Datei wird in den Ordner heruntergeladen, den Ihr Browser dafür eingestellt hat — hier dient Downloads nur als Beispiel, da es meist der Standardordner ist, Sie können aber jeden beliebigen Ordner wählen.

### Datei entpacken (die .zip-Datei in einen nutzbaren Ordner verwandeln)

#### macOS

1. Öffnen Sie den Ordner, in dem Sie die ZIP-Datei gerade gespeichert haben (z. B. Downloads bei Standardeinstellung).
1. Doppelklicken Sie auf die heruntergeladene Datei (etwa mit dem Namen pii-redactor-main.zip).
1. macOS erstellt automatisch einen gleichnamigen Ordner direkt daneben — fertig!

#### Windows

1. Öffnen Sie den Ordner, in dem Sie die ZIP-Datei gerade gespeichert haben (z. B. Downloads bei Standardeinstellung).
1. Klicken Sie mit der rechten Maustaste auf die ZIP-Datei und wählen Sie "Extract All..." (Alle extrahieren...).
1. Ein Fenster fragt nach dem Speicherort — lassen Sie die Standardeinstellung und klicken Sie auf "Extract" (Extrahieren).
1. Ein neuer, gleichnamiger Ordner erscheint.

## Schritt 2 — Die Software öffnen und sich zurechtfinden

1. Öffnen Sie den in Schritt 1 entpackten Ordner und doppelklicken Sie auf die Datei index.html. Sie öffnet sich in Ihrem Browser.
1. Wählen Sie oben rechts Ihre Sprache (English, Français, Deutsch oder Tiếng Việt).
1. Die grüne Zeile unter dem Titel sagt, dass keine Netzwerkverbindung hergestellt wird. Das ist ein Versprechen, das Sie selbst überprüfen können (siehe „Gute Gewohnheiten“ am Ende).

Die Seite liest sich von oben nach unten:

| Bereich | Wofür er da ist |
|---|---|
| **1. Text einfügen oder Datei per Drag & Drop / Auswahl hinzufügen** | Das große Textfeld zum Einfügen von Text und eine einzige Ablagefläche für jede Datei. Den Dateityp wählen Sie nie selbst: Die Software zeigt eine Zeile „Erkannt:“ und öffnet direkt darunter das passende Feld (Bild, PDF, Word oder PowerPoint). |
| **2. Benutzerdefinierte interne Begriffe** | Ihre eigene Liste von Wörtern, die immer verborgen werden. |
| **3. Zu erkennende Datentypen** | Hier haken Sie die Arten von Daten an oder ab, nach denen im Text gesucht wird. |
| **4. Ergebnis** | Der Text mit markierten Funden und die Download-Schaltfläche. |
| **Feld Bild / PDF / Word / PowerPoint** | Erscheint erst, nachdem Sie eine Datei dieses Typs abgelegt haben. |

Welche Funktionen laufen per Doppelklick auf index.html, und welche brauchen den lokalen Server aus Schritt 3?

| Funktion | Doppelklick auf index.html | Lokaler Server nötig (Schritt 3) |
|---|---|---|
| Text, eigene Begriffe, vermutete Geheimnisse | ja | — |
| Word- und PowerPoint-Dateien | ja | — |
| Bilder und Screenshots (Text darin lesen), Bereiche von Hand zeichnen, Gesichter, PDF | nein (nutzen Sie den lokalen Server) | ja |

Im Zweifel nehmen Sie den lokalen Server: Er funktioniert für alles.

## Schritt 3 (fortgeschritten, nötig für Bilder, Gesichter und PDF) — Einen lokalen Server starten

Das Lesen von Text in Bildern, die Gesichtserkennung und die Verarbeitung von PDF-Dateien brauchen aufgrund einer Sicherheitsrichtlinie des Browsers einen zusätzlichen kleinen technischen Schritt. „Einen lokalen Server starten“ klingt beängstigend, ist aber nur eine einzige Zeile zum Eintippen. Wenn Sie nur Text, Word oder PowerPoint bearbeiten, können Sie diesen Abschnitt überspringen.

#### macOS — lokalen Server starten

1. Öffnen Sie die App Terminal (drücken Sie Cmd + Leertaste, tippen Sie "Terminal", drücken Sie Enter).
1. Tippen Sie cd (mit einem Leerzeichen danach) und ziehen Sie dann den in Schritt 1 entpackten Ordner direkt in das Terminal-Fenster — der Pfad wird automatisch eingefügt. Drücken Sie Enter.
1. Tippen Sie Folgendes und drücken Sie Enter:

   ```
   python3 -m http.server 8000
   ```

   > Erscheint die rote Fehlermeldung "command not found: python3", bedeutet das, dass Python auf Ihrem Rechner nicht installiert ist. Siehe die ausführliche Python-Installationsanleitung weiter unten, oder nutzen Sie einfach nur die Textfunktion (Funktion 1) — das reicht völlig aus.
1. Öffnen Sie Ihren Browser und geben Sie in die Adresszeile ein:

   ```
   http://localhost:8000
   ```
1. Jetzt funktionieren alle Funktionen (Text, Bild, PDF), wie in den Funktionen unten beschrieben.
1. Wenn Sie fertig sind, wechseln Sie zurück zum Terminal-Fenster, drücken Sie Strg + C, und schließen Sie das Fenster.

#### Windows — lokalen Server starten

1. Drücken Sie die Windows-Taste, tippen Sie "cmd" oder "PowerShell", drücken Sie Enter, um ein Eingabeaufforderungsfenster zu öffnen.
1. Tippen Sie cd (mit Leerzeichen) und ziehen Sie dann den entpackten Ordner in das Fenster — der Pfad wird automatisch eingefügt. Drücken Sie Enter.
1. Tippen Sie Folgendes und drücken Sie Enter (unter Windows meist "python", nicht "python3"):

   ```
   python -m http.server 8000
   ```

   > Erscheint eine Fehlermeldung, dass der Befehl nicht gefunden wurde, ist Python nicht installiert. Siehe die ausführliche Installationsanleitung weiter unten — denken Sie daran, beim Installieren "Add Python to PATH" anzuhaken.
1. Öffnen Sie Ihren Browser und geben Sie ein:

   ```
   http://localhost:8000
   ```
1. Nutzen Sie es wie in den Funktionen unten beschrieben.
1. Wenn Sie fertig sind, wechseln Sie zurück zum Eingabeaufforderungsfenster, drücken Sie Strg + C zum Beenden, und schließen Sie das Fenster.

### Ausführliche Python-Installation (falls Ihr Rechner "Befehl python nicht gefunden" meldet)

#### macOS

1. Öffnen Sie Ihren Browser und gehen Sie zu:

   ```
   https://www.python.org/downloads/
   ```
1. Die Seite erkennt automatisch Ihren Mac und zeigt einen gelben Button "Download Python 3.x.x" — klicken Sie darauf.
1. Die Installationsdatei (.pkg) wird in den Ordner Downloads heruntergeladen.
1. Doppelklicken Sie darauf, um die Installation zu starten.
1. Ein Installationsfenster öffnet sich — klicken Sie sich mit "Continue" (Weiter) durch die Schritte, bis der Button "Install" (Installieren) erscheint, und klicken Sie darauf.
1. Ihr Mac fragt möglicherweise nach Ihrem Anmeldepasswort (dem Passwort zum Entsperren Ihres Macs) — geben Sie es ein und klicken Sie auf OK.
1. Warten Sie einige Minuten, bis "The installation was successful" (Installation erfolgreich) erscheint.
1. Schließen Sie das Installationsfenster, schließen Sie dann ein geöffnetes Terminal-Fenster und öffnen Sie ein neues, damit der Rechner das neu installierte Python erkennt.
1. Tippen Sie erneut Folgendes — es sollte jetzt ohne Fehler funktionieren:

   ```
   python3 -m http.server 8000
   ```

#### Windows

1. Öffnen Sie Ihren Browser und gehen Sie zu:

   ```
   https://www.python.org/downloads/
   ```
1. Die Seite erkennt automatisch Windows und zeigt einen gelben Button "Download Python 3.x.x" — klicken Sie darauf.
1. Die Installationsdatei (.exe) wird in den Ordner Downloads heruntergeladen.
1. Doppelklicken Sie darauf, um die Installation zu starten.
1. Sehr wichtig: Auf dem ersten Installationsbildschirm befindet sich unten ein kleines Kästchen mit der Aufschrift "Add python.exe to PATH" (oder "Add Python to PATH") — Sie müssen dieses Kästchen unbedingt anhaken, bevor Sie fortfahren, sonst erkennt Ihr Rechner den python-Befehl später nicht.
1. Nachdem Sie das Kästchen angehakt haben, klicken Sie auf "Install Now" (Jetzt installieren).
1. Warten Sie einige Minuten, bis "Setup was successful" (Installation erfolgreich) erscheint, und klicken Sie dann auf "Close" (Schließen).
1. Schließen Sie das alte Eingabeaufforderungsfenster und öffnen Sie ein neues, damit der Rechner das neu installierte Python erkennt.
1. Tippen Sie erneut Folgendes — es sollte jetzt ohne Fehler funktionieren:

   ```
   python -m http.server 8000
   ```

> Wenn Sie alle Schritte korrekt ausgeführt haben und trotzdem ein Fehler auftritt, muss der Rechner möglicherweise einmal neu gestartet werden, damit die Änderung wirksam wird.

## Funktion 1 — Text schwärzen

*Die einfachste Funktion — nichts zu installieren.*

1. Öffnen Sie index.html (Schritt 2).
1. Fügen Sie den zu prüfenden Text in das große Feld in Bereich 1 ein — zum Beispiel eine E-Mail mit Telefonnummer und Adresse.
1. Lassen Sie in Bereich 3, „Zu erkennende Datentypen“, die Datentypen angehakt, nach denen gesucht werden soll: E-Mail, IPv4-Adresse, IPv6-Adresse, Telefonnummer, API-Schlüssel / Token, Bankkartennummer, Datenbank-Connection-String (in beiden Formen), Datenbank-Verbindungsport und Passwort / Zufallszeichenfolge (hohe Entropie). Am Anfang sind alle angehakt.
1. Klicken Sie auf „Scannen & markieren“.
1. In Bereich 4, „Ergebnis“, sind die Funde rot markiert. Eine Zeile darüber nennt, wie viele gefunden wurden.
1. Wenn alles passt, klicken Sie auf „Bereinigten Text herunterladen (.txt)“. In der gespeicherten Datei ist jeder Fund durch ein Etikett wie [E-MAIL ENTFERNT] oder [IP ENTFERNT] ersetzt. Das ist die Fassung, die Sie bedenkenlos in ein KI-Tool einfügen können.
1. „Alles löschen“ leert die Seite, damit Sie von vorn beginnen können.

> **Sehen Sie sich die markierten Stellen immer an, bevor Sie herunterladen.** Ein automatisches Werkzeug ist ein Helfer, nie eine Garantie.

## Funktion 2 — Ihre eigene Liste interner Begriffe

Die Software kann nicht wissen, dass „srv-db-prod-02“ oder der Name Ihrer Firma geheim ist. Sagen Sie es ihr einmal, und es wird immer verborgen — in Text, in Bildern, in PDF-, Word- und PowerPoint-Dateien — ohne Rückfrage.

1. Geben Sie in Bereich 2, „Benutzerdefinierte interne Begriffe“, ein Wort oder eine Wendung ein und klicken Sie auf „Hinzufügen“. Es erscheint als kleines Etikett; mit „Entfernen“ am Etikett nehmen Sie es wieder heraus.
1. Haken Sie „Groß-/Kleinschreibung beachten“ nur an, wenn Großbuchstaben eine Rolle spielen (zum Beispiel um „Falcon“ zu verbergen, aber nicht „falcon“).
1. Die Begriffe werden in Ihrem Browser gespeichert, nur auf Ihrem Computer, und sind beim nächsten Mal noch da.
1. „Liste exportieren (.json)“ speichert Ihre Liste als Datei (als Sicherung oder um sie auf einen anderen Computer zu übertragen). „Liste importieren (.json)“ lädt eine solche Datei.
1. In Bildern wird ein Begriff auch erkannt, wenn der Text im Bild andere Akzente hat oder (wenn „Groß-/Kleinschreibung beachten“ nicht angehakt ist) andere Großbuchstaben; Wendungen, die über zwei Zeilen gehen, werden ebenfalls gefunden. Enthalten Ihre Begriffe Buchstaben mit Akzent, die OCR-Sprache ist aber Englisch, warnt Sie die Software — wählen Sie die tatsächliche Sprache des Bildes (Funktion 4).

### Die ganze Liste leeren: „Alle Begriffe löschen“

Bei einer langen Liste ist das Entfernen einzelner Begriffe mühsam. „Alle Begriffe löschen“ entfernt alle auf einmal, aber nie schon beim ersten Klick, denn die Liste lässt sich danach nicht wiederherstellen:

1. Eine Warnung erscheint: Die Begriffe werden aus dem lokalen Speicher dieses Browsers entfernt und können nicht wiederhergestellt werden.
1. Wählen Sie „Liste (.json) zuerst exportieren“, um eine Sicherung zu speichern. Danach fragt die Software noch einmal nach („Sicherung exportiert. Jetzt alle eigenen Begriffe (…) löschen?“).
1. Oder wählen Sie „Ohne Export löschen“, wenn Sie wirklich keine Sicherung brauchen.
1. Nur „Jetzt löschen“ löscht. „Abbrechen“ (oder die Esc-Taste) schließt die Warnung und lässt alles unverändert.

## Funktion 3 — Vermutete Passwörter und Geheimnisse

Manche Geheimnisse haben keine erkennbare Form: ein zufällig aussehendes Passwort, ein Token. Die Software erkennt Zeichenfolgen, die zufällig aussehen („hohe Entropie“), verbirgt sie aber **nicht** selbst, weil sie sich irren kann.

- **Im Text:** Vermutete Funde sind markiert, der Hinweistext lautet „Vermutetes Passwort/Secret (hohe Entropie) — klicken, um die Schwärzung zu bestätigen“. Klicken Sie auf einen, um ihn zu bestätigen („Bestätigt — wird beim Download geschwärzt“); klicken Sie erneut, um die Bestätigung aufzuheben.
- **In einem Bild:** Vermutete Funde erhalten einen **gelben Rahmen**, und die Pixel sind **noch nicht** gelöscht. In einer Liste unter dem Bild, „Vermutete Passwörter/Secrets (hohe Entropie) — zum Bestätigen ankreuzen“, kreuzen Sie die an, die geschwärzt werden sollen; das Bild wird sofort neu gezeichnet.
- **In Word- und PowerPoint-Dateien:** Vermutete Funde werden nur gemeldet. Ist einer wirklich ein Geheimnis, nehmen Sie ihn in Ihre eigene Liste auf (Funktion 2) und wandeln Sie noch einmal um.
- Sie können diese Erkennung ganz abschalten, indem Sie „Passwort / Zufallszeichenfolge (hohe Entropie)“ unter „Zu erkennende Datentypen“ abwählen.

## Funktion 4 — Bilder und Screenshots

1. Legen Sie ein Bild (PNG, JPEG oder WEBP) auf der Ablagefläche ab oder klicken Sie darauf, um eines zu wählen. Sie können einen Screenshot auch mit Strg+V (Cmd+V am Mac) irgendwo auf der Seite **einfügen**: Er wird als Bild erkannt und nicht als Text eingefügt.
1. Die Zeile „Erkannt:“ zeigt „Bild / Screenshot“, und das Feld „Bild / Screenshot“ öffnet sich. Darüber zeigt „Metadaten der Originaldatei“, was das Bild mitführt (Funktion 10).
1. Wählen Sie unter „OCR-Sprache:“ die Sprache, **in der das Bild geschrieben ist**. Eine falsche Wahl führt zu falsch gelesenem Text und kann sensible Wörter durchrutschen lassen.
1. Lassen Sie „Gründliche Analyse (langsamer)“ angehakt. Sie liest das Bild mehrmals mit unterschiedlicher Farbverarbeitung, wodurch Text auf farbigem Hintergrund, helle Buchstaben auf dunklen Überschriften und verschnörkelte Schriften gefunden werden.
1. Klicken Sie auf „Scannen & sensible Bereiche schwärzen“. Beim ersten Mal wird das Lesemodell geladen (einige Sekunden); danach sehen Sie den Fortschritt und eine Zeile wie „Fertig — 3 sensible Bereich(e) im Bild geschwärzt.“
1. Sehen Sie sich das Bild an. Echte schwarze Rechtecke decken die Funde ab. Gelbe Rahmen sind Verdachtsfälle, die Sie bestätigen können (Funktion 3). Prüfen Sie die Liste der Bereiche (Funktion 5) und ergänzen Sie, was übersehen wurde (Funktion 6, Funktion 7).
1. Klicken Sie auf „Bearbeitetes Bild herunterladen“ (die Schaltfläche nennt auch den Dateityp: .png, .jpg oder .webp) oder auf „Als PDF herunterladen“.
1. „Alles löschen“ im Feld entfernt das Bild und beginnt von vorn.

**Das ist echtes Löschen.** Das fertige Bild wird aus Ihrem unveränderten Original neu aufgebaut: Die sensiblen Pixel werden mit Schwarz überschrieben, nicht unter einer durchsichtigen Schicht versteckt — niemand kann das Schwarz entfernen, um zu sehen, was darunter war.

**Wenn die Software etwas übersehen hat**, öffnen Sie unter dem Bild „Was die OCR gelesen hat (und warum jede Stelle geschwärzt wurde)“. Dort steht der Text, den die Software gelesen hat, und der Grund für jedes schwarze Rechteck. Steht das erwartete Wort dort nicht, hat die Software es nicht gelesen — wählen Sie die richtige Sprache, lassen Sie „Gründliche Analyse“ an oder decken Sie die Stelle von Hand ab.

## Funktion 5 — Die Liste der abgedeckten Bereiche

Unter dem Bild listet „Bereiche, die abgedeckt werden: N (M von dir gezeichnet)“ **alles** auf, was verborgen wird: was die Software selbst gefunden hat, die Gesichter und die Bereiche, die Sie gezeichnet haben. Alles steht in dieser einen Liste.

- Jede Zeile hat ein Kästchen. **Nehmen Sie den Haken weg**, damit der Bereich sichtbar bleibt (zum Beispiel bei einem Fehlalarm); haken Sie ihn wieder an, um ihn abzudecken.
- Eine Zeile lautet „Automatisch: die Art der Daten — der Text“, „Gesicht Nr. 1“ oder „Gezeichneter Bereich Nr. 1“.
- Fahren Sie mit der Maus über eine Zeile (oder gehen Sie mit der Tab-Taste hin): Ein gestrichelter hellblauer Rahmen zeigt, wo sie im Bild liegt.
- Von Ihnen gezeichnete Bereiche haben eine Schaltfläche „Entfernen“.
- Bild und Download richten sich immer nach dieser Liste: Was angehakt ist, wird abgedeckt, was nicht angehakt ist, nicht.
- Ein neuer Textscan ersetzt die automatischen Textbereiche; Gesichter und gezeichnete Bereiche bleiben erhalten.

## Funktion 6 — Bereiche von Hand zeichnen

Für alles, was die Software nicht lesen kann: ein Logo, Handschrift, ein QR-Code, ein Name auf einem Ausweis, ein Gesicht.

1. Klicken Sie auf „Bereich zum Abdecken zeichnen“, um das Werkzeug einzuschalten (die Schaltfläche bleibt hervorgehoben).
1. Ziehen Sie mit Maus, Finger oder Stift über den Bereich. Ein hellblauer Rahmen folgt Ihnen; lassen Sie los, um zu bestätigen. Esc bricht den Strich ab, den Sie gerade ziehen. Ein einfacher Klick wird ignoriert.
1. Der neue Bereich wird wie die automatischen vollständig schwarz gefüllt und erscheint in der Liste als „Gezeichneter Bereich Nr. …“.
1. „Rückgängig“ und „Wiederholen“ (auch Strg/Cmd+Z, Umschalt+Strg/Cmd+Z und Strg+Y) gehen durch alles, was Sie ändern, vor und zurück — Zeichnen, Entfernen, einen Bereich an- oder abhaken.
1. „Meine gezeichneten Bereiche entfernen“ löscht alle Ihre Zeichnungen auf einmal (Sie können es noch rückgängig machen).
1. Zeichnen funktioniert ohne Scan: Sie können also einfach Teile eines Bildes von Hand schwärzen und es herunterladen.

## Funktion 7 — Gesichter abdecken

1. Laden Sie ein Bild (Funktion 4). Der Textscan ist vorher nicht nötig.
1. Wählen Sie unter „Gesichter abdecken mit:“, wie Gesichter abgedeckt werden:
   - **„Vollständig schwarz (nicht umkehrbar)“** — die Pixel werden ersetzt; vom Gesicht bleibt nichts übrig. Wählen Sie das immer, wenn jemand nicht erkannt werden darf.
   - **„Grobes Mosaik (schwer umkehrbar, keine Garantie)“** — jeder große Block behält nur eine Durchschnittsfarbe. Sehr schwer rückgängig zu machen, aber keine mathematische Garantie.
   - **„Weichzeichnen (nur kosmetisch — teilweise umkehrbar)“** — ein Glättungseffekt, der sich manchmal teilweise wiederherstellen lässt. Verlassen Sie sich nicht darauf, um die Identität einer Person zu schützen; die Software zeigt eine Warnung, wenn Sie es wählen.
1. Klicken Sie auf „Gesichter erkennen“. Eine Meldung sagt, wie viele gefunden wurden („1 Gesicht gefunden.“).
1. Jedes Gesicht erscheint in der Liste der Bereiche (Funktion 5) als „Gesicht Nr. 1“, „Gesicht Nr. 2“ ... Nehmen Sie bei einer Zeile den Haken weg, damit dieses Gesicht sichtbar bleibt. Ein Wechsel des Stils aktualisiert das Bild sofort.
1. **Der Detektor ist nur bei Gesichtern zuverlässig, die ungefähr in die Kamera schauen.** Seitlich gedrehte, kleine, verdeckte oder schlecht beleuchtete Gesichter können übersehen werden — sehen Sie sich das Bild daher immer an und decken Sie übersehene Gesichter mit „Bereich zum Abdecken zeichnen“ ab (Funktion 6). Gezeichnete Bereiche sind immer vollständig schwarz.
1. Der Detektor läuft komplett in Ihrem Browser (ein kleines Programm und seine Datendatei liegen im vendor-Ordner der Software). Er funktioniert sogar in Safari mit Lockdown-Modus. Er braucht den lokalen Server (Schritt 3); ohne ihn erhalten Sie eine Meldung und können trotzdem von Hand zeichnen.

## Funktion 8 — PDF-Dateien

1. Legen Sie das PDF auf der Ablagefläche ab. Das Feld „PDF-Datei“ öffnet sich.
1. Ist das PDF ein **Scan oder ein Foto** von Papier (Sie können den Text nicht markieren), haken Sie „Auch OCR auf jeder Seite ausführen — nur nötig, wenn das PDF ein Scan/Bild ist (keine auswählbare Textebene), langsamer“ an und wählen „OCR-Sprache (falls aktiviert):“. Bei am Computer erstellten PDFs ist dieses Kästchen nicht nötig.
1. Klicken Sie auf „PDF scannen & schwärzen“. Sie sehen den Fortschritt Seite für Seite.
1. Klicken Sie auf „Bearbeitetes PDF herunterladen“.

So funktioniert es: Jede Seite wird **als Bild neu gezeichnet**, die sensiblen Stellen werden auf diesem Bild geschwärzt, und die Bilder werden zu einem neuen PDF zusammengesetzt. Die ursprüngliche Textebene und die Metadaten überleben dadurch nicht. Der Preis: Das Ergebnis verhält sich wie ein gescanntes Dokument — Sie können den Text darin nicht mehr markieren oder kopieren.

Gesichtserkennung und von Hand gezeichnete Bereiche gibt es nur im Bildfeld. Enthält ein PDF ein Foto mit Gesichtern, speichern Sie diese Seite als Bild und bearbeiten Sie sie im Bildfeld.

## Funktion 9 — Word- und PowerPoint-Dateien

1. Legen Sie die .docx- oder .pptx-Datei ab. Das Feld „Word-Datei (.docx)“ oder „PowerPoint-Datei (.pptx)“ öffnet sich.
1. Klicken Sie auf „Umwandeln & schwärzen → PDF“ und dann auf „Bearbeitetes PDF herunterladen“ (die Datei heißt geschwaerzter-text.pdf oder geschwaerzte-folien.pdf).

Was Sie erhalten, ist absichtlich ein **reines Text-PDF**, nie eine Kopie Ihrer Originaldatei, denn eine Word- oder PowerPoint-Datei kann viel verstecken (Kommentare, alte Versionen, Notizen, eingebettete Objekte). Layout, Tabellen, Bilder, Diagramme und Animationen werden daher **nicht** übernommen. Kommentare und unter „Änderungen nachverfolgen“ gelöschter Text sind nicht enthalten, und die Sprechernotizen einer PowerPoint-Datei ebenfalls nicht — nur der auf den Seiten oder Folien sichtbare Text. Brauchen Sie das Layout, speichern Sie die Datei zuerst selbst als PDF und legen Sie dieses PDF ab (Funktion 8).

## Funktion 10 — Die Metadaten-Prüfung

„Metadaten“ sind Informationen, die in einer Datei versteckt sind und die Sie beim Öffnen nicht sehen: wer sie erstellt hat, mit welchem Programm, wann — und manchmal sogar wo (ein Foto kann den GPS-Standort tragen, an dem es aufgenommen wurde).

- **Wenn Sie eine Datei ablegen** (ein Bild, PDF, Word- oder PowerPoint-Datei), erscheint unter der Zeile „Erkannt:“ ein Kasten „Metadaten der Originaldatei“. Er listet auf, was die Datei mitführt, mit den tatsächlichen Werten, damit Sie genau sehen, was weitergegeben worden wäre. Klicken Sie auf „Werte ausblenden“, wenn Sie die Werte verbergen möchten (zum Beispiel beim Bildschirmteilen); die Feldnamen bleiben sichtbar. Diese Werte werden nur auf Ihrem eigenen Computer angezeigt.
- **Die Datei, die Sie herunterladen, wird von Grund auf neu aufgebaut**, es wird also nichts davon hineinkopiert.
- **Vor jedem Download prüft das Tool das Ergebnis noch einmal.** Ist alles sauber, sehen Sie eine grüne Zeile: „Verifiziert: Die exportierte …-Datei enthält keine identifizierenden Metadaten.“ Bleibt etwas übrig — oder kann das Tool nicht sicher sein —, wird der Download **blockiert**, und eine rote Zeile erklärt warum. Dann wird nichts heruntergeladen.
- Das Farbprofil (ICC) eines Fotos kann grau aufgelistet sein: Es ist eine technische Angabe, die Sie nicht identifiziert und nichts blockiert.
- Die Prüfung kann nicht in das Bild selbst hineinsehen, deshalb erkennt sie Dinge wie unsichtbare Wasserzeichen nicht.

## Wenn etwas nicht funktioniert

| Was Sie sehen | Was zu tun ist |
|---|---|
| Eine Meldung zur Datei (file://) oder „Fehler bei der Bildverarbeitung“ | Bilder, Gesichter und PDF brauchen den lokalen Server — siehe Schritt 3. Text, Word und PowerPoint nicht. |
| Eine Meldung zu **WebAssembly** (Safari mit **Lockdown-Modus**) | Der Lockdown-Modus schaltet WebAssembly ab, das für das Lesen von Text in Bildern nötig ist. Nutzen Sie für Bilder Firefox oder Chrome oder nehmen Sie diese Website in den Einstellungen für Websites in Safari vom Lockdown-Modus aus. Text, Word- und PowerPoint-Dateien, Zeichnen von Hand und Gesichtserkennung funktionieren weiterhin. |
| Ein sensibles Wort in einem Bild wurde nicht verborgen | Prüfen Sie „OCR-Sprache:“, lassen Sie „Gründliche Analyse“ an, öffnen Sie „Was die OCR gelesen hat“ und nehmen Sie das Wort dann in Ihre eigene Liste auf oder decken Sie es von Hand ab. |
| Ein schwarzes Rechteck deckt etwas Harmloses ab | Nehmen Sie bei dieser Zeile in der Liste der Bereiche den Haken weg (Funktion 5). |
| „Dieses Dateiformat wurde nicht erkannt“ | Unterstützt: Text (.txt), Bilder (PNG, JPEG, WEBP), PDF, Word (.docx), PowerPoint (.pptx). |
| Eine rote Zeile „DOWNLOAD BLOCKIERT“ | Die Abschlussprüfung hat etwas gefunden, das sie nicht ausräumen konnte (Funktion 10). Es wurde nichts heruntergeladen; bitte melden Sie es auf der GitHub-Seite des Projekts. |

Kommen Sie nicht weiter? Machen Sie einen Screenshot (ohne sensible Inhalte) und fragen Sie jemanden mit technischem Know-how, statt zu raten.

## Gute Gewohnheiten

- Die Software ist ein Helfer, kein Ersatz für Ihre eigene Sorgfalt: Prüfen Sie immer, bevor Sie vertrauen, denn kein Werkzeug erkennt 100 % der Fälle.
- Sie möchten selbst überprüfen, dass „keine Daten irgendwohin gesendet werden“? Schalten Sie WLAN/Netzwerk aus, bevor Sie die Software öffnen. Sie funktioniert weiterhin normal — und die Seite selbst verbietet außerdem jede ausgehende Verbindung.
- Alles, was Sie laden, bleibt auf Ihrem Computer. Nur Ihre eigenen Begriffe werden gemerkt, in Ihrem eigenen Browser.
- Nutzen Sie erfundene Daten, wenn Sie die Software ausprobieren.
- Für alle, deren Identität geheim bleiben muss: „Vollständig schwarz“ für Gesichter verwenden, Bildränder, Hintergründe und Spiegelungen auf andere Hinweise prüfen und das Original von KI-Tools fernhalten.
