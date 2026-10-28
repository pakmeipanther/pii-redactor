**Lesen auf:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — Benutzerhandbuch für Einsteiger

## Wofür ist dieses Tool gedacht?

Stellen Sie sich vor, Sie kopieren Ihren Ausweis für eine fremde Person — Sie würden sicher mit einem Stift Ihren Namen, Ihre Telefonnummer und Ihre Adresse abdecken, bevor Sie ihn weitergeben, oder? Genau das macht PII Redactor — aber mit Text, Screenshots und PDF-Dateien: Es findet und verbirgt automatisch sensible Informationen (E-Mails, Telefonnummern, IP-Adressen, Passwörter, Datenbank-Connection-Strings...), bevor Sie diesen Inhalt in ChatGPT, Claude oder ein anderes KI-Tool einfügen.

> **Das Wichtigste:** Diese Software stellt keine Internetverbindung her und sendet keinerlei Daten irgendwohin — die gesamte Verarbeitung erfolgt direkt auf Ihrem Computer. Sie können das WLAN beim Benutzen komplett ausschalten, und es funktioniert weiterhin normal — so können Sie dies auch selbst überprüfen.

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

## Schritt 2 — Die Textbereinigungsfunktion nutzen

*Der einfachste Weg — nichts zu installieren*

1. Öffnen Sie den in Schritt 1 entpackten Ordner.
1. Suchen Sie die Datei mit dem Namen index.html.
1. Doppelklicken Sie darauf — sie öffnet sich automatisch in Ihrem Browser.
1. Oben rechts im Bildschirm befindet sich eine Sprachauswahl — klicken Sie darauf und wählen Sie bei Bedarf "Deutsch", um die gesamte Oberfläche umzustellen.
1. Fügen Sie den zu prüfenden Text (z. B. eine E-Mail mit einer Telefonnummer, einer Adresse...) in das große Feld oben ein.
1. Klicken Sie auf die Schaltfläche "Scannen & markieren".
1. Schauen Sie sich unten den Bereich "Ergebnis" an — die rot markierten Stellen sind die vom Programm gefundenen sensiblen Informationen.
1. Wenn alles passt, klicken Sie auf "Bereinigten Text herunterladen (.txt)", um die bereinigte Version zu speichern — diese Version können Sie bedenkenlos in eine KI einfügen.

> **Hinweis:** Die Software ist nicht zu 100 % perfekt — überprüfen Sie die markierten Stellen immer, bevor Sie ihnen vollständig vertrauen; klicken Sie nicht einfach auf Herunterladen, ohne vorher zu prüfen.

## Schritt 3 (fortgeschritten, optional) — Die Funktionen für Bilder und PDF nutzen

Die beiden Funktionen für Screenshots und PDF-Dateien benötigen aufgrund einer Sicherheitsrichtlinie des Browsers einen kleinen zusätzlichen technischen Schritt. Der Begriff "einen lokalen Server starten" klingt beängstigend, ist aber tatsächlich nur das Eintippen einer einzigen Befehlszeile. Wenn Sie nur die Textfunktion benötigen, können Sie diesen Abschnitt überspringen.

#### macOS — lokalen Server starten

1. Öffnen Sie die App Terminal (drücken Sie Cmd + Leertaste, tippen Sie "Terminal", drücken Sie Enter).
1. Tippen Sie cd (mit einem Leerzeichen danach) und ziehen Sie dann den in Schritt 1 entpackten Ordner direkt in das Terminal-Fenster — der Pfad wird automatisch eingefügt. Drücken Sie Enter.
1. Tippen Sie Folgendes und drücken Sie Enter:

   ```
   python3 -m http.server 8000
   ```

   > Erscheint die rote Fehlermeldung "command not found: python3", bedeutet das, dass Python auf Ihrem Rechner nicht installiert ist. Siehe die ausführliche Python-Installationsanleitung weiter unten, oder nutzen Sie einfach nur die Textfunktion aus Schritt 2 — das reicht völlig aus.
1. Öffnen Sie Ihren Browser und geben Sie in die Adresszeile ein:

   ```
   http://localhost:8000
   ```
1. Jetzt funktionieren alle Funktionen (Text, Bild, PDF), genauso wie in Schritt 2.
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
1. Nutzen Sie es genauso wie in Schritt 2.
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

## Schritt 4 (automatisch) — Die Metadaten-Prüfung

„Metadaten" sind Informationen, die unsichtbar in einer Datei stecken: wer sie erstellt hat, mit welchem Programm, wann — und manchmal sogar wo (ein Foto kann den GPS-Standort der Aufnahme enthalten).

- **Sobald du eine Datei hineinziehst** (Bild, PDF, Word oder PowerPoint), erscheint unter der Zeile „Erkannt:" ein Kasten „Metadaten der Originaldatei". Er listet auf, was die Datei mitbringt, samt der echten Werte — so siehst du genau, was weitergegeben worden wäre. Mit „Werte ausblenden" kannst du die Werte verbergen (z. B. beim Bildschirmteilen); die Feldnamen bleiben sichtbar. Die Werte werden nur auf deinem eigenen Computer angezeigt.
- **Die heruntergeladene Datei wird komplett neu aufgebaut**, daher wird nichts davon übernommen.
- **Vor jedem Download prüft das Tool das Ergebnis erneut.** Ist alles sauber, siehst du eine grüne Zeile: „Verifiziert: Die exportierte Datei enthält keine identifizierenden Metadaten." Bleibt etwas übrig — oder kann das Tool es nicht sicher beurteilen —, wird der Download **blockiert** und eine rote Zeile nennt den Grund. Dann wird nichts heruntergeladen.
- Das Farbprofil (ICC) eines Fotos kann grau aufgeführt werden: Es ist rein technisch, identifiziert dich nicht und blockiert nichts.
- Die Prüfung kann nicht ins Bild selbst hineinschauen und erkennt daher z. B. unsichtbare Wasserzeichen nicht.

## Noch ein paar Hinweise

- Die Software unterstützt Sie nur, sie ersetzt nicht Ihre eigene Sorgfalt — überprüfen Sie die markierten Stellen immer, bevor Sie ihnen vollständig vertrauen, denn kein automatisches Werkzeug erkennt 100 % der Fälle.
- Möchten Sie selbst überprüfen, dass "keine Daten irgendwohin gesendet werden"? Schalten Sie WLAN/Netzwerk Ihres Rechners komplett aus, bevor Sie die Software öffnen — Sie werden sehen, dass sie weiterhin normal funktioniert, was beweist, dass keine Internetverbindung genutzt wird.
- Ein Fehler, den Sie nicht verstehen? Machen Sie einen Screenshot der Fehlermeldung und bitten Sie eine technisch versierte Person (Freund, Familienmitglied) um Hilfe, anstatt zu raten.
- Alle heruntergeladenen Daten und "eigene Suchbegriffe" (z. B. ein zu verbergender Firmenname) werden ausschließlich auf Ihrem eigenen Rechner gespeichert — niemand sonst kann sie sehen.
- Lass bei Bildern und Screenshots „Gründliche Analyse" angekreuzt: Sie ist langsamer, findet aber auch Text auf farbigem Hintergrund. Wähle die OCR-Sprache passend zum Bild, und öffne bei einem übersehenen Treffer das Feld „Was die OCR gelesen hat" unter dem Bild, um zu sehen, ob die Software den Text überhaupt gelesen hat. Dort steht auch, warum jedes schwarze Feld gezeichnet wurde.
- Safari mit aktiviertem Lockdown Mode (Blockierungsmodus) schaltet eine Technik (WebAssembly) ab, die das Lesen von Text in Bildern braucht. Wenn du eine Meldung zu WebAssembly siehst, nutze für Bilder Firefox oder Chrome; Text, Word- und PowerPoint-Dateien sind nicht betroffen.
