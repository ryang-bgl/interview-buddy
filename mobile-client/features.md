# You are professional mobile app designer. You will design a react native mobile app
for the following LitBuddy mobile app:
- don't creates web-based applications that work excellently on mobile devices. don't design a mobile-first responsive web app that captures all your specifications.
- Design an application which works for native app using react native

# LitBuddy main functions
## This is a reactive app which targets ios and android, do not generate codes for the web environemnt.
## This is an app to help the user to prepare for DSA related leetcode practice
## it can help the user to review the solved problems and review them from time to time on mobile
## it can link to leetcode.com and get list of solved problems from the user session

# 🔑 User Registration & Login Journey

### 🎯 Goal
Make sign-up and sign-in **fast, secure, and low-friction**, while allowing users to sync their LeetCode data across devices.

---

## 1. Entry Points
- User opens the app for the first time.  
- Sees **onboarding screens** explaining benefits.  
- Final onboarding screen → **“Get Started”** button → goes to registration.  

---

## 2. Registration Flow
**Screen 1: Enter Email**
- User types email.  
- CTA: **“Continue”**.  
- App sends request to Firebase.  

**Screen 2: Enter Verification Code**
- User receives a **6-digit verification code** in email.  
- Input field for code + **resend option**.  
- Once correct → account created in Firebase.  

**Screen 3: Profile Setup (Optional)**
- Username (default = email prefix, editable).  
- Avatar (optional).  
- CTA: **“Finish”**.  

---

## 3. Login Flow
- Returning users:  
  1. Enter email.  
  2. Receive code.  
  3. Enter code → logged in.  
- (Optional) Add **Firebase password-based login** later for persistent users.  

---

## 4. Behind the Scenes (Tech)
- **Firebase Email Link Auth** or **Email + OTP**.  
- Firebase stores:  
  - `uid` (unique user ID).  
  - email.  
  - profile info (username, avatar).  
- All user-specific data (problems, notes, progress) stored under `uid`.  

---

## 5. Edge Cases
- ❌ Wrong code → error message.  
- ⏳ Expired code → “Resend code.”  
- 📌 Email already registered → fallback to login instead of new registration.  
- 📶 Offline mode → user can still use app, sync later.  

---

## ✅ User Journey Summary
1. Open app → Onboarding → Enter email.  
2. Receive email code → Enter → Account created.  
3. (Optional) Profile setup → Go to **Home Dashboard**.  
4. On future logins → Email → Code → **Home Dashboard**.  

# 🏠 Home Page (Post-Login)

### 🎯 Goals
1. Give the user a **clear snapshot of progress**.  
2. Provide **quick entry points** into study/review.  
3. Encourage consistency with **streaks and goals**.  

---

## 1. Top Section: Welcome & Quick Stats
- Greeting: “Hi, Alex 👋” (with avatar).  
- Daily streak indicator: “🔥 3-day streak”.  
- Progress bar: “2/5 problems reviewed today”.  

---

## 2. Continue Where You Left Off
- Card with **last reviewed problem**.  
- CTA button: **“Continue Review”** → takes user back into flashcard/review mode.  

---

## 3. Problem Overview
- Dashboard summary:  
  - ✅ Solved problems: **134**  
  - 📖 Reviewed: **47**  
  - 🔁 Need Review: **25**  
- Small pie chart or bar graph for visual context.  

---

## 4. Quick Actions
- **Review Mode** → starts a spaced repetition session.  
- **Browse Problems** → full searchable, filterable list.  
- **My Notes** → access all user notes across problems.  

---

## 5. Motivational / Rotating Tip
- Small banner at bottom, e.g.:  
  - “💡 Tip: Group problems by pattern (sliding window, two pointers).”  
  - “✨ You’re 2 problems away from hitting this week’s goal!”  

---

## ✅ Example Layout (Mobile)
1. **Top:** Greeting + streak/progress bar.  
2. **Middle:** Card → “Continue Review”.  
3. **Below:** Quick stats (3 tiles: Solved, Reviewed, To Review).  
4. **Bottom:** Quick actions (Review / Browse / Notes).  
5. **Footer banner:** Rotating tip or motivational message.  

## Problems screen
- allow the user to browser all problems, or by predefined list, such as "Grind 75", "Blind 75", "NeetCode 100", "Hot100", it also allow the user to create their own problem list.
