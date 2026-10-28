**Read in:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — User Guide for Beginners

## What is this tool for?

Imagine you're photocopying your ID card for a stranger — you'd naturally black out your name, phone number, and home address before handing it over, right? PII Redactor does exactly that, but for text, screenshots, and PDF files — it automatically finds and hides sensitive information (emails, phone numbers, IP addresses, passwords, database connection strings...) before you paste that content into ChatGPT, Claude, or any other AI tool.

> **The most important part:** this software makes no internet connection and sends no data anywhere — everything runs right on your own computer. You can turn off your Wi-Fi entirely while using it and it will still work normally — that's also how you can verify this for yourself.

## Step 1 — Download the software

1. Open your browser (Firefox or Brave are recommended — both are well known for security/privacy; Chrome, Safari, and Edge also work), and go to:

   ```
   https://github.com/pakmeipanther/pii-redactor
   ```
1. Find the green "Code" button, click it, then choose "Download ZIP".
1. The file will download to whichever folder your browser is set to save to — Downloads is used here only as the common default, but you can save it anywhere you like.

### Unzip the file (turn the .zip into a usable folder)

#### macOS

1. Open the folder where you just saved the zip file (e.g. Downloads, if using the default).
1. Double-click the downloaded file (named something like pii-redactor-main.zip).
1. macOS will automatically create a folder with the same name right next to it — done!

#### Windows

1. Open the folder where you just saved the zip file (e.g. Downloads, if using the default).
1. Right-click the zip file and choose "Extract All...".
1. A window will ask where to save it — leave the default and click "Extract".
1. A new folder with the same name will appear.

## Step 2 — Use the text redaction feature

*The easiest way — nothing extra to install*

1. Open the folder you unzipped in Step 1.
1. Find the file named index.html.
1. Double-click it — it will open automatically in your browser.
1. In the top-right corner there is a language selector — click it and choose your preferred language if needed.
1. Paste the text you want to check (e.g. an email containing a phone number, a home address...) into the large box at the top.
1. Click the "Scan & highlight" button.
1. Look at the "Result" section below — the parts highlighted in red are the sensitive information the software found.
1. If it looks right, click "Download cleaned text (.txt)" to save the redacted version — this is the version you can safely paste into an AI tool.

> **Note:** the software isn't 100% perfect — always review the highlighted parts before trusting them completely; don't just click download without checking.

## Step 3 (advanced, optional) — Use the image and PDF features

The screenshot and PDF features need one extra small technical step, due to a browser security restriction. "Running a local server" sounds scary, but it's really just typing one line of command. If you only need text redaction, you can skip this section.

#### macOS — running a local server

1. Open the Terminal app (press Cmd + Space, type "Terminal", press Enter).
1. Type cd (with a space after "cd"), then drag the folder you unzipped in Step 1 right into the Terminal window — the path will fill in automatically. Press Enter.
1. Type the following, then press Enter:

   ```
   python3 -m http.server 8000
   ```

   > If you see a red error "command not found: python3" — Python isn't installed on your machine. See the detailed Python installation guide below, or just use the text feature from Step 2, which is enough on its own.
1. Open your browser and type into the address bar:

   ```
   http://localhost:8000
   ```
1. Now every feature (text, image, PDF) will work, used the same way as in Step 2.
1. When you're done, go back to the Terminal window, press Ctrl + C, then close the window.

#### Windows — running a local server

1. Press the Windows key, type "cmd" or "PowerShell", press Enter to open a command window.
1. Type cd (with a space), then drag the unzipped folder into the window — the path will fill in automatically. Press Enter.
1. Type the following, then press Enter (on Windows it's usually "python", not "python3"):

   ```
   python -m http.server 8000
   ```

   > If you get a command-not-found error, Python isn't installed. See the detailed Python installation guide below — remember to tick "Add Python to PATH" during installation.
1. Open your browser and type:

   ```
   http://localhost:8000
   ```
1. Use it the same way as in Step 2.
1. When you're done, go back to the command window, press Ctrl + C to stop it, then close the window.

### Installing Python in detail (if your machine says "python command not found")

#### macOS

1. Open your browser and go to:

   ```
   https://www.python.org/downloads/
   ```
1. The page will detect you're on a Mac and show a yellow "Download Python 3.x.x" button — click it.
1. The installer (.pkg) will download into your Downloads folder.
1. Double-click it to start the installation.
1. An installer window will appear — keep clicking "Continue" through the steps until you see the "Install" button, then click it.
1. Your Mac may ask for your login password (the one you use to unlock your Mac) — enter it and click OK.
1. Wait a few minutes until you see "The installation was successful".
1. Close the installer window, then close any open Terminal window and open a new one so it picks up the newly installed Python.
1. Try typing the following again — it should now work without errors:

   ```
   python3 -m http.server 8000
   ```

#### Windows

1. Open your browser and go to:

   ```
   https://www.python.org/downloads/
   ```
1. The page will detect you're on Windows and show a yellow "Download Python 3.x.x" button — click it.
1. The installer (.exe) will download into your Downloads folder.
1. Double-click it to start the installation.
1. Very important: on the first installer screen, there's a small checkbox at the bottom labeled "Add python.exe to PATH" (or "Add Python to PATH") — you must tick this box before continuing, otherwise your machine won't recognize the python command afterward.
1. After ticking it, click "Install Now".
1. Wait a few minutes until you see "Setup was successful", then click "Close".
1. Close the old command window and open a new one so it picks up the newly installed Python.
1. Try typing the following again — it should now work without errors:

   ```
   python -m http.server 8000
   ```

> If you've done everything right and still get an error, your computer may need a restart for the change to take effect.

## Step 4 (automatic) — The metadata check

"Metadata" is information hidden inside a file that you can't see when you open it: who created it, with which program, when — and sometimes even where (a photo can carry the GPS location where it was taken).

- **When you drop a file** (an image, PDF, Word or PowerPoint file), a box called "Metadata of the original file" appears under the "Detected:" line. It lists what the file is carrying, with the actual values, so you can see exactly what would have been shared. Click "Hide values" if you want to hide the values (for example when sharing your screen); the field names stay visible. These values are only shown on your own computer.
- **The file you download is rebuilt from scratch**, so none of that information is copied into it.
- **Before every download, the tool checks the result again.** If everything is clean you'll see a green line: "Verified: the exported file contains no identifying metadata." If anything is left — or the tool can't be sure — the download is **blocked** and a red line explains why. Nothing is downloaded in that case.
- A photo's colour profile (ICC) may be listed in grey: it is technical information that doesn't identify you, and it doesn't block anything.
- The check can't look inside the picture itself, so it can't detect things like invisible watermarks.

## A few more notes

- The software is a helper, not a replacement for your own care — always review the highlighted parts before trusting them completely, since no automated tool catches 100% of cases.
- Want to verify for yourself that "no data is sent anywhere"? Turn off your Wi-Fi/network entirely before opening the software — you'll see it still works normally, proving no internet connection is being used.
- Run into an error you don't understand? Take a screenshot of it and ask someone tech-savvy (a friend, a family member) for help rather than guessing.
- Everything you upload and any "custom terms" (e.g. a company name to hide) are stored only on your own machine — nobody else can see them.
- For images and screenshots, keep "Thorough scan" ticked: it is slower, but it also finds text on coloured backgrounds. Pick the OCR language that matches the image, and if something was missed, open "What the OCR read" under the picture to see whether the software read that text at all. It also lists why each black box was drawn.
- Safari with Lockdown Mode turned on switches off a technology (WebAssembly) that reading text in images needs. If you see a message about WebAssembly, use Firefox or Chrome for images; text, Word and PowerPoint files are not affected.
- If the software misses something in an image (a logo, handwriting, a QR code, a face), switch on "Draw a covered area" and drag over it with the mouse or your finger. Drawn areas are filled with solid black just like the automatic ones, and you can undo them.
