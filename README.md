# 🚨 PanicButton 

**A tool to help U of A students find deadlines when they're stressed.**

I built PanicButton because I was tired of opening five different 10-page syllabuses just to find out when my midterms were. It’s not a fancy planner, it’s just a way to get dates out of a PDF and into your calendar as fast as possible so you can stop worrying and start studying.

### Why I made this
University is stressful, and the "panic" usually hits when you realize you don't actually know what's due next week. Most apps try to make you organize your whole life. PanicButton just tries to give you a clear list of dates so you can breathe.

🌐 Live demo: https://panicbutton-app.vercel.app


## What it actually does
You give it a syllabus PDF, and it tries to find the deadlines for you.
1. **Upload:** Drop your PDF in.
2. **Check:** The app shows you the dates it found and where it found them in the text.
3. **Fix:** If it got a date wrong or missed something, you can fix it manually.
4. **Export:** It gives you a `.ics` file that you can drag into Google Calendar or Outlook.

## What it DOESN'T do
* It’s not an official U of A tool. Always check your eClass for the real dates.
* It doesn't save your files. Everything happens in your browser for privacy.
* It's not a "smart" bot that does your homework, it just reads dates.



## How I'm building it (Phase 1)

###  PDF Reading
It uses a library to pull text out of the PDF right in your browser. I didn't want to build a server that stores student files, so your syllabus stays on your computer.

### Finding Deadlines
Right now, I'm using "rule-based" logic. This means the code looks for specific patterns like "Midterm," "Due Date," or "Weight: 20%" near a date.

###  The "Check Your Work" Step
The app isn't perfect. I made sure it shows you the "Confidence Score" (how sure the code is) and the exact sentence it looked at. If the app is confused, it'll flag it so you can check it yourself.



## My Goals
* **Speed:** Under 90 seconds from "I'm panicked" to "I have a calendar list."
* **No Accounts:** You shouldn't have to sign up for *another* thing just to see your deadlines.
* **Keep it Calm:** No red flashing lights or timers. Just a simple, clean list.

## Project Stuff
* **Status:** Still working on the PDF text picker and the date rules.
* **Tech:** Built with React (Frontend) and some Python scripts for the date-finding logic.



## Why am I doing this?
I wanted to build something that actually helps with the "Where do I even start?" feeling. If it helps even one person spend 10 less minutes looking at a syllabus and 10 more minutes actually sleeping or studying, then it's a win.
