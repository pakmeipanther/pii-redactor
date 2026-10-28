**Read in:** [English](guide.en.md) · [Tiếng Việt](guide.vi.md) · [Deutsch](guide.de.md) · [Français](guide.fr.md)

---

# PII Redactor — User Guide for Beginners

## What is this tool for?

Imagine you're photocopying your ID card for a stranger — you'd naturally black out your name, phone number, and home address before handing it over, right? PII Redactor does exactly that, but for text, screenshots, and PDF files — it automatically finds and hides sensitive information (emails, phone numbers, IP addresses, passwords, database connection strings...) before you paste that content into ChatGPT, Claude, or any other AI tool.

> **The most important part:** this software makes no internet connection and sends no data anywhere — everything runs right on your own computer. You can turn off your Wi-Fi entirely while using it and it will still work normally — that's also how you can verify this for yourself.

![PII Redactor demo: a fake staff badge is scanned, the text is blacked out, the face is covered with a mosaic, and one extra area is drawn by hand](images/demo.gif)

*(Everything in this recording is made-up sample data.)*

**What it can do, in one list** — each item has its own section below:

- hide sensitive items in **text** (emails, phone numbers, IP addresses, keys, passwords...);
- keep **your own list** of words to always hide (company name, server names...);
- flag **suspected passwords and secrets** for you to confirm;
- black out sensitive text inside **images and screenshots**;
- let you review, switch off or add **areas by hand** before anything is saved;
- find and cover **faces** in images;
- clean **PDF** files, and turn **Word** and **PowerPoint** files into a redacted PDF;
- show and remove the hidden **metadata** of every file, and double-check each result before you can download it.

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

## Step 2 — Open the software and find your way around

1. Open the folder you unzipped in Step 1 and double-click the file named index.html. It opens in your browser.
1. In the top-right corner, pick your language (English, Français, Deutsch or Tiếng Việt).
1. The green line under the title says that no network connection is made. That is a promise you can check yourself (see "Good habits" at the end).

The page is read from top to bottom:

| Part | What it is for |
|---|---|
| **1. Paste text, or drop / choose a file** | The big text box for pasted text, and one drop zone for any file. You never choose the file type yourself — the software shows a "Detected:" line and opens the matching panel (image, PDF, Word or PowerPoint) just below. |
| **2. Custom internal terms** | Your own list of words to always hide. |
| **3. Data types to detect** | Tick or untick the kinds of data to look for in text. |
| **4. Result** | The text with the findings highlighted, and the download button. |
| **Image / PDF / Word / PowerPoint panel** | Appears only after you drop a file of that type. |

Which features work by just double-clicking index.html, and which need the local server of Step 3?

| Feature | Double-click index.html | Needs the local server (Step 3) |
|---|---|---|
| Text, custom terms, suspected secrets | yes | — |
| Word and PowerPoint files | yes | — |
| Images and screenshots (reading the text in them), drawing areas by hand, faces, PDF | no (use the local server) | yes |

When in doubt, use the local server: it works for everything.

## Step 3 (advanced, needed for images, faces and PDF) — Run a local server

Reading text inside images, finding faces and handling PDF files need one extra small technical step, due to a browser security restriction. "Running a local server" sounds scary, but it's really just typing one line of command. If you only need text, Word or PowerPoint redaction, you can skip this section.

#### macOS — running a local server

1. Open the Terminal app (press Cmd + Space, type "Terminal", press Enter).
1. Type cd (with a space after "cd"), then drag the folder you unzipped in Step 1 right into the Terminal window — the path will fill in automatically. Press Enter.
1. Type the following, then press Enter:

   ```
   python3 -m http.server 8000
   ```

   > If you see a red error "command not found: python3" — Python isn't installed on your machine. See the detailed Python installation guide below, or just use the text feature (Feature 1), which is enough on its own.
1. Open your browser and type into the address bar:

   ```
   http://localhost:8000
   ```
1. Now every feature (text, image, PDF) will work, used as described in the features below.
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
1. Use it as described in the features below.
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

## Feature 1 — Redacting text

*The easiest feature — nothing extra to install.*

1. Open index.html (Step 2).
1. Paste the text you want to check into the large box in part 1 — for example an email that contains a phone number and an address.
1. In part 3, "Data types to detect", leave the boxes ticked for the kinds of data you want to look for: Email, IPv4 address, IPv6 address, Phone number, API key / token, Credit/bank card number, Database connection string (in its two forms), Database connection port, and Password / random string (high entropy). All are ticked at the start.
1. Click "Scan & highlight".
1. In part 4, "Result", the findings are highlighted in red. A line above them tells you how many were found.
1. If it looks right, click "Download cleaned text (.txt)". In the saved file each finding is replaced by a label such as [EMAIL REDACTED] or [IP REDACTED]. This is the version you can safely paste into an AI tool.
1. "Clear all" empties the page so you can start again.

> **Always look at the highlighted parts before you download.** An automatic tool is a helper, never a guarantee.

## Feature 2 — Your own list of internal terms

The software cannot know that "srv-db-prod-02" or your company's name is secret. Tell it once, and it will always be hidden — in text, in images, in PDF, Word and PowerPoint files — with no questions asked.

1. In part 2, "Custom internal terms", type a word or phrase and click "Add". It appears as a small tag; click the tag's "Remove" to take it off.
1. Tick "Case-sensitive" only if capital letters matter (for example, to hide "Falcon" but not "falcon").
1. Terms are kept in your browser, on your computer only, so they are still there next time.
1. "Export list (.json)" saves your list as a file (a backup, or a way to move it to another computer). "Import list (.json)" loads such a file.
1. In images, a term also matches when the picture's text has different accents or (if "Case-sensitive" is not ticked) different capital letters, and phrases that span two lines are found too. If your terms contain accented letters but the OCR language is English, the software warns you — pick the picture's real language (Feature 4).

### Emptying the whole list: "Delete all terms"

When the list is long, removing terms one by one is tedious. "Delete all terms" removes them all, but never on the first click, because the list cannot be recovered afterwards:

1. A warning appears: the terms will be removed from this browser's local storage and cannot be recovered.
1. Choose "Export list (.json) first" to save a backup. The software then asks again ("Backup exported. Delete all … custom terms now?").
1. Or choose "Delete without exporting" if you really don't need a backup.
1. Only "Delete now" deletes. "Cancel" (or the Esc key) closes the warning and keeps everything.

## Feature 3 — Suspected passwords and secrets

Some secrets have no recognisable shape: a random-looking password, a token. The software spots strings that look random ("high entropy") but, because it can be wrong, it does **not** hide them by itself.

- **In text:** suspects are marked with the tooltip "Suspected password/secret (high entropy) — click to confirm redaction". Click one to confirm it ("Confirmed — will be redacted on download"); click again to take the confirmation back.
- **In an image:** suspects get a **yellow outline** and the pixels are **not** erased yet. A list under the picture, "Suspected passwords/secrets (high entropy) — tick to confirm redaction", lets you tick the ones to black out; the picture redraws at once.
- **In Word and PowerPoint files:** suspects are only reported. If one is really a secret, add it to your custom list (Feature 2) and convert again.
- You can switch the whole detection off by unticking "Password / random string (high entropy)" in "Data types to detect".

## Feature 4 — Images and screenshots

1. Drop a picture (PNG, JPEG or WEBP) on the drop zone, or click it to choose one. You can also **paste** a screenshot with Ctrl+V (Cmd+V on a Mac) anywhere on the page: it is recognised as an image and is not inserted as text.
1. The "Detected:" line shows "Image / screenshot" and the "Image / screenshot" panel opens. Above it, "Metadata of the original file" shows what the picture carries (Feature 10).
1. Under "OCR language:" choose the language **the picture is written in**. A wrong choice makes the software misread the text and can let sensitive words slip through.
1. Keep "Thorough scan (slower)" ticked. It reads the picture several times with different colour handling, which finds text on coloured backgrounds, light letters on dark headings and fancy fonts.
1. Click "Scan & black out sensitive regions". The first time, the reading model is loaded (a few seconds); then you see the progress and a line such as "Done — blacked out 3 sensitive region(s) in the image."
1. Look at the picture. Real black rectangles now cover the findings. Yellow outlines are suspects to confirm (Feature 3). Review the list of areas (Feature 5) and add what was missed (Feature 6, Feature 7).
1. Click "Download processed image" (the button also shows the file type: .png, .jpg or .webp) or "Download as PDF".
1. "Clear all" in the panel removes the picture and starts again.

**It is a real deletion.** The finished picture is rebuilt from your untouched original: the sensitive pixels are overwritten with black, not hidden under a see-through layer, so nobody can remove the black to see what was below.

**If the software missed something**, open "What the OCR read (and why each region was blacked out)" under the picture. It shows the text the software read and the reason for every black box. If the word you expected is not there, the software did not read it — choose the right language, keep "Thorough scan" on, or cover the spot by hand.

## Feature 5 — The list of covered areas

Under the picture, "Areas that will be covered: N (M drawn by you)" lists **everything** that will be hidden: what the software found by itself, the faces, and the areas you drew. They all live in this one list.

- Each line has a tick box. **Untick it** to keep that area visible (for example a false alarm); tick it again to cover it.
- A line reads "Automatic: the kind of data — the text", "Face #1" or "Drawn area #1".
- Hover over a line (or move to it with the Tab key) and a dashed blue frame shows where it is on the picture.
- Areas you drew have a "Remove" button.
- The picture and the download always follow this list: what is ticked is covered, what is not ticked is not.
- A new text scan replaces the automatic text areas; faces and the areas you drew are kept.

## Feature 6 — Drawing areas by hand

For anything the software cannot read: a logo, handwriting, a QR code, a name on a badge, a face.

1. Click "Draw a covered area" to switch the tool on (the button stays lit).
1. Drag over the area with the mouse, your finger or a pen. A light-blue frame follows you; let go to confirm. Esc cancels the stroke you are making. A simple click is ignored.
1. The new area is filled with solid black, like the automatic ones, and appears in the list as "Drawn area #…".
1. "Undo" and "Redo" (also Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z and Ctrl+Y) go back and forth through everything you change — drawing, removing, ticking or unticking an area.
1. "Remove my drawn areas" deletes all your drawings at once (you can still undo it).
1. Drawing works without scanning, so you can simply black out parts of a picture by hand and download it.

## Feature 7 — Hiding faces

1. Load an image (Feature 4). Scanning the text first is not necessary.
1. Under "Cover faces with:" choose how faces will be covered:
   - **"Solid black (irreversible)"** — the pixels are replaced; nothing of the face is left. Choose this whenever someone must not be recognised.
   - **"Large mosaic (hard to reverse, not guaranteed)"** — each big block keeps one average colour. Very hard to undo, but it is not a mathematical guarantee.
   - **"Blur (cosmetic — may be partly reversible)"** — a smoothing effect that can sometimes be partly reconstructed. Do not rely on it to protect someone's identity; the software shows a warning when you choose it.
1. Click "Detect faces". A message tells you how many were found ("Found 1 face.").
1. Every face appears in the list of areas (Feature 5) as "Face #1", "Face #2"... Untick one to leave that face visible. Changing the style updates the picture straight away.
1. **The detector is reliable only for faces looking roughly at the camera.** Faces that are turned, small, hidden or in poor light can be missed, so always look at the picture and cover missed faces with "Draw a covered area" (Feature 6). Drawn areas are always solid black.
1. The detector runs entirely in your browser (a small program and its data file are inside the software's vendor folder). It works even in Safari with Lockdown Mode. It needs the local server (Step 3); without it you get a message and can still draw by hand.

## Feature 8 — PDF files

1. Drop the PDF on the drop zone. The "PDF file" panel opens.
1. If the PDF is a **scan or a photo** of paper (you cannot select its text), tick "Also run OCR on each page — only needed if the PDF is a scan/image (no selectable text layer), slower", and choose "OCR language (if enabled):". For PDFs made on a computer this box is not needed.
1. Click "Scan & black out PDF". You see the progress page by page.
1. Click "Download processed PDF".

How it works: every page is **drawn again as a picture**, the sensitive parts are blacked out on that picture, and the pictures are put together into a new PDF. The original text layer and metadata therefore do not survive. The price is that the result behaves like a scanned document: you can no longer select or copy its text.

Face detection and hand-drawn areas are for the Image panel only. If a PDF contains a photo with faces, save that page as a picture and process it in the Image panel.

## Feature 9 — Word and PowerPoint files

1. Drop the .docx or .pptx file. The "Word file (.docx)" or "PowerPoint file (.pptx)" panel opens.
1. Click "Convert & redact → PDF", then "Download processed PDF" (the file is named redacted-text.pdf or redacted-slides.pdf).

What you get is deliberately a **plain-text PDF**, never a copy of your original file, because a Word or PowerPoint file can hide a lot (comments, old versions, notes, embedded objects). So the layout, tables, pictures, charts and animations are **not** carried over. Comments and text deleted under Track Changes are not included, and speaker notes of a PowerPoint file are not included either — only the text visible on the pages or slides. If you need the layout, save the file as a PDF yourself first and drop that PDF (Feature 8).

## Feature 10 — The metadata check

"Metadata" is information hidden inside a file that you can't see when you open it: who created it, with which program, when — and sometimes even where (a photo can carry the GPS location where it was taken).

- **When you drop a file** (an image, PDF, Word or PowerPoint file), a box called "Metadata of the original file" appears under the "Detected:" line. It lists what the file is carrying, with the actual values, so you can see exactly what would have been shared. Click "Hide values" if you want to hide the values (for example when sharing your screen); the field names stay visible. These values are only shown on your own computer.
- **The file you download is rebuilt from scratch**, so none of that information is copied into it.
- **Before every download, the tool checks the result again.** If everything is clean you'll see a green line: "Verified: the exported file contains no identifying metadata." If anything is left — or the tool can't be sure — the download is **blocked** and a red line explains why. Nothing is downloaded in that case.
- A photo's colour profile (ICC) may be listed in grey: it is technical information that doesn't identify you, and it doesn't block anything.
- The check can't look inside the picture itself, so it can't detect things like invisible watermarks.

## When something does not work

| What you see | What to do |
|---|---|
| A message about the file (file://) or "Error processing the image" | Images, faces and PDF need the local server — see Step 3. Text, Word and PowerPoint do not. |
| A message about **WebAssembly** (Safari with **Lockdown Mode**) | Lockdown Mode switches off WebAssembly, which reading text in images needs. Use Firefox or Chrome for images, or exclude this website from Lockdown Mode in Safari's settings for the site. Text, Word and PowerPoint files, drawing areas by hand and face detection still work. |
| A sensitive word was not hidden in an image | Check "OCR language:", keep "Thorough scan" on, open "What the OCR read", then add the word to your custom list or cover it by hand. |
| A black box covers something harmless | Untick that line in the list of areas (Feature 5). |
| "This file format wasn't recognized" | Supported: text (.txt), images (PNG, JPEG, WEBP), PDF, Word (.docx), PowerPoint (.pptx). |
| A red "DOWNLOAD BLOCKED" line | The final check found something it could not clear (Feature 10). Nothing was downloaded; please report it on the project's GitHub page. |

Still stuck? Take a screenshot (without sensitive content) and ask someone tech-savvy rather than guessing.

## Good habits

- The software is a helper, not a replacement for your own care: always review before you trust, because no tool catches 100% of cases.
- Want to verify that "no data is sent anywhere"? Turn off your Wi-Fi/network before opening the software. It still works normally — and the page itself also forbids outgoing connections.
- Everything you load stays on your computer. Only your custom terms are remembered, in your own browser.
- Use fake data when you want to try the software out.
- For anyone whose identity must stay secret: use "Solid black" for faces, check the picture's edges, backgrounds and reflections for other clues, and keep the original away from AI tools.
