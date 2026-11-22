# App Review notes

Apple asked for more information on the first submission (Guideline 2.1, Information
Needed, November 2026). Paste the block below into App Store Connect, under **App
Review Information → Notes**. Fill in the three bracketed parts first. The Notes
field holds at most 4,000 characters, and this block fits. Put the demo account's
email and password only in the **Sign-In Information** fields, never here.

## Notes to paste

```text
SCREEN RECORDING
[paste video link] (also attached to our reply in App Review)
Recorded on [iPhone model], iOS [version], build 1.0 ([build number]). It starts at app launch and shows: trying the app without an account, creating a new email account, choosing a course, a lesson, a boss duel, the Practice tab and the climb, hats, signing out and back in, and deleting the new account inside the app.

1. PURPOSE AND AUDIENCE
Prochoro helps high school students prepare for AP® exams. Steady daily study is the hard part, so Prochoro splits each of ten AP® courses into short lessons of practice questions with explanations, and keeps students coming back with a platypus companion, hats earned by studying, a boss duel at the end of each unit and an endless card-battle practice mode. Audience: high school students taking AP® courses (about ages 14 to 18). Free, with no ads, subscriptions or in-app purchases.

2. HOW TO USE THE APP
- No account needed: "Try it without an account" opens the app with progress kept on the device. To test accounts, use the demo account (Sign-In Information) via "Continue with email"; Apple, Google and Microsoft also work. "New here? Create an account" creates an email account instantly (no confirmation email). On sign-in, a guest's progress moves into the account (Me > Sign in or create an account).
- First launch: pick a course on "What are you studying?", tap Continue, then "Start from Unit 1" (or "Find my level" for a short placement check).
- Learn tab: tap Start (or any open circle on the path) to begin a lesson. After each answer the app says if it was right; "Why?" shows the explanation. Each unit ends with a timed boss duel.
- Practice tab: practise by topic, use Quick practice, or tap Climb for an endless 3-card battle powered by correct answers.
- Me tab: streak, lessons and XP; choose hats; Light/Dark/System appearance; Help, Privacy and Terms links.
- Account deletion: Me tab > Account > Delete account > "Delete my account forever". This permanently deletes the account and all its progress from our server. For accounts made with Sign in with Apple, the app asks Apple to confirm and revokes the Apple token. Without an account, Me > "Erase progress on this device" removes everything the app saved.
Please keep the demo account; create a new account to test deletion.
- The app has no user-generated content: users cannot post, message or share anything with each other, so there is nothing to report or block. There is no paid content.

3. EXTERNAL SERVICES
- Supabase (supabase.com): sign-in (authentication) and a database that stores each user's study progress so it syncs across devices. A Supabase Edge Function revokes the Sign in with Apple token when such an account is deleted.
- Sign in with Apple, Google Sign-In and Microsoft account sign-in: optional ways to sign in (OAuth).
- GitHub Pages: hosts our website, prochoro.net (support, privacy policy, terms).
No analytics, advertising, tracking, payment or AI services are used. All lessons and questions are built into the app.

4. REGIONS
The app works the same in every region. Its features and content are identical everywhere, and it is in English.

5. REGULATION AND THIRD-PARTY MATERIAL
The app is not in a regulated industry. All lessons, questions, explanations and artwork are original and written for Prochoro; no College Board exams, questions, logos or other materials are used. AP® is used only to name the courses the app covers, with the ® symbol and the College Board's own attribution statement, shown on the sign-in screen and in the Me tab: "AP® and Advanced Placement® are trademarks registered by the College Board, which is not affiliated with, and does not endorse, Prochoro." Practice questions link to the College Board's public course and exam description for reference.
```

## Screen recording

Apple wants it from a physical device on the latest iOS, starting from launch.

Before recording:

1. Update the iPhone to the newest iOS (Settings → General → Software Update).
2. Install the submitted build from TestFlight.
3. Turn on Do Not Disturb, so no notifications show up.
4. Add Screen Recording to Control Center (Settings → Control Center).
5. Use an email address you don't mind deleting. Don't use the demo account, which the reviewer needs.

Record, at a steady pace (about 2 to 4 minutes):

1. Start the recording on the Home Screen, then tap the Prochoro icon so the launch is in the video.
2. Tap "Try it without an account". Pick a course, tap Continue, then "Start from Unit 1".
3. Learn tab: tap Start and answer a few questions. Get one wrong and tap "Why?" on one. Finish the lesson.
4. Me tab → "Sign in or create an account" → "New here? Create an account". Enter the throwaway email and a password, then tap Create account. The lesson you just did comes with you.
5. Show a boss duel if you can reach one quickly, or a few seconds of one.
6. Practice tab: open Climb and play one round.
7. Me tab: tap a hat, then switch appearance to Dark and back.
8. Me tab → Account → Sign out, then sign back in with the same email and password.
9. Me tab → Account → Delete account → "Delete my account forever". Stop the recording after the app returns to the sign-in screen.

The video is saved to Photos. Trim the start and end there if needed, but keep the launch.

## Sending it

- Upload the video somewhere Apple can open without signing in, such as an iCloud Drive or Google Drive link set to "anyone with the link", or an unlisted YouTube video. Put that link at the top of the Notes.
- Also reply to Apple's message in App Store Connect (App Review → the submission's messages) and attach the video there.
- Then select **Resubmit to App Review** (or **Add for Review**, then **Submit**).

## Check before resubmitting

- Sign in to the demo account on the phone with the exact email and password typed into Sign-In Information.
- Try Google and Microsoft sign-in on the phone. The notes say both work. If Google says access is blocked, its app is still in Testing: in Google Auth Platform → Audience, publish it. If Microsoft fails, check that its app registration accepts personal accounts and that its client secret has not expired.
